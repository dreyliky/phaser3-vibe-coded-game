import Phaser from 'phaser';
import { VegetationGenerator } from './vegetation-generator';
import { StructureGenerator } from './structure-generator';

export class MapGenerator {
    private scene: Phaser.Scene;
    private vegetationGenerator: VegetationGenerator;
    private structureGenerator: StructureGenerator;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.vegetationGenerator = new VegetationGenerator(scene);
        this.structureGenerator = new StructureGenerator(scene);
    }

    public generateMap(width: number, height: number) {
        // Future map generation logic (terrain, structures) goes here
        
        // Note: Vegetation is now generated AFTER walls in generateWalls() or separate call
        // this.vegetationGenerator.generateVegetation(width, height, 400);
    }

    public generateWalls(playerX: number, playerY: number) {
        // 2 cells to the right of player (2 * 80 = 160px)
        const startX = playerX + (2 * 80);
        const startY = playerY;
        
        // 6x6 square of walls
        // Using 'bricks' as a default test type
        this.structureGenerator.generateWallRect(startX, startY, 6, 6, 'bricks');

        // Add palette for debugging
        this.structureGenerator.generatePalette(startX, startY + (7 * 80), 'bricks');

        // Now generate vegetation, avoiding walls
        // We use a simple bounding box check or physics check
        const walls = this.structureGenerator.getWallsGroup().getChildren();
        const tileSize = 80;
        const plantMargin = 50; // Extra buffer to ensure trees don't spawn too close to walls

        const checkCollision = (x: number, y: number) => {
            // Check if point is inside any wall tile + margin
            for (const wallObj of walls) {
                const wall = wallObj as Phaser.Physics.Arcade.Sprite;
                const minDistance = (tileSize / 2) + plantMargin;
                
                if (Math.abs(x - wall.x) < minDistance && Math.abs(y - wall.y) < minDistance) {
                    return true;
                }
            }
            return false;
        };

        // Generate vegetation
        const mapWidth = this.scene.physics.world.bounds.width;
        const mapHeight = this.scene.physics.world.bounds.height;
        this.vegetationGenerator.generateVegetation(mapWidth, mapHeight, 400, checkCollision);
    }
    
    public getVegetation() {
        return this.vegetationGenerator.getPlantsGroup();
    }

    public getWalls() {
        return this.structureGenerator.getWallsGroup();
    }
}
