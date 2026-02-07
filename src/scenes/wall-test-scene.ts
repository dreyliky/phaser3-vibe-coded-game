import Phaser from 'phaser';
import { StructureGenerator } from '../systems/structure-generator';
import { BaseLinkedWall } from '../objects/walls/base-linked-wall';
import { BaseBrickWall } from '../objects/walls/wall-types';
import { GAME_CONFIG } from '../config/constants';

export class WallTestScene extends Phaser.Scene {
    private structureGenerator!: StructureGenerator;
    private controls!: Phaser.Cameras.Controls.FixedKeyControl;

    constructor() {
        super('WallTestScene');
    }

    create() {
        // Set background to white
        this.cameras.main.setBackgroundColor('#ffffff');

        // Initialize Structure Generator
        this.structureGenerator = new StructureGenerator(this);

        // Center of the screen
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;
        const TILE_SIZE = GAME_CONFIG.TILE_SIZE;

        // Align to grid (80px)
        const startX = Math.round(centerX / TILE_SIZE) * TILE_SIZE - (3 * TILE_SIZE); // Center the 6x6 block
        const startY = Math.round(centerY / TILE_SIZE) * TILE_SIZE - (3 * TILE_SIZE);

        // Generate 6x6 wall rect
        this.structureGenerator.generateWallRect(startX, startY, 6, 6, 'bricks');

        // Generate Palette below
        this.structureGenerator.generatePalette(startX, startY + (7 * TILE_SIZE), 'bricks');

        // Add some instructions
        this.add.text(10, 10, 'Wall Test Scene\nLeft Click to Toggle Wall\nArrows/Drag to Move Camera\n(+/-) to Zoom', {
            fontSize: '16px',
            color: '#000000',
            backgroundColor: '#ffffff'
        }).setScrollFactor(0).setDepth(100);

        // Back to Menu Button
        const backButton = this.add.text(10, this.scale.height - 40, 'Back to Menu', {
            fontSize: '20px',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        })
        .setScrollFactor(0)
        .setDepth(100)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
            this.scene.start('MainMenu');
        })
        .on('pointerover', () => backButton.setStyle({ fill: '#ffff00' }))
        .on('pointerout', () => backButton.setStyle({ fill: '#ffffff' }));

        // Camera Controls
        if (this.input.keyboard) {
            const cursors = this.input.keyboard.createCursorKeys();
            const controlConfig = {
                camera: this.cameras.main,
                left: cursors.left,
                right: cursors.right,
                up: cursors.up,
                down: cursors.down,
                zoomIn: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.PLUS),
                zoomOut: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.MINUS),
                speed: 0.5
            };
    
            this.controls = new Phaser.Cameras.Controls.FixedKeyControl(controlConfig);
        }

        // Interaction: Toggle Wall on Click
        this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
            // If we dragged significantly, don't treat it as a click
            if (pointer.getDistance() > 10) return;

            // Convert screen to world coordinates
            const worldPoint = pointer.positionToCamera(this.cameras.main) as Phaser.Math.Vector2;
            
            // Snap to grid
            const gridX = Math.round(worldPoint.x / TILE_SIZE);
            const gridY = Math.round(worldPoint.y / TILE_SIZE);
            
            // Toggle wall
            const existingWall = BaseLinkedWall.getWallAt(gridX, gridY);
            if (existingWall) {
                existingWall.destroy();
            } else {
                new BaseBrickWall(this, gridX * TILE_SIZE, gridY * TILE_SIZE);
            }
        });

        // Enable mouse drag for camera
        this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            if (pointer.isDown) {
                this.cameras.main.scrollX -= (pointer.x - pointer.prevPosition.x) / this.cameras.main.zoom;
                this.cameras.main.scrollY -= (pointer.y - pointer.prevPosition.y) / this.cameras.main.zoom;
            }
        });
        
        // Mouse wheel zoom
        this.input.on('wheel', (pointer: Phaser.Input.Pointer, gameObjects: unknown, deltaX: number, deltaY: number, deltaZ: number) => {
            const zoom = this.cameras.main.zoom - deltaY * 0.001;
            this.cameras.main.setZoom(Phaser.Math.Clamp(zoom, 0.1, 4));
        });
    }

    update(time: number, delta: number) {
        if (this.controls) {
            this.controls.update(delta);
        }
    }
}
