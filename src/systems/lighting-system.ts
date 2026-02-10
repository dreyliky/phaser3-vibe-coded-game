import Phaser from 'phaser';
import { Player } from '../objects';
import { TimeSystem } from './time-system';

export class LightingSystem {
    private scene: Phaser.Scene;
    private player: Player;
    private timeSystem: TimeSystem;
    private wallsGroup?: Phaser.GameObjects.Group | Phaser.Physics.Arcade.StaticGroup;
    private treeHitboxesGroup?: Phaser.GameObjects.Group;
    
    private darknessTexture!: Phaser.GameObjects.RenderTexture;
    private lightRT!: Phaser.GameObjects.RenderTexture; // Intermediate texture for soft lighting
    private flashlight!: Phaser.GameObjects.Graphics;
    private lightSprite!: Phaser.GameObjects.Image; // The gradient sprite
    private isFlashlightOn: boolean = false;
    
    private readonly DARK_COLOR = 0x000005; // Very dark blue/black
    private readonly MAX_DARKNESS = 0.85; // Max opacity of darkness

    constructor(scene: Phaser.Scene, player: Player, timeSystem: TimeSystem, 
                wallsGroup?: Phaser.GameObjects.Group | Phaser.Physics.Arcade.StaticGroup,
                treeHitboxesGroup?: Phaser.GameObjects.Group) {
        this.scene = scene;
        this.player = player;
        this.timeSystem = timeSystem;
        this.wallsGroup = wallsGroup;
        this.treeHitboxesGroup = treeHitboxesGroup;
        
        this.createFlashlightTexture();
        this.createOverlays();
        this.setupInput();
    }
    
    public get playerEntity(): Player {
        return this.player;
    }

    private createFlashlightTexture() {
        if (this.scene.textures.exists('flashlight_cone')) return;
        
        const size = 512;
        
        // Using CanvasTexture for better gradient control
        const texture = this.scene.textures.createCanvas('flashlight_cone', size, size);
        if (texture) {
            const context = texture.getContext();
            // Create radial gradient
            // x0, y0, r0, x1, y1, r1
            const gradient = context.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
            
            // Core is bright (Gold/Yellow)
            // Alpha is HIGH (1.0) for effective erasing of darkness.
            // We will control visual intensity via lightRT.setAlpha().
            gradient.addColorStop(0, 'rgba(255, 220, 100, 1.0)'); 
            gradient.addColorStop(0.3, 'rgba(255, 200, 50, 0.7)');
            gradient.addColorStop(0.7, 'rgba(255, 180, 0, 0.3)');
            gradient.addColorStop(1, 'rgba(255, 180, 0, 0)');
            
            context.fillStyle = gradient;
            context.fillRect(0, 0, size, size);
            
            texture.refresh();
        }
    }

    private createOverlays() {
        const width = this.scene.scale.width;
        const height = this.scene.scale.height;

        // RenderTexture for darkness
        this.darknessTexture = this.scene.add.renderTexture(0, 0, width, height);
        this.darknessTexture.setOrigin(0, 0); // Explicitly set origin to top-left
        this.darknessTexture.setDepth(9000);
        this.darknessTexture.setScrollFactor(0);
        
        // Intermediate RT for masking light and displaying the beam
        this.lightRT = this.scene.add.renderTexture(0, 0, width, height);
        this.lightRT.setOrigin(0, 0);
        this.lightRT.setVisible(true); // Visible overlay
        this.lightRT.setDepth(9002); // Above darkness
        this.lightRT.setScrollFactor(0);
        this.lightRT.setBlendMode(Phaser.BlendModes.ADD); // Additive blending for glow
        this.lightRT.setAlpha(0.3); // Soften the visual overlay so it's not opaque gold
        
        // Flashlight Sprite (Gradient)
        this.lightSprite = this.scene.add.image(0, 0, 'flashlight_cone');
        this.lightSprite.setVisible(false); // Used for drawing to RT
        this.lightSprite.setOrigin(0.5, 0.5); // Center pivot

        // Graphics for Raycasting Visualization (The "Hard" Mask)
        this.flashlight = this.scene.add.graphics();
        this.flashlight.setDepth(9001); // Above darkness (for the beam color)
        this.flashlight.setBlendMode(Phaser.BlendModes.ADD); // Additive blending for light
        this.flashlight.setVisible(false); // We'll manage visibility manually
        
        // Handle resize
        this.scene.scale.on('resize', this.handleResize, this);
    }
    
    private handleResize(gameSize: Phaser.Structs.Size) {
        if (this.darknessTexture) {
            this.darknessTexture.resize(gameSize.width, gameSize.height);
        }
        if (this.lightRT) {
            this.lightRT.resize(gameSize.width, gameSize.height);
        }
    }

    private setupInput() {
        if (this.scene.input.keyboard) {
            this.scene.input.keyboard.on('keydown-F', () => {
                this.isFlashlightOn = !this.isFlashlightOn;
            });
        }
    }

    public get isFlashlightActive(): boolean {
        return this.isFlashlightOn;
    }
    
    public getFlashlightAngle(): number {
        const pointer = this.scene.input.activePointer;
        const camera = this.scene.cameras.main;
        const playerX = (this.player.x - camera.scrollX) * camera.zoom;
        const playerY = (this.player.y - camera.scrollY) * camera.zoom;
        
        return Phaser.Math.Angle.Between(playerX, playerY, pointer.x, pointer.y);
    }

    public update() {
        const { intensity } = this.timeSystem.getSunPosition();
        
        // Intensity 1 = Noon (Bright), 0 = Night (Dark)
        const targetAlpha = (1 - intensity) * this.MAX_DARKNESS;
        
        this.darknessTexture.clear();
        this.flashlight.clear();
        
        // Draw darkness if needed
        if (targetAlpha > 0.05) {
            this.darknessTexture.fill(this.DARK_COLOR, targetAlpha);
        }
        
        // Always draw flashlight if on (even during day for visual feedback)
        if (this.isFlashlightOn) {
            this.drawFlashlight(targetAlpha > 0.05);
        } else {
            this.lightRT.clear(); // Ensure previous frames are cleared
        }
    }

    private drawFlashlight(isDark: boolean) {
        const pointer = this.scene.input.activePointer;
        const playerXWorld = this.player.x;
        const playerYWorld = this.player.y;
        
        // Calculate angle in screen space for consistency
        const camera = this.scene.cameras.main;
        const playerXScreen = (playerXWorld - camera.scrollX) * camera.zoom;
        const playerYScreen = (playerYWorld - camera.scrollY) * camera.zoom;
        const angle = Phaser.Math.Angle.Between(playerXScreen, playerYScreen, pointer.x, pointer.y);
        
        const radius = 300;
        const coneWidth = Math.PI / 4; // 45 degrees
        
        // Raycast to get polygon points
        const points = this.castRays(playerXWorld, playerYWorld, angle, coneWidth, radius);
        
        // Convert points to local camera space for drawing on fixed RT/Graphics
        const localPoints = points.map(p => ({
            x: (p.x - camera.scrollX) * camera.zoom,
            y: (p.y - camera.scrollY) * camera.zoom
        }));

        if (localPoints.length < 3) return;

        // Prepare the hard polygon mask (White for Masking)
        // We use WHITE here so that when we multiply with the gradient, the gradient's color is preserved.
        const holeGraphics = this.scene.make.graphics({ x: 0, y: 0 }, false);
        holeGraphics.fillStyle(0xFFFFFF, 1); // White for mask
        holeGraphics.beginPath();
        holeGraphics.moveTo(localPoints[0].x, localPoints[0].y);
        for (let i = 1; i < localPoints.length; i++) {
            holeGraphics.lineTo(localPoints[i].x, localPoints[i].y);
        }
        holeGraphics.closePath();
        holeGraphics.fillPath();
        
        // Prepare the Light Sprite (Soft Gradient)
        // Texture is 512x512. Radius is 300.
        // We want the center of texture to be at player.
        // Scale to cover the beam.
        const scale = (radius * 2.5) / 512; 
        
        this.lightSprite.setPosition(localPoints[0].x, localPoints[0].y);
        this.lightSprite.setScale(scale);
        
        // Compositing:
        // 1. Clear LightRT
        this.lightRT.clear();
        
        // 2. Draw the Hard Polygon (Gold)
        this.lightRT.draw(holeGraphics, 0, 0);
        
        // 3. Draw the Soft Gradient (Gold/Yellow) with MULTIPLY
        // This masks the hard polygon with the gradient, creating a soft lighted area
        this.lightSprite.setBlendMode(Phaser.BlendModes.MULTIPLY);
        // Important: Draw at the sprite's position! passing 0,0 draws at RT origin.
        this.lightRT.draw(this.lightSprite, this.lightSprite.x, this.lightSprite.y, 1, 0xffffff);
        
        // 4. Erase Darkness with the Result (Soft Cut)
        if (isDark) {
            // Temporarily set alpha to 1.0 for maximum erasing power
            // The texture content has the gradient alpha (1.0 -> 0.0), which provides the soft edge.
            this.lightRT.setAlpha(1.0);
            this.darknessTexture.erase(this.lightRT);
            // Restore low alpha for the visual overlay (so it looks like a beam of light, not a solid wall)
            this.lightRT.setAlpha(0.3);
        }
        
        // 5. No need to draw back into darknessTexture. 
        // lightRT is now a visible overlay with ADD blend mode.
        
        holeGraphics.destroy();
    }

    private castRays(originX: number, originY: number, angle: number, coneWidth: number, radius: number): { x: number, y: number }[] {
        const points: { x: number, y: number }[] = [];
        points.push({ x: originX, y: originY });

        const numRays = 60; // Increased for better precision
        const startAngle = angle - coneWidth / 2;
        const angleStep = coneWidth / (numRays - 1);
        
        // Collect nearby obstacles
        const obstacles: Phaser.Geom.Rectangle[] = [];
        
        const checkAndAdd = (group: Phaser.GameObjects.Group | Phaser.Physics.Arcade.StaticGroup | undefined) => {
            if (!group) return;
            group.getChildren().forEach((obj: any) => {
                if (!obj.active) return;
                // Simple distance check
                if (Math.abs(obj.x - originX) < radius + 100 && Math.abs(obj.y - originY) < radius + 100) {
                     if (obj.body) {
                         // Create a Geom Rectangle from body
                         obstacles.push(new Phaser.Geom.Rectangle(obj.body.x, obj.body.y, obj.body.width, obj.body.height));
                     }
                }
            });
        };

        checkAndAdd(this.wallsGroup);
        checkAndAdd(this.treeHitboxesGroup);

        const ray = new Phaser.Geom.Line();

        for (let i = 0; i < numRays; i++) {
            const currentAngle = startAngle + i * angleStep;
            const rayEndX = originX + Math.cos(currentAngle) * radius;
            const rayEndY = originY + Math.sin(currentAngle) * radius;
            
            ray.setTo(originX, originY, rayEndX, rayEndY);
            
            let closestPoint: { x: number, y: number } = { x: rayEndX, y: rayEndY };
            let minDist = radius * radius; // Squared comparison

            for (const rect of obstacles) {
                const intersection = Phaser.Geom.Intersects.GetLineToRectangle(ray, rect);
                if (intersection.length > 0) {
                    for (const p of intersection) {
                        const d2 = (p.x - originX) * (p.x - originX) + (p.y - originY) * (p.y - originY);
                        if (d2 < minDist) {
                            minDist = d2;
                            closestPoint = { x: p.x, y: p.y };
                        }
                    }
                }
            }
            points.push(closestPoint);
        }

        return points;
    }
}
