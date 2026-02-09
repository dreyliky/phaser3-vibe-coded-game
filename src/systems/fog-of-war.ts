import Phaser from 'phaser';
import { Player } from '../objects';
import { BaseLinkedWall } from '../objects/walls/base-linked-wall';
import { GAME_CONFIG } from '../config/constants';

const FOW_CONFIG = {
    VISION_RADIUS: 700,
    VIEW_CONE_ANGLE: Math.PI / 1.5, // 120 degrees
    MIN_VIEW_RADIUS: 120, // Always visible radius around player
    FOG_COLOR: 0x000000,
    MASK_RESOLUTION_SCALE: 0.05, // Low resolution for soft blurred edges
    DEPTH: 10000, // High depth to cover all game objects including vegetation
    TILE_SIZE: GAME_CONFIG.TILE_SIZE
};

interface VisibilityPoint {
    x: number;
    y: number;
    angle: number;
}

export class FogOfWarSystem {
    private scene: Phaser.Scene;
    private player: Player;
    
    // Rendering Components
    private memoryTexture!: Phaser.GameObjects.RenderTexture;
    private shadowGraphics!: Phaser.GameObjects.Graphics;
    
    // Soft Mask Components
    private visionGraphics!: Phaser.GameObjects.Graphics; // Used to draw the polygon
    private maskRT!: Phaser.GameObjects.RenderTexture; // Low-res render texture
    private maskImage!: Phaser.GameObjects.Image; // Image wrapping the RT
    
    // Raycasting Cache
    private segments: Phaser.Geom.Line[] = [];
    private endpoints: number[] = [];
    private rayLine: Phaser.Geom.Line;
    private tempPoint: Phaser.Geom.Point;

    constructor(scene: Phaser.Scene, player: Player) {
        this.scene = scene;
        this.player = player;
        this.rayLine = new Phaser.Geom.Line();
        this.tempPoint = new Phaser.Geom.Point();
        
        this.initialize();
    }

    private initialize() {
        this.createVisionGraphics();
        this.createSoftMaskSystem();
        this.createMemoryTexture();
        this.createShadowLayer();
        this.setupResizeHandler();
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

    private createMemoryTexture() {
        const { width, height } = this.scene.physics.world.bounds;
        
        this.memoryTexture = this.scene.add.renderTexture(0, 0, width, height)
            .setOrigin(0, 0)
            .setDepth(FOW_CONFIG.DEPTH)
            .setScrollFactor(1);
            
        this.memoryTexture.fill(FOW_CONFIG.FOG_COLOR, 1);
    }

    private createShadowLayer() {
        const { width, height } = this.scene.scale;
        
        this.shadowGraphics = this.scene.add.graphics()
            .setScrollFactor(0)
            .setDepth(FOW_CONFIG.DEPTH + 1)
            .fillStyle(FOW_CONFIG.FOG_COLOR, 0.5)
            .fillRect(0, 0, width, height);

        // Setup Bitmap Mask (Inverted)
        // Areas drawn in White on the maskImage will be HOLES in the shadow
        const mask = this.shadowGraphics.createBitmapMask(this.maskImage);
        mask.invertAlpha = true;
        this.shadowGraphics.setMask(mask);
    }

    private setupResizeHandler() {
        this.scene.scale.on('resize', this.handleResize, this);
    }

    private handleResize(gameSize: Phaser.Structs.Size) {
        // Resize Shadow Layer
        if (this.shadowGraphics) {
            this.shadowGraphics.clear();
            this.shadowGraphics.fillStyle(FOW_CONFIG.FOG_COLOR, 0.5);
            this.shadowGraphics.fillRect(0, 0, gameSize.width, gameSize.height);
        }
        
        // Resize Mask RT
        if (this.maskRT) {
            this.maskRT.resize(
                gameSize.width * FOW_CONFIG.MASK_RESOLUTION_SCALE, 
                gameSize.height * FOW_CONFIG.MASK_RESOLUTION_SCALE
            );
            this.maskImage.setScale(1 / FOW_CONFIG.MASK_RESOLUTION_SCALE);
        }
    }

    public update() {
        if (!this.player.active) return;

        // 1. Calculate Visibility
        const points = this.computeVisibilityPolygon();

        // 2. Render Vision Mask (Screen Space)
        this.renderVisionMask(points);
        
        // 3. Update Memory Texture (World Space)
        this.updateMemoryTexture();
    }

    private renderVisionMask(points: VisibilityPoint[]) {
        this.visionGraphics.clear();
        this.visionGraphics.fillStyle(0xffffff, 1);
        
        const camera = this.scene.cameras.main;
        const zoom = camera.zoom;
        const scale = FOW_CONFIG.MASK_RESOLUTION_SCALE;

        // Draw Cone Polygon
        if (points.length > 0) {
            this.visionGraphics.beginPath();
            
            // Start at player center
            const startX = (this.player.x - camera.scrollX) * zoom * scale;
            const startY = (this.player.y - camera.scrollY) * zoom * scale;
            this.visionGraphics.moveTo(startX, startY);
            
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

    private updateMemoryTexture() {
        const camera = this.scene.cameras.main;
        
        // Adjust mask image for World Space drawing
        const originalScale = this.maskImage.scaleX;
        
        // Scale mask to match World Coordinates relative to Camera Zoom
        this.maskImage.setScale(originalScale / camera.zoom);
        
        // Erase the visible area from the Memory Texture
        this.memoryTexture.erase(
            this.maskImage, 
            camera.scrollX, 
            camera.scrollY
        );
        
        // Restore original scale for Screen Space rendering (Shadow Layer)
        this.maskImage.setScale(originalScale);
    }

    private computeVisibilityPolygon(): VisibilityPoint[] {
        const origin = { x: this.player.x, y: this.player.y };
        const radius = FOW_CONFIG.VISION_RADIUS;

        // 1. Calculate Mouse Angle and Cone
        const pointer = this.scene.input.activePointer;
        const mouseAngle = Phaser.Math.Angle.Between(origin.x, origin.y, pointer.worldX, pointer.worldY);
        const halfCone = FOW_CONFIG.VIEW_CONE_ANGLE / 2;

        // 2. Collect Segments (Walls & Bounds)
        this.collectSegments(origin, radius);

        // 3. Determine Ray Angles
        const angles = this.collectRayAngles(mouseAngle, halfCone);

        // 4. Cast Rays
        return this.castRays(origin, radius, angles);
    }

    private collectSegments(origin: { x: number, y: number }, radius: number) {
        this.segments = [];
        this.endpoints = [];
        
        // Bounding Box for relevant walls
        const bbox = {
            x: origin.x - radius,
            y: origin.y - radius,
            w: radius * 2,
            h: radius * 2
        };
        
        this.addBoxSegments(bbox.x, bbox.y, bbox.w, bbox.h);

        const minGridX = Math.floor(bbox.x / FOW_CONFIG.TILE_SIZE);
        const maxGridX = Math.floor((bbox.x + bbox.w) / FOW_CONFIG.TILE_SIZE);
        const minGridY = Math.floor(bbox.y / FOW_CONFIG.TILE_SIZE);
        const maxGridY = Math.floor((bbox.y + bbox.h) / FOW_CONFIG.TILE_SIZE);

        for (let y = minGridY; y <= maxGridY; y++) {
            for (let x = minGridX; x <= maxGridX; x++) {
                if (BaseLinkedWall.getWallAt(x, y)) {
                    this.addWallSegments(x, y);
                }
            }
        }
    }

    private collectRayAngles(mouseAngle: number, halfCone: number): number[] {
        const angles = new Set<number>();

        // Filter endpoints to only those inside the cone
        this.endpoints.forEach(angle => {
            const diff = Phaser.Math.Angle.Wrap(angle - mouseAngle);
            if (Math.abs(diff) <= halfCone) {
                angles.add(angle);
                angles.add(angle - 0.0001);
                angles.add(angle + 0.0001);
            }
        });
        
        // Add fixed rays for smooth arc
        const fixedRays = 32;
        for (let i = 0; i <= fixedRays; i++) {
             const offset = -halfCone + (FOW_CONFIG.VIEW_CONE_ANGLE * (i / fixedRays));
             angles.add(mouseAngle + offset);
        }

        // Add Cone Boundaries
        angles.add(mouseAngle - halfCone);
        angles.add(mouseAngle + halfCone);

        // Sort angles by relative position in cone
        return Array.from(angles).sort((a, b) => {
            const diffA = Phaser.Math.Angle.Wrap(a - mouseAngle);
            const diffB = Phaser.Math.Angle.Wrap(b - mouseAngle);
            return diffA - diffB;
        });
    }

    private castRays(origin: { x: number, y: number }, radius: number, sortedAngles: number[]): VisibilityPoint[] {
        const points: VisibilityPoint[] = [];
        
        // Set helper ray origin once
        this.rayLine.x1 = origin.x;
        this.rayLine.y1 = origin.y;

        for (const angle of sortedAngles) {
            const dx = Math.cos(angle);
            const dy = Math.sin(angle);
            
            this.rayLine.x2 = origin.x + dx * radius;
            this.rayLine.y2 = origin.y + dy * radius;
            
            let closestDist = radius;
            
            // Check intersection with all collected segments
            for (const seg of this.segments) {
                if (Phaser.Geom.Intersects.LineToLine(this.rayLine, seg, this.tempPoint)) {
                    const d = Phaser.Math.Distance.Between(origin.x, origin.y, this.tempPoint.x, this.tempPoint.y);
                    if (d < closestDist) {
                        closestDist = d;
                    }
                }
            }
            
            points.push({
                x: origin.x + dx * closestDist,
                y: origin.y + dy * closestDist,
                angle: angle
            });
        }
        
        return points;
    }

    private addBoxSegments(x: number, y: number, w: number, h: number) {
        this.segments.push(new Phaser.Geom.Line(x, y, x + w, y));
        this.segments.push(new Phaser.Geom.Line(x + w, y, x + w, y + h));
        this.segments.push(new Phaser.Geom.Line(x + w, y + h, x, y + h));
        this.segments.push(new Phaser.Geom.Line(x, y + h, x, y));
        
        this.addEndpoint(x, y);
        this.addEndpoint(x + w, y);
        this.addEndpoint(x + w, y + h);
        this.addEndpoint(x, y + h);
    }

    private addWallSegments(gridX: number, gridY: number) {
        const x = gridX * FOW_CONFIG.TILE_SIZE;
        const y = gridY * FOW_CONFIG.TILE_SIZE;
        const s = FOW_CONFIG.TILE_SIZE;
        
        // Check neighbors to avoid adding internal segments
        const n = !!BaseLinkedWall.getWallAt(gridX, gridY - 1);
        const e = !!BaseLinkedWall.getWallAt(gridX + 1, gridY);
        const south = !!BaseLinkedWall.getWallAt(gridX, gridY + 1);
        const w = !!BaseLinkedWall.getWallAt(gridX - 1, gridY);

        if (!n) { 
            this.segments.push(new Phaser.Geom.Line(x, y, x + s, y));
            this.addEndpoint(x, y);
            this.addEndpoint(x + s, y);
        }
        if (!e) { 
            this.segments.push(new Phaser.Geom.Line(x + s, y, x + s, y + s));
            this.addEndpoint(x + s, y);
            this.addEndpoint(x + s, y + s);
        }
        if (!south) { 
            this.segments.push(new Phaser.Geom.Line(x + s, y + s, x, y + s));
            this.addEndpoint(x + s, y + s);
            this.addEndpoint(x, y + s);
        }
        if (!w) { 
            this.segments.push(new Phaser.Geom.Line(x, y + s, x, y));
            this.addEndpoint(x, y + s);
            this.addEndpoint(x, y);
        }
    }

    private addEndpoint(x: number, y: number) {
        const angle = Math.atan2(y - this.player.y, x - this.player.x);
        this.endpoints.push(angle);
    }
}