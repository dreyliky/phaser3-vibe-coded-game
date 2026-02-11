import Phaser from 'phaser';
import { Bush, Tree, Grass } from '../objects/plants';
import { BiomeType } from './biome-generator';
import { pickWeighted } from '../utils/random';

import { TerrainType } from '../systems/terrain-system';

// Define structure for plant definitions
type PlantDefinition = {
    key: string;
    type: 'tree' | 'bush' | 'grass';
    weight: number;
    minScale?: number;
    maxScale?: number;
    allowedTerrains?: TerrainType[];
};

// Configuration per biome
// Includes list of plants with weights, AND a global "spawn chance" for this biome.
// spawnChance: 0.0 to 1.0 (probability that a chosen spot actually spawns a plant)
const BIOME_PLANT_CONFIG: Record<BiomeType, { spawnChance: number, plants: PlantDefinition[] }> = {
    [BiomeType.FOREST]: {
        spawnChance: 0.8,
        plants: [
            {
                key: 'plant_tree_oak_immature', type: 'tree', weight: 30, minScale: 0.8, maxScale: 1.2,
                allowedTerrains: [TerrainType.SOIL, TerrainType.SOIL_RICH]
            },
            {
                key: 'plant_tree_birch_a', type: 'tree', weight: 25, minScale: 0.8, maxScale: 1.3,
                allowedTerrains: [TerrainType.SOIL, TerrainType.SOIL_RICH]
            },
            {
                key: 'plant_tree_cecropia', type: 'tree', weight: 20, minScale: 0.9, maxScale: 1.5,
                allowedTerrains: [TerrainType.SOIL, TerrainType.SOIL_RICH, TerrainType.MUD]
            },
            {
                key: 'plant_bush_a', type: 'bush', weight: 15, minScale: 0.8, maxScale: 1.2,
                allowedTerrains: [TerrainType.SOIL, TerrainType.SOIL_RICH]
            },
            {
                key: 'plant_berry_bush_a', type: 'bush', weight: 10, minScale: 0.8, maxScale: 1.1,
                allowedTerrains: [TerrainType.SOIL, TerrainType.SOIL_RICH]
            },
            {
                key: 'plant_grass_a', type: 'grass', weight: 75, minScale: 0.8, maxScale: 1.2,
                allowedTerrains: [TerrainType.SOIL, TerrainType.SOIL_RICH]
            },
            {
                key: 'plant_grass_b', type: 'grass', weight: 75, minScale: 0.8, maxScale: 1.2,
                allowedTerrains: [TerrainType.SOIL, TerrainType.SOIL_RICH]
            }
        ]
    },
    [BiomeType.DESERT]: {
        spawnChance: 0.1, // Sparse vegetation
        plants: [
            {
                key: 'plant_tree_palm', type: 'tree', weight: 20, minScale: 0.8, maxScale: 1.4,
                allowedTerrains: [TerrainType.SAND, TerrainType.SOIL]
            },
            {
                key: 'plant_saguaro_cactus', type: 'bush', weight: 30, minScale: 0.7, maxScale: 1.3,
                allowedTerrains: [TerrainType.SAND]
            },
            {
                key: 'plant_saguaro_cactus_leafless', type: 'bush', weight: 20, minScale: 0.7, maxScale: 1.3,
                allowedTerrains: [TerrainType.SAND]
            },
            {
                key: 'plant_pincushion_cactus', type: 'bush', weight: 15, minScale: 0.5, maxScale: 1.0,
                allowedTerrains: [TerrainType.SAND, TerrainType.ROCK]
            },
            {
                key: 'plant_agave', type: 'bush', weight: 15, minScale: 0.6, maxScale: 1.1,
                allowedTerrains: [TerrainType.SAND, TerrainType.SOIL]
            }
        ]
    },
    [BiomeType.SWAMP]: {
        spawnChance: 0.2,
        plants: [
            {
                key: 'plant_tree_willow', type: 'tree', weight: 40, minScale: 0.9, maxScale: 1.4,
                allowedTerrains: [TerrainType.MUD, TerrainType.SOIL_RICH]
            },
            {
                key: 'plant_tree_teak', type: 'tree', weight: 20, minScale: 0.8, maxScale: 1.3,
                allowedTerrains: [TerrainType.MUD, TerrainType.SOIL_RICH, TerrainType.SOIL]
            },
            {
                key: 'plant_tree_bamboo', type: 'tree', weight: 10, minScale: 0.8, maxScale: 1.2,
                allowedTerrains: [TerrainType.MUD, TerrainType.SOIL_RICH, TerrainType.SOIL]
            },
            {
                key: 'plant_alocasia_a', type: 'bush', weight: 20, minScale: 0.7, maxScale: 1.2,
                allowedTerrains: [TerrainType.MUD, TerrainType.SOIL_RICH]
            },
            {
                key: 'plant_grass_b', type: 'grass', weight: 10, minScale: 0.8, maxScale: 1.5,
                allowedTerrains: [TerrainType.MUD, TerrainType.SOIL_RICH, TerrainType.SOIL]
            }
        ]
    },
    [BiomeType.CAVE]: {
        spawnChance: 0.05, // Very rare mushrooms or something? For now almost nothing.
        plants: []
    }
};

export class VegetationGenerator {
    private scene: Phaser.Scene;
    private plants: Phaser.GameObjects.Group; // Using Group to hold references, bodies are managed individually or via group

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        // We can use a Group to organize them, but since we create custom classes with their own bodies,
        // we just need a collection to pass to the collider.
        // A standard Group works for this.
        this.plants = this.scene.add.group(); 
    }

    public generateVegetation(options: {
        mapWidth: number;
        mapHeight: number;
        count: number;
        collisionCheck?: (x: number, y: number) => boolean;
        getBiome?: (x: number, y: number) => BiomeType;
        getTerrain?: (x: number, y: number) => TerrainType;
    }) {
        const { mapWidth, mapHeight, count, collisionCheck, getBiome, getTerrain } = options;

        const placedPositions: {x: number, y: number}[] = [];
        const minDistance = 64;

        for (let i = 0; i < count; i++) {
            let x = 0;
            let y = 0;
            let attempts = 0;
            let validPosition = false;
            let biome = BiomeType.FOREST;

            // Try to find a valid position
            while (attempts < 20 && !validPosition) {
                x = Phaser.Math.Between(0, mapWidth);
                y = Phaser.Math.Between(0, mapHeight);
                
                validPosition = true;
                
                // Check Biome
                if (getBiome) {
                    const tileSize = 80; // Hardcoded in MapGenerator, should be constant.
                    const gridX = Math.floor(x / tileSize);
                    const gridY = Math.floor(y / tileSize);
                    biome = getBiome(gridX, gridY);
                    
                    if (biome === BiomeType.CAVE) {
                        validPosition = false; // Don't spawn inside cave
                    }
                }

                // Check distance to other plants
                if (validPosition) {
                    for (const pos of placedPositions) {
                        if (Phaser.Math.Distance.Between(x, y, pos.x, pos.y) < minDistance) {
                            validPosition = false;
                            break;
                        }
                    }
                }

                // Check external collision (e.g. walls)
                if (validPosition && collisionCheck) {
                    if (collisionCheck(x, y)) {
                        validPosition = false;
                    }
                }

                attempts++;
            }

            if (validPosition) {
                placedPositions.push({x, y});
                
                const biomeConfig = BIOME_PLANT_CONFIG[biome];
                if (!biomeConfig || biomeConfig.plants.length === 0) continue;

                // Check spawn chance
                if (Math.random() > biomeConfig.spawnChance) continue;

                // Check Terrain Restrictions
                let validPlants = biomeConfig.plants;
                if (getTerrain) {
                    const tileSize = 80;
                    const gridX = Math.floor(x / tileSize);
                    const gridY = Math.floor(y / tileSize);
                    const terrain = getTerrain(gridX, gridY);
                    
                    validPlants = validPlants.filter(p => {
                        if (!p.allowedTerrains) return true; // No restriction
                        return p.allowedTerrains.includes(terrain);
                    });
                    
                    if (validPlants.length === 0) continue; // No valid plants for this terrain
                }

                // Pick plant type
                // pickWeighted expects { item: T, weight: number }[]
                // We map our PlantDefinition to this structure
                const weightedItems = validPlants.map(p => ({ item: p, weight: p.weight }));
                const plantDef = pickWeighted(weightedItems);
                
                if (!plantDef) continue;

                // Determine scale
                const minScale = plantDef.minScale ?? 1;
                const maxScale = plantDef.maxScale ?? 1;
                const scale = Phaser.Math.FloatBetween(minScale, maxScale);

                let plant;
                if (plantDef.type === 'tree') {
                    plant = new Tree({ scene: this.scene, x, y, texture: plantDef.key, scale });
                } else if (plantDef.type === 'grass') {
                    plant = new Grass({ scene: this.scene, x, y, texture: plantDef.key, scale });
                } else {
                    plant = new Bush({ scene: this.scene, x, y, texture: plantDef.key, scale });
                }
                
                this.plants.add(plant);
            }
        }
    }
    
    public getPlantsGroup() {
        return this.plants;
    }
}
