import Phaser from 'phaser';
import { VegetationGenerator } from './vegetation-generator';
import { StructureGenerator } from './structure-generator';
import { CaveGenerator } from './cave-generator';
import { BiomeGenerator, BiomeType } from './biome-generator';
import { TerrainSystem, TerrainType } from '../systems/terrain-system';
import { pickWeighted } from '../utils/random';
import { WORLD_GEN_CONFIG } from '../config/world-generation-config';

export class MapGenerator {
    private scene: Phaser.Scene;
    private vegetationGenerator: VegetationGenerator;
    private structureGenerator: StructureGenerator;
    private caveGenerator: CaveGenerator | null = null;
    private biomeGenerator: BiomeGenerator | null = null;
    private terrainSystem: TerrainSystem | null = null;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.vegetationGenerator = new VegetationGenerator(scene);
        this.structureGenerator = new StructureGenerator(scene);
    }

    public generateMap(width: number, height: number) {
        const tileSize = WORLD_GEN_CONFIG.tileSize;
        const gridWidth = Math.ceil(width / tileSize);
        const gridHeight = Math.ceil(height / tileSize);
        const margin = WORLD_GEN_CONFIG.cave.margin;

        // Initialize Biome Generator
        this.biomeGenerator = new BiomeGenerator(gridWidth, gridHeight);
        const biomeGrid = this.biomeGenerator.generate();

        // Initialize Cave Generator
        this.caveGenerator = new CaveGenerator(gridWidth, gridHeight, margin);
        const caveGrid = this.caveGenerator.generate();

        // Initialize Terrain System
        this.terrainSystem = new TerrainSystem({
            scene: this.scene,
            width: gridWidth,
            height: gridHeight,
            tileSize: tileSize
        });

        // Generate Soil Patches (Cellular Automata)
        // const soilGrid = this.generateAutomataGrid(gridWidth, gridHeight, 0.4, 3);
        
        // Generate Rock Patches (Cellular Automata) - Less frequent than soil
        const rockGrid = this.generateAutomataGrid(gridWidth, gridHeight, WORLD_GEN_CONFIG.general.rockPatchChance, WORLD_GEN_CONFIG.general.rockPatchIterations);

        // Populate Terrain Grid based on Biomes, Cave Generator and Soil/Rock Grids
        for (let x = 0; x < gridWidth; x++) {
            for (let y = 0; y < gridHeight; y++) {
                const biome = biomeGrid[x][y];
                
                // Set Base Terrain by Biome with Weighted Random
                const definitions = WORLD_GEN_CONFIG.biomes[biome].terrainWeights;
                let type = pickWeighted(definitions) || TerrainType.SOIL;

                // Add details/patches (optional, maybe specific to biome)
                // For now, let's allow Rock patches everywhere except Swamp?
                if (rockGrid[x][y] === 1 && biome !== BiomeType.SWAMP) {
                    type = TerrainType.ROCK;
                }

                // If inside cave, overwrite with ROCK (Highest priority for cave coherence)
                if (this.caveGenerator.isInsideCave(x, y)) {
                    // Diverse cave floor
                    const caveFloor = pickWeighted(WORLD_GEN_CONFIG.cave.floorTerrains);
                    type = caveFloor || TerrainType.ROCK;
                }

                this.terrainSystem.setTerrain(x, y, type);

                const posX = x * tileSize;
                const posY = y * tileSize;

                if (caveGrid[x][y] === 1) {
                    // Place a wall
                    this.structureGenerator.generateWallRect({
                        startX: posX,
                        startY: posY,
                        width: 1,
                        height: 1,
                        type: 'rock'
                    });
                }
            }
        }

        // Render Terrain with Blending
        this.terrainSystem.render();

        // Generate Vegetation
        
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

        this.vegetationGenerator.generateVegetation({
            mapWidth: width,
            mapHeight: height,
            count: 2500,
            collisionCheck: checkCollision,
            getBiome: (gridX, gridY) => {
                 // Convert pixel x,y to grid x,y if needed, but getBiome logic in VegetationGenerator
                 // currently calls this callback with whatever it calculated.
                 // In my updated VegetationGenerator, I changed it to pass gridX/gridY to getBiome.
                 // So we just return directly.
                 return this.biomeGenerator ? this.biomeGenerator.getBiomeAt(gridX, gridY) : BiomeType.FOREST;
            },
            getTerrain: (gridX, gridY) => {
                return this.terrainSystem ? this.terrainSystem.getTerrainAt(gridX, gridY) : TerrainType.NONE;
            }
        });
    }

    private generateAutomataGrid(width: number, height: number, initialChance: number, iterations: number): number[][] {
        const grid: number[][] = [];
        // Init
        for (let x = 0; x < width; x++) {
            grid[x] = [];
            for (let y = 0; y < height; y++) {
                grid[x][y] = Math.random() < initialChance ? 1 : 0;
            }
        }

        // Iterations
        for (let i = 0; i < iterations; i++) {
            const newGrid: number[][] = [];
            for (let x = 0; x < width; x++) {
                newGrid[x] = [];
                for (let y = 0; y < height; y++) {
                    let neighbors = 0;
                    for (let nx = x - 1; nx <= x + 1; nx++) {
                        for (let ny = y - 1; ny <= y + 1; ny++) {
                            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                                if (nx !== x || ny !== y) {
                                    neighbors += grid[nx][ny];
                                }
                            }
                        }
                    }
                    // Standard CA rules for smooth blobs
                    if (neighbors > 4) newGrid[x][y] = 1;
                    else if (neighbors < 4) newGrid[x][y] = 0;
                    else newGrid[x][y] = grid[x][y];
                }
            }
            // Copy back
            for (let x = 0; x < width; x++) {
                for (let y = 0; y < height; y++) {
                    grid[x][y] = newGrid[x][y];
                }
            }
        }
        return grid;
    }

    
    public getVegetation() {
        return this.vegetationGenerator.getPlantsGroup();
    }

    public getWalls() {
        return this.structureGenerator.getWallsGroup();
    }
}
