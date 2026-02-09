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
    private flashlight!: Phaser.GameObjects.Graphics;
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
        
        this.createOverlays();
        this.setupInput();
    }
    
    public get playerEntity(): Player {
        return this.player;
    }

    private createOverlays() {
        const width = this.scene.scale.width;
        const height = this.scene.scale.height;

        // RenderTexture for darkness
        this.darknessTexture = this.scene.add.renderTexture(0, 0, width, height);
        this.darknessTexture.setOrigin(0, 0); // Explicitly set origin to top-left
        this.darknessTexture.setDepth(9000);
        this.darknessTexture.setScrollFactor(0);
        
        // Flashlight Graphics (for the beam color)
        this.flashlight = this.scene.add.graphics({ x: 0, y: 0 });
        this.flashlight.setDepth(9001);
        this.flashlight.setScrollFactor(0);
        
        // Handle resize
        this.scene.scale.on('resize', this.handleResize, this);
    }
    
    private handleResize(gameSize: Phaser.Structs.Size) {
        if (this.darknessTexture) {
            this.darknessTexture.resize(gameSize.width, gameSize.height);
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

        // 1. Erase from Darkness (Cut the hole) - Only if dark
        if (isDark) {
            const holeGraphics = this.scene.make.graphics({ x: 0, y: 0 });
            holeGraphics.fillStyle(0xffffff, 1);
            holeGraphics.beginPath();
            holeGraphics.moveTo(localPoints[0].x, localPoints[0].y);
            for (let i = 1; i < localPoints.length; i++) {
                holeGraphics.lineTo(localPoints[i].x, localPoints[i].y);
            }
            holeGraphics.closePath();
            holeGraphics.fillPath();
            
            // Use erase method for cleaner hole cutting
            this.darknessTexture.erase(holeGraphics);
            holeGraphics.destroy();
        }

        // 2. Draw Yellow Beam on Flashlight Layer (Additive)
        this.flashlight.fillStyle(0xFFD700, 0.2); // Faint yellow
        this.flashlight.setBlendMode(Phaser.BlendModes.ADD);
        
        this.flashlight.beginPath();
        this.flashlight.moveTo(localPoints[0].x, localPoints[0].y);
        for (let i = 1; i < localPoints.length; i++) {
            this.flashlight.lineTo(localPoints[i].x, localPoints[i].y);
        }
        this.flashlight.closePath();
        this.flashlight.fillPath();
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
