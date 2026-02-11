import { TerrainType } from '../systems/terrain-system';
import { BiomeType } from '../types/map';

export interface PlantDefinition {
    key: string;
    type: 'tree' | 'bush' | 'grass';
    weight: number;
    minScale?: number;
    maxScale?: number;
    allowedTerrains?: TerrainType[];
}

export interface BiomeConfig {
    spawnChance: number; // Global vegetation spawn chance
    terrainWeights: { item: TerrainType; weight: number }[];
    plants: PlantDefinition[];
}

export interface CaveGenerationConfig {
    margin: number;
    initialChance: number;
    smoothingIterations: number;
    entranceCountMin: number;
    entranceCountMax: number;
    radiusRatio: number; // Ratio of min(width, height) for central cave
    floorTerrains: { item: TerrainType; weight: number }[];
}

export interface WorldGenerationConfig {
    tileSize: number;
    vegetation: {
        totalCount: number;
        minDistance: number;
        maxAttempts: number;
    };
    biomes: Record<BiomeType, BiomeConfig>;
    cave: CaveGenerationConfig;
    general: {
        rockPatchChance: number;
        rockPatchIterations: number;
    };
}

export const WORLD_GEN_CONFIG: WorldGenerationConfig = {
    tileSize: 80,
    vegetation: {
        totalCount: 2500,
        minDistance: 64,
        maxAttempts: 20
    },
    general: {
        rockPatchChance: 0.25,
        rockPatchIterations: 3
    },
    cave: {
        margin: 15,
        initialChance: 0.46,
        smoothingIterations: 5,
        entranceCountMin: 1,
        entranceCountMax: 3,
        radiusRatio: 0.15,
        floorTerrains: [
            { item: TerrainType.SOIL, weight: 4 },   // ~4% based on > 0.96
            { item: TerrainType.SMOOTH_STONE, weight: 30 }, // ~30% based on < 0.3
            { item: TerrainType.ROCK, weight: 66 }   // Rest
        ]
    },
    biomes: {
        [BiomeType.FOREST]: {
            spawnChance: 0.8,
            terrainWeights: [
                { item: TerrainType.SOIL, weight: 80 },
                { item: TerrainType.SOIL_RICH, weight: 20 }
            ],
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
            spawnChance: 0.1,
            terrainWeights: [
                { item: TerrainType.SAND, weight: 90 },
                { item: TerrainType.SOIL, weight: 10 }
            ],
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
            terrainWeights: [
                { item: TerrainType.MUD, weight: 70 },
                { item: TerrainType.SOIL_RICH, weight: 20 },
                { item: TerrainType.SOIL, weight: 10 }
            ],
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
            spawnChance: 0.05,
            terrainWeights: [
                { item: TerrainType.ROCK, weight: 85 },
                { item: TerrainType.SOIL, weight: 15 }
            ],
            plants: []
        }
    }
};
