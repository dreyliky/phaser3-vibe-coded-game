import Phaser from 'phaser';
import { VegetationGenerator } from './vegetation-generator';
import { StructureGenerator } from './structure-generator';
import { CaveGenerator } from './cave-generator';

export class MapGenerator {
    private scene: Phaser.Scene;
    private vegetationGenerator: VegetationGenerator;
    private structureGenerator: StructureGenerator;
    private caveGenerator: CaveGenerator | null = null;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.vegetationGenerator = new VegetationGenerator(scene);
        this.structureGenerator = new StructureGenerator(scene);
    }

    public generateMap(width: number, height: number) {
        const tileSize = 80;
        const gridWidth = Math.ceil(width / tileSize);
        const gridHeight = Math.ceil(height / tileSize);
        const margin = 15; // 15 blocks margin as requested

        // Initialize Cave Generator
        this.caveGenerator = new CaveGenerator(gridWidth, gridHeight, margin);
        const caveGrid = this.caveGenerator.generate();

        // Generate Walls and Floor based on Cave Grid
        for (let x = 0; x < gridWidth; x++) {
            for (let y = 0; y < gridHeight; y++) {
                const posX = x * tileSize;
                const posY = y * tileSize;

                // 1. Always place SAND as base layer (z: -100)
                this.scene.add.image(posX, posY, 'background_sand')
                    .setDisplaySize(tileSize, tileSize)
                    .setDepth(-100)
                    .setOrigin(0, 0); // Align sand with grid too

                // 2. Place CAVE FLOOR (z: -90) with Vertex Alpha Blending
                // We calculate alpha for each corner based on neighbors to create smooth gradient
                const tl = this.getVertexAlpha(x, y);
                const tr = this.getVertexAlpha(x + 1, y);
                const bl = this.getVertexAlpha(x, y + 1);
                const br = this.getVertexAlpha(x + 1, y + 1);

                // Only draw if at least one corner has some opacity
                if (tl > 0 || tr > 0 || bl > 0 || br > 0) {
                    const floor = this.scene.add.image(posX, posY, 'floor_cave')
                        .setDisplaySize(tileSize, tileSize)
                        .setDepth(-90)
                        .setOrigin(0, 0); // Important for correct alignment with grid when using vertex alpha
                    
                    // Reset position because setOrigin(0,0) shifts it
                    // Original code used default origin (0.5, 0.5) implicitly?
                    // Let's check. Default is 0.5.
                    // If we use 0.5, posX/posY are centers.
                    // If we use 0, posX/posY are top-left.
                    // My loop uses posX = x * tileSize.
                    // If I used default origin before, image was centered at (x*80, y*80).
                    // So grid cell (0,0) image was at (0,0). Top-left of image was (-40, -40).
                    // This seems wrong for a grid system usually.
                    // But let's check StructureGenerator.
                    // generateWallRect: posX = gridStartX + (x * tileSize).
                    // And BaseWall uses x,y as passed. Arcade Sprite default origin is 0.5.
                    // So walls are centered on grid intersections? No.
                    // If x=0, y=0. Image at 0,0. Center at 0,0.
                    // So tile covers -40 to 40.
                    // This means grid (0,0) is actually centered at 0,0 world space.
                    // But usually we want (0,0) to be top-left of the world.
                    
                    // Let's stick to default origin (0.5) but adjust logic if needed.
                    // Actually, for vertex alpha to match grid corners visually, it's easier to think in corners.
                    // But Phaser's setAlpha(tl, tr, bl, br) maps to the image corners regardless of origin.
                    // So if we keep origin 0.5, TL is top-left of the image.
                    
                    floor.setAlpha(tl, tr, bl, br);
                }

                if (caveGrid[x][y] === 1) {
                    // Place a wall
                    this.structureGenerator.generateWallRect(posX, posY, 1, 1, 'rock');
                }
            }
        }

        // Generate Vegetation
        // Constraints:
        // 1. Not on walls (handled by existing logic if we pass wall check)
        // 2. Not INSIDE the cave (cave floor)
        // 3. Not in the void? Wait, vegetation is for the "outside".
        
        // Define "Inside Cave" area: The rectangular region defined by margin.
        // Actually, the user said "Inside the cave should not spawn trees".
        // The cave is the area [margin, width-margin] x [margin, height-margin].
        // The "walls" are also in this area.
        // So effectively, trees only spawn in the margin (outer ring).
        
        const isInsideCaveArea = (x: number, y: number) => {
            const tileX = Math.floor(x / tileSize);
            const tileY = Math.floor(y / tileSize);
            
            if (this.caveGenerator) {
                return this.caveGenerator.isInsideCave(tileX, tileY);
            }

            // Fallback to old logic if generator is missing (should not happen)
            return tileX >= margin && tileX < gridWidth - margin &&
                   tileY >= margin && tileY < gridHeight - margin;
        };

        const walls = this.structureGenerator.getWallsGroup().getChildren();
        const plantMargin = 50;

        const checkCollision = (x: number, y: number) => {
            // First check if inside cave area (global exclusion)
            if (isInsideCaveArea(x, y)) {
                return true;
            }

            // Then check specific wall proximity (for trees in the margin near the outer cave wall)
            for (const wallObj of walls) {
                const wall = wallObj as Phaser.Physics.Arcade.Sprite;
                const minDistance = (tileSize / 2) + plantMargin;
                
                if (Math.abs(x - wall.x) < minDistance && Math.abs(y - wall.y) < minDistance) {
                    return true;
                }
            }
            return false;
        };

        this.vegetationGenerator.generateVegetation(width, height, 800, checkCollision);
    }

    
    public getVegetation() {
        return this.vegetationGenerator.getPlantsGroup();
    }

    public getWalls() {
        return this.structureGenerator.getWallsGroup();
    }

    private getVertexAlpha(vx: number, vy: number): number {
        // Vertex (vx, vy) is the Top-Left corner of grid cell (vx, vy).
        // It is shared by 4 cells:
        // (vx-1, vy-1), (vx, vy-1)
        // (vx-1, vy),   (vx, vy)
        
        let caveCount = 0;
        const neighbors = [
            { x: vx - 1, y: vy - 1 },
            { x: vx, y: vy - 1 },
            { x: vx - 1, y: vy },
            { x: vx, y: vy }
        ];

        for (const p of neighbors) {
            // Check if this neighbor cell is inside cave
            // We can treat out-of-bounds as "not cave" (0)
            if (this.caveGenerator && this.caveGenerator.isInsideCave(p.x, p.y)) {
                caveCount++;
            }
        }

        // Return average (0.0 to 1.0)
        return caveCount / 4;
    }

    private getNeighborCaveCount(x: number, y: number, width: number, height: number): number {
        let count = 0;
        for (let nx = x - 1; nx <= x + 1; nx++) {
            for (let ny = y - 1; ny <= y + 1; ny++) {
                if (nx === x && ny === y) continue;
                
                if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                    if (this.caveGenerator && this.caveGenerator.isInsideCave(nx, ny)) {
                        count++;
                    }
                }
            }
        }
        return count;
    }
}
