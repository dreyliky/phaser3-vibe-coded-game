import Phaser from 'phaser';

export enum TerrainType {
    SAND = 'SAND',
    ROCK = 'ROCK'
}

interface TerrainConfig {
    asset: string;
    layer: number; // 0 is base, higher is overlay
    z: number; // Phaser depth
}

const TERRAIN_DATA: Record<TerrainType, TerrainConfig> = {
    [TerrainType.SAND]: { 
        asset: 'background_sand', 
        layer: 0,
        z: -100
    },
    [TerrainType.ROCK]: { 
        asset: 'floor_cave', 
        layer: 1,
        z: -90
    }
};

export class TerrainSystem {
    private scene: Phaser.Scene;
    private grid: TerrainType[][];
    private width: number;
    private height: number;
    private tileSize: number;
    private activeTiles: Phaser.GameObjects.Image[] = [];

    constructor(scene: Phaser.Scene, width: number, height: number, tileSize: number) {
        this.scene = scene;
        this.width = width;
        this.height = height;
        this.tileSize = tileSize;
        this.grid = [];

        // Initialize grid with default terrain (Sand)
        for (let x = 0; x < width; x++) {
            this.grid[x] = [];
            for (let y = 0; y < height; y++) {
                this.grid[x][y] = TerrainType.SAND;
            }
        }
    }

    public setTerrain(x: number, y: number, type: TerrainType) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            this.grid[x][y] = type;
        }
    }

    public getTerrain(x: number, y: number): TerrainType | null {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            return this.grid[x][y];
        }
        return null;
    }

    public render() {
        // Clear previous render
        this.activeTiles.forEach(tile => tile.destroy());
        this.activeTiles = [];

        // 1. Render Base Layer (Layer 0) - Fill everywhere
        // Optimization: If we have a seamless base layer like sand, we can just tile it or render individual tiles.
        // For consistency with blending, let's render individual tiles for now, or assume Layer 0 is the "background".
        // In our case, Sand is Layer 0.
        
        // We will iterate through all defined Terrain Types sorted by layer
        const terrainTypes = Object.values(TerrainType);
        const sortedTypes = terrainTypes.sort((a, b) => TERRAIN_DATA[a].layer - TERRAIN_DATA[b].layer);

        for (const type of sortedTypes) {
            const config = TERRAIN_DATA[type];
            
            if (config.layer === 0) {
                // Base layer: Render everywhere without blending (or simplified)
                // To save performance, we only render where needed? 
                // No, base layer usually covers everything.
                // Let's render Sand everywhere for now as the "Canvas".
                for (let x = 0; x < this.width; x++) {
                    for (let y = 0; y < this.height; y++) {
                        const posX = x * this.tileSize;
                        const posY = y * this.tileSize;
                        
                        const tile = this.scene.add.image(posX, posY, config.asset)
                            .setDisplaySize(this.tileSize, this.tileSize)
                            .setDepth(config.z)
                            .setOrigin(0, 0);
                        
                        this.activeTiles.push(tile);
                    }
                }
            } else {
                // Overlay layers: Render only where present, with Vertex Alpha Blending
                for (let x = 0; x < this.width; x++) {
                    for (let y = 0; y < this.height; y++) {
                        // We render this overlay tile if:
                        // 1. The cell itself is this type OR
                        // 2. Any neighbor is this type (so we can blend the edge)
                        // Actually, if the cell itself is NOT this type, we shouldn't render it fully...
                        // But wait, if I have Rock at (1,1) and Sand at (1,2).
                        // At (1,2) [Sand], the top-left corner touches Rock.
                        // So (1,2) needs to render Rock with alpha=0.25 at top-left?
                        // YES! This is crucial for smooth blending. The "Rock" layer spills over into neighbors.
                        
                        // So for Overlay Layer T:
                        // We calculate vertex alpha for all 4 corners.
                        // If ANY corner has alpha > 0, we render the tile.
                        
                        const tl = this.getVertexAlpha(x, y, type);
                        const tr = this.getVertexAlpha(x + 1, y, type);
                        const bl = this.getVertexAlpha(x, y + 1, type);
                        const br = this.getVertexAlpha(x + 1, y + 1, type);

                        if (tl > 0 || tr > 0 || bl > 0 || br > 0) {
                            const posX = x * this.tileSize;
                            const posY = y * this.tileSize;

                            const tile = this.scene.add.image(posX, posY, config.asset)
                                .setDisplaySize(this.tileSize, this.tileSize)
                                .setDepth(config.z)
                                .setOrigin(0, 0)
                                .setAlpha(tl, tr, bl, br);
                            
                            this.activeTiles.push(tile);
                        }
                    }
                }
            }
        }
    }

    private getVertexAlpha(vx: number, vy: number, type: TerrainType): number {
        // Vertex (vx, vy) is the Top-Left corner of grid cell (vx, vy).
        // It is shared by 4 cells:
        // (vx-1, vy-1), (vx, vy-1)
        // (vx-1, vy),   (vx, vy)
        
        let matchCount = 0;
        const neighbors = [
            { x: vx - 1, y: vy - 1 },
            { x: vx, y: vy - 1 },
            { x: vx - 1, y: vy },
            { x: vx, y: vy }
        ];

        for (const p of neighbors) {
            // Check if this neighbor cell matches the target terrain type
            if (this.getTerrain(p.x, p.y) === type) {
                matchCount++;
            }
        }

        // Return average (0.0 to 1.0)
        return matchCount / 4;
    }
}
