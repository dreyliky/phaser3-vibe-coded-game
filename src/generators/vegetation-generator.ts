import Phaser from 'phaser';
import { Bush, Tree, Grass } from '../objects/plants';
import { BiomeType } from '../types/map';
import { pickWeighted } from '../utils/random';
import { TerrainType } from '../systems/terrain-system';
import { WORLD_GEN_CONFIG } from '../config/world-generation-config';

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
        count?: number;
        collisionCheck?: (x: number, y: number) => boolean;
        getBiome?: (x: number, y: number) => BiomeType;
        getTerrain?: (x: number, y: number) => TerrainType;
    }) {
        const { mapWidth, mapHeight, collisionCheck, getBiome, getTerrain } = options;
        const count = options.count ?? WORLD_GEN_CONFIG.vegetation.totalCount;

        const placedPositions: {x: number, y: number}[] = [];
        const minDistance = WORLD_GEN_CONFIG.vegetation.minDistance;

        for (let i = 0; i < count; i++) {
            let x = 0;
            let y = 0;
            let attempts = 0;
            let validPosition = false;
            let biome = BiomeType.FOREST;

            // Try to find a valid position
            while (attempts < WORLD_GEN_CONFIG.vegetation.maxAttempts && !validPosition) {
                x = Phaser.Math.Between(0, mapWidth);
                y = Phaser.Math.Between(0, mapHeight);
                
                validPosition = true;
                
                // Check Biome
                if (getBiome) {
                    const tileSize = WORLD_GEN_CONFIG.tileSize;
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
                
                const biomeConfig = WORLD_GEN_CONFIG.biomes[biome];
                if (!biomeConfig || biomeConfig.plants.length === 0) continue;

                // Check spawn chance
                if (Math.random() > biomeConfig.spawnChance) continue;

                // Check Terrain Restrictions
                let validPlants = biomeConfig.plants;
                if (getTerrain) {
                    const tileSize = WORLD_GEN_CONFIG.tileSize;
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
