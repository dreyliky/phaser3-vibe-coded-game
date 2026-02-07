import Phaser from 'phaser';
import { BaseLinkedWall } from '../objects/walls/base-linked-wall';
import { RockWall, BrickWall, PlankWall, SmoothWall } from '../objects/walls/wall-types';

export class StructureGenerator {
    private scene: Phaser.Scene;
    private walls: Phaser.GameObjects.Group;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.walls = this.scene.add.group();
    }

    public generateWallRect(startX: number, startY: number, width: number, height: number, type: 'rock' | 'bricks' | 'planks' | 'smooth') {
        const tileSize = 80;
        
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

    public getWallsGroup() {
        return this.walls;
    }
}
