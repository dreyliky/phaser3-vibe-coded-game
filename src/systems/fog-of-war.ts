import Phaser from 'phaser';
import { Player } from '../objects';
import { GAME_CONFIG, DEPTHS } from '../config/constants';
// @ts-ignore
import PhaserRaycaster from 'phaser-raycaster';

const FOW_CONFIG = {
    VISION_RADIUS: 700,
    VIEW_CONE_ANGLE: Math.PI / 1.5, // 120 degrees
    MIN_VIEW_RADIUS: 120, // Always visible radius around player
    FOG_COLOR: 0x000000,
    MASK_RESOLUTION_SCALE: 0.05, // Low resolution for soft blurred edges
    DEPTH: DEPTHS.FOG_OF_WAR, // High depth to cover all game objects including vegetation
    TILE_SIZE: GAME_CONFIG.TILE_SIZE
};

interface VisibilityPoint {
    x: number;
    y: number;
}

export class FogOfWarSystem {
    private scene: Phaser.Scene;
    private player: Player;
    
    // Raycaster
    private raycaster!: any; // Using any to avoid strict type issues with the plugin
    private ray!: any;

    // Rendering Components
    private fogChunks: Map<string, Phaser.GameObjects.RenderTexture> = new Map();
    private readonly CHUNK_SIZE = 1280; // 16 * 80 (matches ChunkSystem roughly)
    private shadowRT!: Phaser.GameObjects.RenderTexture; // New layer for visited areas (50% opacity)
    
    // Soft Mask Components
    private visionGraphics!: Phaser.GameObjects.Graphics; // Used to draw the polygon
    private maskRT!: Phaser.GameObjects.RenderTexture; // Low-res render texture
    private maskImage!: Phaser.GameObjects.Image; // Image wrapping the RT
    
    // State for optimization
    private lastPlayerX: number = 0;
    private lastPlayerY: number = 0;
    private lastPointerX: number = 0;
    private lastPointerY: number = 0;
    private lastScrollX: number = 0;
    private lastScrollY: number = 0;
    private frameCount: number = 0;
    private readonly UPDATE_INTERVAL = 2; // Update every 2 frames
    
    // Dynamic Mapping State
    private currentMappedObjects: Phaser.GameObjects.GameObject[] = [];
    private lastMapUpdatePos: Phaser.Math.Vector2 = new Phaser.Math.Vector2();
    private readonly MAP_UPDATE_DISTANCE = 200; // Update map when moved 200px
    
    // Groups for mapping
    private wallsGroup?: Phaser.GameObjects.Group | Phaser.Physics.Arcade.StaticGroup;
    private treeHitboxesGroup?: Phaser.GameObjects.Group;

    constructor(scene: Phaser.Scene, player: Player, 
                wallsGroup?: Phaser.GameObjects.Group | Phaser.Physics.Arcade.StaticGroup,
                treeHitboxesGroup?: Phaser.GameObjects.Group) {
        this.scene = scene;
        this.player = player;
        this.wallsGroup = wallsGroup;
        this.treeHitboxesGroup = treeHitboxesGroup;
        
        this.initialize();
    }

    private initialize() {
        this.initializeRaycaster();
        this.createVisionGraphics();
        this.createSoftMaskSystem();
        // Memory texture is now managed dynamically via chunks
        this.createShadowLayer();
        this.setupResizeHandler();
        this.setupChunkUpdates();
    }

    private setupChunkUpdates() {
        // Listen for chunk updates to force-refresh obstacles
        this.scene.events.on('chunks-updated', () => {
            this.updateMappedObjects(true);
        });
        
        // Cleanup listener when scene shuts down
        this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.scene.events.off('chunks-updated');
        });
    }

    private initializeRaycaster() {
        // Access plugin
        // @ts-ignore
        const raycasterPlugin = this.scene.raycasterPlugin;
        if (!raycasterPlugin) {
            console.warn('PhaserRaycaster plugin not found! Ensure it is registered in config.');
            return;
        }

        // Get world bounds
        const bounds = this.scene.physics.world.bounds;

        // Create Raycaster with world bounds
        this.raycaster = raycasterPlugin.createRaycaster({
            debug: false,
            boundingBox: {
                x: bounds.x,
                y: bounds.y,
                width: bounds.width,
                height: bounds.height
            }
        });

        // Create Ray
        this.ray = this.raycaster.createRay({
            origin: { x: this.player.x, y: this.player.y }
        });
        
        // Set Ray Properties
        this.ray.setRayRange(FOW_CONFIG.VISION_RADIUS);

        // Initial Map Update
        this.updateMappedObjects(true);
    }

    private updateMappedObjects(force: boolean = false) {
        if (!this.wallsGroup && !this.treeHitboxesGroup) return;

        // Check distance
        const dist = Phaser.Math.Distance.Between(
            this.player.x, this.player.y,
            this.lastMapUpdatePos.x, this.lastMapUpdatePos.y
        );

        if (!force && dist < this.MAP_UPDATE_DISTANCE) {
            return;
        }

        // Check if any currently mapped object is destroyed/inactive
        const hasDestroyedObjects = this.currentMappedObjects.some(obj => !obj || !obj.scene || !obj.active);

        // If we have destroyed objects, we MUST reset the raycaster because passing destroyed objects 
        // to removeMappedObjects() causes a crash, but NOT removing them leaves ghost obstacles.
        if (hasDestroyedObjects) {
            this.rebuildRaycaster();
        }

        // Update last pos
        this.lastMapUpdatePos.set(this.player.x, this.player.y);

        // Calculate cull radius (Vision + Buffer)
        const checkRadius = FOW_CONFIG.VISION_RADIUS + this.MAP_UPDATE_DISTANCE;
        const checkRadiusSq = checkRadius * checkRadius;
        const pX = this.player.x;
        const pY = this.player.y;

        const nearbyObjects: Phaser.GameObjects.GameObject[] = [];

        // Helper to check and add
        const checkAndAdd = (group: Phaser.GameObjects.Group | Phaser.Physics.Arcade.StaticGroup) => {
            // @ts-ignore
            const children = group.getChildren ? group.getChildren() : group.children.entries;
            
            for (const child of children) {
                // @ts-ignore
                if (!child.active) continue; // Skip inactive

                // Fast distance check
                // @ts-ignore
                const dx = child.x - pX;
                // @ts-ignore
                const dy = child.y - pY;
                
                if (dx * dx + dy * dy <= checkRadiusSq) {
                    nearbyObjects.push(child);
                }
            }
        };

        if (this.wallsGroup) checkAndAdd(this.wallsGroup);
        if (this.treeHitboxesGroup) checkAndAdd(this.treeHitboxesGroup);

        // If we just rebuilt the raycaster, it's empty, so we don't need to remove anything.
        // If we didn't rebuild, we need to remove objects that are no longer relevant.
        if (!hasDestroyedObjects && this.currentMappedObjects.length > 0) {
            this.raycaster.removeMappedObjects(this.currentMappedObjects);
        }

        if (nearbyObjects.length > 0) {
            // Map as static (false) because they don't move per frame
            this.raycaster.mapGameObjects(nearbyObjects, false);
        }

        this.currentMappedObjects = nearbyObjects;
    }

    private rebuildRaycaster() {
        if (this.ray) {
            this.ray.destroy();
        }
        if (this.raycaster) {
            this.raycaster.destroy();
        }

        // Re-initialize
        // @ts-ignore
        const raycasterPlugin = this.scene.raycasterPlugin;
        const bounds = this.scene.physics.world.bounds;

        this.raycaster = raycasterPlugin.createRaycaster({
            debug: false,
            boundingBox: {
                x: bounds.x,
                y: bounds.y,
                width: bounds.width,
                height: bounds.height
            }
        });

        this.ray = this.raycaster.createRay({
            origin: { x: this.player.x, y: this.player.y }
        });
        
        this.ray.setRayRange(FOW_CONFIG.VISION_RADIUS);
        
        // Clear current mapped objects list as raycaster is fresh
        this.currentMappedObjects = [];
    }

    private createVisionGraphics() {
        this.visionGraphics = this.scene.make.graphics({ x: 0, y: 0 }, false);
    }

    private createSoftMaskSystem() {
        const { width, height } = this.scene.scale;
        
        // 1. Create Low-res Render Texture for soft edges
        this.maskRT = this.scene.add.renderTexture(
            0, 0, 
            width * FOW_CONFIG.MASK_RESOLUTION_SCALE, 
            height * FOW_CONFIG.MASK_RESOLUTION_SCALE
        ).setVisible(false);

        // Force LINEAR filtering for smooth upscaling (blur effect)
        if (this.maskRT.texture) {
            this.maskRT.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
        }
            
        // 2. Create Image to scale it back up
        this.maskImage = this.scene.add.image(0, 0, this.maskRT.texture)
            .setOrigin(0, 0)
            .setScale(1 / FOW_CONFIG.MASK_RESOLUTION_SCALE)
            .setVisible(false)
            .setScrollFactor(0);
    }

    private createFogChunk(x: number, y: number) {
        const chunkX = x * this.CHUNK_SIZE;
        const chunkY = y * this.CHUNK_SIZE;
        
        const rt = this.scene.add.renderTexture(chunkX, chunkY, this.CHUNK_SIZE, this.CHUNK_SIZE)
            .setOrigin(0, 0)
            .setDepth(FOW_CONFIG.DEPTH)
            .setScrollFactor(1);
            
        rt.fill(FOW_CONFIG.FOG_COLOR, 1);
        this.fogChunks.set(`${x},${y}`, rt);
    }

    private createShadowLayer() {
        const { width, height } = this.scene.scale;
        
        // Shadow RT covers the screen, moves with camera (scrollFactor 0)
        // It sits BELOW the Memory Texture but ABOVE the game world
        this.shadowRT = this.scene.add.renderTexture(0, 0, width, height)
            .setOrigin(0, 0)
            .setScrollFactor(0)
            .setDepth(FOW_CONFIG.DEPTH - 1); // Depth 9999
    }

    private setupResizeHandler() {
        this.scene.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
            const width = gameSize.width;
            const height = gameSize.height;
            
            // Resize mask RT
            this.maskRT.resize(
                width * FOW_CONFIG.MASK_RESOLUTION_SCALE, 
                height * FOW_CONFIG.MASK_RESOLUTION_SCALE
            );
            
            // Update mask image scale
            this.maskImage.setScale(1 / FOW_CONFIG.MASK_RESOLUTION_SCALE);
            
            // Resize Shadow RT
            this.shadowRT.resize(width, height);
        });
    }

    public update() {
        if (!this.ray) return;
        
        // Throttling: Update logic only every N frames
        this.frameCount++;
        if (this.frameCount % this.UPDATE_INTERVAL !== 0) {
            return;
        }

        // SAFETY CHECK: If any mapped object is destroyed, force update to prevent raycaster crash
        if (this.currentMappedObjects.some(obj => !obj || !obj.scene || !obj.active)) {
            this.updateMappedObjects(true);
        }

        const pointer = this.scene.input.activePointer;
        const camera = this.scene.cameras.main;
        
        // Check if anything significant changed
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.lastPlayerX, this.lastPlayerY);
        const pointerDist = Phaser.Math.Distance.Between(pointer.x, pointer.y, this.lastPointerX, this.lastPointerY);
        const scrollDist = Phaser.Math.Distance.Between(camera.scrollX, camera.scrollY, this.lastScrollX, this.lastScrollY);

        // Update only if moved > 0.5px or pointer moved > 1px or camera moved
        if (dist < 0.5 && pointerDist < 1 && scrollDist < 0.5) {
            return;
        }

        // Update state
        this.lastPlayerX = this.player.x;
        this.lastPlayerY = this.player.y;
        this.lastPointerX = pointer.x;
        this.lastPointerY = pointer.y;
        this.lastScrollX = camera.scrollX;
        this.lastScrollY = camera.scrollY;
        
        // Update Mapped Objects (Dynamic Culling)
        this.updateMappedObjects();

        const points = this.computeVisibilityPolygon();
        this.renderVisionMask(points);
        
        // 1. Update Shadow Layer (Screen Space, Dynamic)
        this.updateShadowLayer();
        
        // 2. Update Memory Texture (World Space, Persistent)
        this.updateMemoryTexture();
    }

    private renderVisionMask(points: VisibilityPoint[]) {
        this.visionGraphics.clear();
        this.visionGraphics.fillStyle(0xffffff, 1);
        
        const camera = this.scene.cameras.main;
        const zoom = camera.zoom;
        const scale = FOW_CONFIG.MASK_RESOLUTION_SCALE;
        
        if (points.length > 0) {
            this.visionGraphics.beginPath();
            
            // Start at player (screen space scaled)
            const playerScreenX = (this.player.x - camera.scrollX) * zoom * scale;
            const playerScreenY = (this.player.y - camera.scrollY) * zoom * scale;
            this.visionGraphics.moveTo(playerScreenX, playerScreenY);
            
            for (const p of points) {
                this.visionGraphics.lineTo(
                    (p.x - camera.scrollX) * zoom * scale, 
                    (p.y - camera.scrollY) * zoom * scale
                );
            }
            
            this.visionGraphics.closePath();
            this.visionGraphics.fillPath();
        }

        // Draw Personal Light Circle
        const minRadius = FOW_CONFIG.MIN_VIEW_RADIUS * zoom * scale;
        this.visionGraphics.fillCircle(
            (this.player.x - camera.scrollX) * zoom * scale,
            (this.player.y - camera.scrollY) * zoom * scale,
            minRadius
        );
        
        // Render to Mask Render Texture
        this.maskRT.clear();
        this.maskRT.draw(this.visionGraphics);
    }

    private updateShadowLayer() {
        // Clear previous frame
        this.shadowRT.clear();
        
        // Fill with 50% black (0.5 opacity)
        this.shadowRT.fill(FOW_CONFIG.FOG_COLOR, 0.5);
        
        // Erase current vision cone
        // Since maskImage is currently in Screen Space (because updateMemoryTexture hasn't run yet),
        // we can just erase at 0,0
        this.shadowRT.erase(this.maskImage, 0, 0);
    }

    private updateMemoryTexture() {
        const camera = this.scene.cameras.main;
        const { width, height } = this.scene.scale;
        
        // Calculate visible chunks range
        // Using floor for correct negative coordinate handling
        // Expand by 1 chunk to ensure coverage
        const startX = Math.floor(camera.scrollX / this.CHUNK_SIZE) - 1;
        const startY = Math.floor(camera.scrollY / this.CHUNK_SIZE) - 1;
        const endX = Math.floor((camera.scrollX + width) / this.CHUNK_SIZE) + 1;
        const endY = Math.floor((camera.scrollY + height) / this.CHUNK_SIZE) + 1;

        // Adjust mask image for World Space drawing ONCE
        const originalScale = this.maskImage.scaleX;
        this.maskImage.setScale(originalScale / camera.zoom);

        for (let x = startX; x <= endX; x++) {
            for (let y = startY; y <= endY; y++) {
                const key = `${x},${y}`;
                
                if (!this.fogChunks.has(key)) {
                    this.createFogChunk(x, y);
                }
                
                const chunk = this.fogChunks.get(key)!;
                
                // Erase the visible area from this chunk
                // Chunk is at chunk.x, chunk.y
                // MaskImage represents view at camera.scrollX, camera.scrollY
                // Draw offset = camera.scrollX - chunk.x
                
                chunk.erase(
                    this.maskImage, 
                    camera.scrollX - chunk.x, 
                    camera.scrollY - chunk.y
                );
            }
        }
        
        // Restore original scale
        this.maskImage.setScale(originalScale);
    }

    private computeVisibilityPolygon(): VisibilityPoint[] {
        // Update Ray Origin
        this.ray.setOrigin(this.player.x, this.player.y);

        const pointer = this.scene.input.activePointer;
        const camera = this.scene.cameras.main;
        
        const playerScreenX = (this.player.x - camera.scrollX) * camera.zoom;
        const playerScreenY = (this.player.y - camera.scrollY) * camera.zoom;
        
        // Calculate central angle
        const mouseAngle = Phaser.Math.Angle.Between(
            playerScreenX, 
            playerScreenY, 
            pointer.x, 
            pointer.y
        );

        // MANUAL CASTING LOOP
        // We cast N rays uniformly to ensure a smooth cone arc and consistent visibility
        // even when there are no obstacles (which causes castCone to fail/glitch).
        // Using the plugin's cast() is efficient as it uses the spatial hash.
        
        const numRays = 40; // Sufficient for a smooth arc
        const coneAngle = FOW_CONFIG.VIEW_CONE_ANGLE;
        const startAngle = mouseAngle - coneAngle / 2;
        const angleStep = coneAngle / (numRays - 1);
        
        const points: VisibilityPoint[] = [];
        
        // Ensure the ray has the correct range
        this.ray.setRayRange(FOW_CONFIG.VISION_RADIUS);

        for (let i = 0; i < numRays; i++) {
            const angle = startAngle + (i * angleStep);
            this.ray.setAngle(angle);
            
            // cast() returns the intersection point or FALSE if nothing hit
            let intersection = this.ray.cast();
            
            // If no obstacle hit, project to max range
            if (!intersection) {
                intersection = {
                    x: this.player.x + Math.cos(angle) * FOW_CONFIG.VISION_RADIUS,
                    y: this.player.y + Math.sin(angle) * FOW_CONFIG.VISION_RADIUS
                };
            }
            
            points.push({ x: intersection.x, y: intersection.y });
        }
        
        return points;
    }
}
