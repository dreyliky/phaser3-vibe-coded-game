import Phaser from 'phaser';
import { WorldGenerator } from './world-generator';
import { TerrainType } from './terrain-system';
import { BaseRockWall } from '../objects/walls/wall-types';
import { Tree } from '../objects/plants/tree';
import { Bush } from '../objects/plants/bush';
import { GAME_CONFIG, DEPTHS } from '../config/constants';
import { ShadowSystem } from './shadow-system';

export const CHUNK_SIZE = 16; // 16x16 tiles per chunk
const TILE_SIZE = GAME_CONFIG.TILE_SIZE;

interface TerrainConfig {
    asset: string;
    layer: number;
    z: number;
}

// Copied from terrain-system.ts
export const TERRAIN_DATA: Record<string, TerrainConfig> = {
    [TerrainType.SAND]: { asset: 'background_sand', layer: 1, z: -100 },
    [TerrainType.SOIL]: { asset: 'floor_soil', layer: 2, z: -95 },
    [TerrainType.SOIL_RICH]: { asset: 'floor_soil_rich', layer: 2, z: -94 },
    [TerrainType.MUD]: { asset: 'floor_mud', layer: 2, z: -93 },
    [TerrainType.ROCK]: { asset: 'floor_cave', layer: 3, z: -90 },
    [TerrainType.SMOOTH_STONE]: { asset: 'floor_smooth_stone', layer: 3, z: -89 },
    [TerrainType.ANCIENT_CONCRETE]: { asset: 'floor_ancient_concrete', layer: 4, z: -85 },
    [TerrainType.BROKEN_ASPHALT]: { asset: 'floor_broken_asphalt', layer: 4, z: -84 },
    [TerrainType.TILE_STONE]: { asset: 'floor_tile_stone', layer: 4, z: -83 },
    [TerrainType.WOOD_FLOOR]: { asset: 'floor_wood', layer: 4, z: -82 }
};

const TREE_VARIANTS = ['plant_tree_teak', 'plant_tree_willow', 'plant_tree_palm', 'plant_tree_cecropia'];
const BUSH_VARIANTS = ['plant_bush_a', 'plant_berry_bush_a', 'plant_agave', 'plant_alocasia_a'];

class Chunk {
    public x: number;
    public y: number;
    public key: string;
    
    private scene: Phaser.Scene;
    private worldGenerator: WorldGenerator;
    private container: Phaser.GameObjects.Container;
    private objects: Phaser.GameObjects.GameObject[] = [];
    private walls: Phaser.GameObjects.GameObject[] = [];
    private wallsGroup: Phaser.GameObjects.Group | Phaser.Physics.Arcade.StaticGroup;
    private plantsGroup: Phaser.GameObjects.Group | Phaser.Physics.Arcade.StaticGroup;
    private treeHitboxesGroup: Phaser.GameObjects.Group;
    private shadowSystem?: ShadowSystem;

    constructor(
        scene: Phaser.Scene, 
        x: number, 
        y: number, 
        worldGenerator: WorldGenerator,
        wallsGroup: Phaser.GameObjects.Group | Phaser.Physics.Arcade.StaticGroup,
        plantsGroup: Phaser.GameObjects.Group | Phaser.Physics.Arcade.StaticGroup,
        treeHitboxesGroup: Phaser.GameObjects.Group,
        shadowSystem?: ShadowSystem
    ) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.key = `${x},${y}`;
        this.worldGenerator = worldGenerator;
        this.wallsGroup = wallsGroup;
        this.plantsGroup = plantsGroup;
        this.treeHitboxesGroup = treeHitboxesGroup;
        this.shadowSystem = shadowSystem;
        this.container = this.scene.add.container(0, 0);
        this.container.setDepth(DEPTHS.TERRAIN); // Terrain depth
    }

    public load() {
        const startX = this.x * CHUNK_SIZE;
        const startY = this.y * CHUNK_SIZE;

        // 1. Generate Terrain
        this.generateTerrain(startX, startY);

        // 2. Generate Objects (Walls, Trees, etc.)
        this.generateObjects(startX, startY);
    }

    private generateTerrain(startX: number, startY: number) {
        const terrainTypes = Object.keys(TERRAIN_DATA) as TerrainType[];
        const sortedTypes = terrainTypes.sort((a, b) => TERRAIN_DATA[a].layer - TERRAIN_DATA[b].layer);

        for (const type of sortedTypes) {
            const config = TERRAIN_DATA[type];
            // Safe texture check
            if (!this.scene.textures.exists(config.asset)) continue;

            const texture = this.scene.textures.get(config.asset);
            const source = texture.getSourceImage();
            // unused: texW, texH
            if (source) {
                // Keep these for potential future use or debugging if needed, or remove.
                // texW = (source as HTMLImageElement).width || 1024;
                // texH = (source as HTMLImageElement).height || 1024;
            }
            // unused: cols, rows

            for (let lx = 0; lx < CHUNK_SIZE; lx++) {
                for (let ly = 0; ly < CHUNK_SIZE; ly++) {
                    const worldX = startX + lx;
                    const worldY = startY + ly;

                    const tl = this.getVertexAlpha(worldX, worldY, type);
                    const tr = this.getVertexAlpha(worldX + 1, worldY, type);
                    const bl = this.getVertexAlpha(worldX, worldY + 1, type);
                    const br = this.getVertexAlpha(worldX + 1, worldY + 1, type);

                    if (tl > 0 || tr > 0 || bl > 0 || br > 0) {
                        const posX = worldX * TILE_SIZE;
                        const posY = worldY * TILE_SIZE;

                        const tile = this.scene.add.image(posX, posY, config.asset);
                        
                        tile.setDisplaySize(TILE_SIZE, TILE_SIZE);
                        tile.setDepth(config.z);
                        tile.setOrigin(0, 0);
                        tile.setAlpha(tl, tr, bl, br);

                        this.container.add(tile);
                    }
                }
            }
        }
    }

    private getVertexAlpha(x: number, y: number, type: TerrainType): number {
        const t1 = this.worldGenerator.getTerrain(x - 1, y - 1);
        const t2 = this.worldGenerator.getTerrain(x, y - 1);
        const t3 = this.worldGenerator.getTerrain(x - 1, y);
        const t4 = this.worldGenerator.getTerrain(x, y);

        let matchCount = 0;
        if (t1 === type) matchCount++;
        if (t2 === type) matchCount++;
        if (t3 === type) matchCount++;
        if (t4 === type) matchCount++;

        return matchCount * 0.25;
    }

    private generateObjects(startX: number, startY: number) {
        for (let lx = 0; lx < CHUNK_SIZE; lx++) {
            for (let ly = 0; ly < CHUNK_SIZE; ly++) {
                const worldX = startX + lx;
                const worldY = startY + ly;

                if (this.worldGenerator.isWall(worldX, worldY)) {
                    const posX = worldX * TILE_SIZE + TILE_SIZE / 2;
                    const posY = worldY * TILE_SIZE + TILE_SIZE / 2;
                    
                    const wall = new BaseRockWall({
                        scene: this.scene,
                        x: posX,
                        y: posY
                    });
                    this.walls.push(wall);
                    this.wallsGroup.add(wall);
                    
                    // Register with Shadow System
                    if (this.shadowSystem) {
                        this.shadowSystem.registerObject(wall, 'Wall');
                    }

                } else {
                    const objType = this.worldGenerator.getObject(worldX, worldY);
                    if (objType) {
                        const posX = worldX * TILE_SIZE + TILE_SIZE / 2;
                        const posY = worldY * TILE_SIZE + TILE_SIZE / 2;
                        
                        // Deterministic variant selection
                        const variantIndex = Math.floor(Math.abs(Math.sin(worldX * 12.9898 + worldY * 78.233) * 100));

                        if (objType === 'tree') {
                            const texture = TREE_VARIANTS[variantIndex % TREE_VARIANTS.length];
                            const tree = new Tree({ 
                                scene: this.scene, 
                                x: posX, 
                                y: posY,
                                texture: texture 
                            });
                            this.objects.push(tree);
                            this.plantsGroup.add(tree);

                            // Create hitbox for tree
                            const hitbox = tree.getBulletHitbox();
                            if (hitbox) {
                                this.treeHitboxesGroup.add(hitbox);
                                // Don't add to this.objects because Tree.destroy() handles hitbox destruction
                            }
                            
                            if (this.shadowSystem) {
                                this.shadowSystem.registerObject(tree, 'Tree');
                            }
                        } else if (objType === 'bush') {
                            const texture = BUSH_VARIANTS[variantIndex % BUSH_VARIANTS.length];
                            const bush = new Bush({ 
                                scene: this.scene, 
                                x: posX, 
                                y: posY,
                                texture: texture
                            });
                            this.objects.push(bush);
                            this.plantsGroup.add(bush);
                            
                            if (this.shadowSystem) {
                                this.shadowSystem.registerObject(bush, 'Bush');
                            }
                        }
                    }
                }
            }
        }
    }

    public destroy() {
        this.container.destroy();
        this.objects.forEach(obj => {
            // Unregister from shadow system? 
            // ShadowSystem automatically handles destroyed objects in update loop.
            // Just need to destroy the object.
            obj.destroy(); 
        });
        this.walls.forEach(wall => wall.destroy());
        this.objects = [];
        this.walls = [];
    }
}

export class ChunkSystem {
    private scene: Phaser.Scene;
    private worldGenerator: WorldGenerator;
    private chunks: Map<string, Chunk> = new Map();
    private loadRadius: number = 2; // Radius in chunks
    
    private wallsGroup: Phaser.GameObjects.Group | Phaser.Physics.Arcade.StaticGroup;
    private plantsGroup: Phaser.GameObjects.Group | Phaser.Physics.Arcade.StaticGroup;
    private treeHitboxesGroup: Phaser.GameObjects.Group;
    private shadowSystem?: ShadowSystem;

    constructor(
        scene: Phaser.Scene, 
        seed: string | number,
        wallsGroup: Phaser.GameObjects.Group | Phaser.Physics.Arcade.StaticGroup,
        plantsGroup: Phaser.GameObjects.Group | Phaser.Physics.Arcade.StaticGroup,
        treeHitboxesGroup: Phaser.GameObjects.Group,
        shadowSystem?: ShadowSystem
    ) {
        this.scene = scene;
        this.worldGenerator = new WorldGenerator(seed);
        this.wallsGroup = wallsGroup;
        this.plantsGroup = plantsGroup;
        this.treeHitboxesGroup = treeHitboxesGroup;
        this.shadowSystem = shadowSystem;
    }

    public update(playerPos: { x: number, y: number }) {
        const chunkX = Math.floor(playerPos.x / (CHUNK_SIZE * TILE_SIZE));
        const chunkY = Math.floor(playerPos.y / (CHUNK_SIZE * TILE_SIZE));

        this.manageChunks(chunkX, chunkY);
    }

    private manageChunks(centerChunkX: number, centerChunkY: number) {
        const keptKeys = new Set<string>();
        let changed = false;

        for (let x = centerChunkX - this.loadRadius; x <= centerChunkX + this.loadRadius; x++) {
            for (let y = centerChunkY - this.loadRadius; y <= centerChunkY + this.loadRadius; y++) {
                const key = `${x},${y}`;
                keptKeys.add(key);

                if (!this.chunks.has(key)) {
                    this.loadChunk(x, y);
                    changed = true;
                }
            }
        }

        // Unload old chunks
        for (const [key, chunk] of this.chunks) {
            if (!keptKeys.has(key)) {
                chunk.destroy();
                this.chunks.delete(key);
                changed = true;
            }
        }

        if (changed) {
            // Refresh static groups to update physics/quadtree
            if (this.wallsGroup instanceof Phaser.Physics.Arcade.StaticGroup) {
                this.wallsGroup.refresh();
            }
            if (this.plantsGroup instanceof Phaser.Physics.Arcade.StaticGroup) {
                this.plantsGroup.refresh();
            }

            // Notify other systems that chunks have been updated
            this.scene.events.emit('chunks-updated');
        }
    }

    private loadChunk(x: number, y: number) {
        const chunk = new Chunk(
            this.scene, 
            x, 
            y, 
            this.worldGenerator,
            this.wallsGroup,
            this.plantsGroup,
            this.treeHitboxesGroup,
            this.shadowSystem
        );
        chunk.load();
        this.chunks.set(chunk.key, chunk);
    }
}
