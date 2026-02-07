import Phaser from 'phaser';
import { VegetationGenerator } from './vegetation-generator';
import { StructureGenerator } from './structure-generator';
import { CaveGenerator } from './cave-generator';
import { TerrainSystem, TerrainType } from './terrain-system';

export class MapGenerator {
    private scene: Phaser.Scene;
    private vegetationGenerator: VegetationGenerator;
    private structureGenerator: StructureGenerator;
    private caveGenerator: CaveGenerator | null = null;
    private terrainSystem: TerrainSystem | null = null;

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

        // Initialize Terrain System
        this.terrainSystem = new TerrainSystem(this.scene, gridWidth, gridHeight, tileSize);

        // Generate Soil Patches (Cellular Automata)
        // We generate a separate grid for soil distribution
        const soilGrid: number[][] = [];
        for (let x = 0; x < gridWidth; x++) {
            soilGrid[x] = [];
            for (let y = 0; y < gridHeight; y++) {
                // 40% chance to start as soil
                soilGrid[x][y] = Math.random() < 0.4 ? 1 : 0;
            }
        }

        // Smooth Soil Grid (3 iterations)
        for (let i = 0; i < 3; i++) {
            const newGrid: number[][] = [];
            for (let x = 0; x < gridWidth; x++) {
                newGrid[x] = [];
                for (let y = 0; y < gridHeight; y++) {
                    let neighbors = 0;
                    for (let nx = x - 1; nx <= x + 1; nx++) {
                        for (let ny = y - 1; ny <= y + 1; ny++) {
                            if (nx >= 0 && nx < gridWidth && ny >= 0 && ny < gridHeight) {
                                if (nx !== x || ny !== y) {
                                    neighbors += soilGrid[nx][ny];
                                }
                            }
                        }
                    }
                    // Standard CA rules for smooth blobs
                    if (neighbors > 4) newGrid[x][y] = 1;
                    else if (neighbors < 4) newGrid[x][y] = 0;
                    else newGrid[x][y] = soilGrid[x][y];
                }
            }
            // Copy back
            for (let x = 0; x < gridWidth; x++) {
                for (let y = 0; y < gridHeight; y++) {
                    soilGrid[x][y] = newGrid[x][y];
                }
            }
        }

        // Populate Terrain Grid based on Cave Generator and Soil Grid
        for (let x = 0; x < gridWidth; x++) {
            for (let y = 0; y < gridHeight; y++) {
                // Default is SAND (handled by TerrainSystem init)

                // If soil patch exists, set SOIL
                if (soilGrid[x][y] === 1) {
                    this.terrainSystem.setTerrain(x, y, TerrainType.SOIL);
                }

                // If inside cave, overwrite with ROCK (Higher priority/layer)
                // Actually, setTerrain overwrites the grid value.
                // Since Rock is conceptually "above" or "replaces" soil/sand in this specific map logic (cave overrides outside),
                // we check cave last or just overwrite.
                if (this.caveGenerator.isInsideCave(x, y)) {
                    this.terrainSystem.setTerrain(x, y, TerrainType.ROCK);
                }

                const posX = x * tileSize;
                const posY = y * tileSize;

                if (caveGrid[x][y] === 1) {
                    // Place a wall
                    this.structureGenerator.generateWallRect(posX, posY, 1, 1, 'rock');
                }
            }
        }

        // Render Terrain with Blending
        this.terrainSystem.render();

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
}
