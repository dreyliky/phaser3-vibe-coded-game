import Phaser from 'phaser';
import { BaseLinkedWall } from '../objects/walls/base-linked-wall';
import { RockWall, BrickWall, PlankWall, SmoothWall } from '../objects/walls/wall-types';
import { GAME_CONFIG } from '../config/constants';

export class StructureGenerator {
    private scene: Phaser.Scene;
    private walls: Phaser.GameObjects.Group;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.walls = this.scene.add.group();
    }

    public generateWallRect(startX: number, startY: number, width: number, height: number, type: 'rock' | 'bricks' | 'planks' | 'smooth') {
        const tileSize = GAME_CONFIG.TILE_SIZE;
        
        // Ensure start position is aligned to grid
        const gridStartX = Math.round(startX / tileSize) * tileSize;
        const gridStartY = Math.round(startY / tileSize) * tileSize;

        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                const posX = gridStartX + (x * tileSize);
                const posY = gridStartY + (y * tileSize);
                
                let wall: BaseLinkedWall;
                
                switch (type) {
                    case 'rock': wall = new RockWall(this.scene, posX, posY); break;
                    case 'bricks': wall = new BrickWall(this.scene, posX, posY); break;
                    case 'planks': wall = new PlankWall(this.scene, posX, posY); break;
                    case 'smooth': wall = new SmoothWall(this.scene, posX, posY); break;
                }
                
                this.walls.add(wall);
            }
        }
    }

    public generatePalette(startX: number, startY: number, type: 'rock' | 'bricks' | 'planks' | 'smooth') {
        const tileSize = GAME_CONFIG.TILE_SIZE;
        const gridStartX = Math.round(startX / tileSize) * tileSize;
        const gridStartY = Math.round(startY / tileSize) * tileSize;

        // Generate 16 frames in a 4x4 grid
        for (let i = 0; i < 16; i++) {
            const x = i % 4;
            const y = Math.floor(i / 4);
            
            const posX = gridStartX + (x * tileSize);
            const posY = gridStartY + (y * tileSize);
            
            let wall: BaseLinkedWall;
            switch (type) {
                case 'rock': wall = new RockWall(this.scene, posX, posY); break;
                case 'bricks': wall = new BrickWall(this.scene, posX, posY); break;
                case 'planks': wall = new PlankWall(this.scene, posX, posY); break;
                case 'smooth': wall = new SmoothWall(this.scene, posX, posY); break;
            }
            
            wall.autoUpdate = false;
            wall.setFrame(i);
            
            // Add a text label above it
            this.scene.add.text(posX, posY - 20, `F:${i}`, { 
                fontSize: '16px', 
                color: '#ffffff',
                backgroundColor: '#000000' 
            }).setOrigin(0.5).setDepth(2000);

            this.walls.add(wall);
        }
    }

    public getWallsGroup(): Phaser.GameObjects.Group {
        return this.walls;
    }
}
