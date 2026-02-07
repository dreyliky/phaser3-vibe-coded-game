import Phaser from 'phaser';

export enum TerrainType {
    NONE = 'NONE',
    SAND = 'SAND',
    SOIL = 'SOIL',
    SOIL_RICH = 'SOIL_RICH',
    MUD = 'MUD',
    ROCK = 'ROCK',
    SMOOTH_STONE = 'SMOOTH_STONE',
    ANCIENT_CONCRETE = 'ANCIENT_CONCRETE',
    BROKEN_ASPHALT = 'BROKEN_ASPHALT',
    TILE_STONE = 'TILE_STONE',
    WOOD_FLOOR = 'WOOD_FLOOR'
}

interface TerrainConfig {
    asset: string;
    layer: number; // 0 is base, higher is overlay
    z: number; // Phaser depth
}

const TERRAIN_DATA: Record<string, TerrainConfig> = { // Changed key type to string to allow skipping NONE
    [TerrainType.SAND]: { 
        asset: 'background_sand', 
        layer: 1, // Changed to 1
        z: -100
    },
    [TerrainType.SOIL]: { 
        asset: 'floor_soil', 
        layer: 2,
        z: -95
    },
    [TerrainType.SOIL_RICH]: {
        asset: 'floor_soil_rich',
        layer: 2,
        z: -94
    },
    [TerrainType.MUD]: {
        asset: 'floor_mud',
        layer: 2,
        z: -93
    },
    [TerrainType.ROCK]: { 
        asset: 'floor_cave', 
        layer: 3,
        z: -90
    },
    [TerrainType.SMOOTH_STONE]: {
        asset: 'floor_smooth_stone',
        layer: 3,
        z: -89
    },
    [TerrainType.ANCIENT_CONCRETE]: {
        asset: 'floor_ancient_concrete',
        layer: 4,
        z: -85
    },
    [TerrainType.BROKEN_ASPHALT]: {
        asset: 'floor_broken_asphalt',
        layer: 4,
        z: -84
    },
    [TerrainType.TILE_STONE]: {
        asset: 'floor_tile_stone',
        layer: 4,
        z: -83
    },
    [TerrainType.WOOD_FLOOR]: {
        asset: 'floor_wood',
        layer: 4,
        z: -82
    }
};

export class TerrainSystem {
    private scene: Phaser.Scene;
    private grid: TerrainType[][];
    private width: number;
    private height: number;
    private tileSize: number;
    private tileContainer: Phaser.GameObjects.Container;
    private activeTiles: Phaser.GameObjects.Image[] = [];
    private isDirty: boolean = false;

    constructor(options: {
        scene: Phaser.Scene;
        width: number;
        height: number;
        tileSize: number;
    }) {
        this.scene = options.scene;
        this.width = options.width;
        this.height = options.height;
        this.tileSize = options.tileSize;
        this.tileContainer = this.scene.add.container(0, 0);
        this.grid = [];

        // Initialize grid with NONE (Void/Black)
        for (let x = 0; x < this.width; x++) {
            this.grid[x] = [];
            for (let y = 0; y < this.height; y++) {
                this.grid[x][y] = TerrainType.NONE;
            }
        }
    }

    public getContainer(): Phaser.GameObjects.Container {
        return this.tileContainer;
    }

    public setTerrain(x: number, y: number, type: TerrainType) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            if (this.grid[x][y] !== type) {
                this.grid[x][y] = type;
                this.isDirty = true;
            }
        }
    }

    public update() {
        if (this.isDirty) {
            this.render();
            this.isDirty = false;
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

        // Iterate through defined terrain types (excluding NONE)
        const terrainTypes = Object.keys(TERRAIN_DATA) as TerrainType[];
        const sortedTypes = terrainTypes.sort((a, b) => TERRAIN_DATA[a].layer - TERRAIN_DATA[b].layer);

        for (const type of sortedTypes) {
            const config = TERRAIN_DATA[type];
            
            // Render all layers as overlays
            for (let x = 0; x < this.width; x++) {
                for (let y = 0; y < this.height; y++) {
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
                        
                        this.tileContainer.add(tile);
                        this.activeTiles.push(tile);
                    }
                }
            }
        }
    }

    private getVertexAlpha(vx: number, vy: number, type: TerrainType): number {
        // Vertex (vx, vy) is the Top-Left corner of grid cell (vx, vy).
        let matchCount = 0;
        const neighbors = [
            { x: vx - 1, y: vy - 1 },
            { x: vx, y: vy - 1 },
            { x: vx - 1, y: vy },
            { x: vx, y: vy }
        ];

        const targetLayer = TERRAIN_DATA[type].layer;

        for (const p of neighbors) {
            const neighborType = this.getTerrain(p.x, p.y);
            
            if (neighborType && neighborType !== TerrainType.NONE) {
                const neighborLayer = TERRAIN_DATA[neighborType].layer;
                // If neighbor is same type, or a higher layer (covering this one)
                if (neighborType === type || neighborLayer > targetLayer) {
                    matchCount++;
                }
            }
        }

        return matchCount / 4;
    }
}
