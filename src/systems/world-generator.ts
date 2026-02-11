import { SimplexNoise } from '../utils/noise';
import { BiomeType } from '../generators/biome-generator';
import { TerrainType } from '../systems/terrain-system';

export class WorldGenerator {
    private biomeNoise: SimplexNoise;
    private caveNoise: SimplexNoise;
    private caveShapeNoise: SimplexNoise; // For detailed cave walls
    private terrainNoise: SimplexNoise; // For soil/rock patches

    constructor(seed: string | number) {
        this.biomeNoise = new SimplexNoise(seed);
        this.caveNoise = new SimplexNoise(seed + '-cave');
        this.caveShapeNoise = new SimplexNoise(seed + '-cave-shape');
        this.terrainNoise = new SimplexNoise(seed + '-terrain');
    }

    public getBiome(x: number, y: number): BiomeType {
        // Scale for biome noise (large scale)
        const scale = 0.002;
        const value = this.biomeNoise.noise2D(x * scale, y * scale);

        // Map [-1, 1] to Biomes
        if (value < -0.3) return BiomeType.SWAMP;
        if (value < 0.3) return BiomeType.FOREST;
        return BiomeType.DESERT;
    }

    public isCave(x: number, y: number): boolean {
        // Large scale noise for cave systems presence
        const presenceScale = 0.005;
        const presence = this.caveNoise.noise2D(x * presenceScale, y * presenceScale);

        // If high presence, check shape
        if (presence > 0.4) {
            // Detailed shape
            const shapeScale = 0.02;
            const shape = this.caveShapeNoise.noise2D(x * shapeScale, y * shapeScale);
            // Ridged noise or threshold for tunnels
            // Using abs(noise) < threshold makes tunnels
            return Math.abs(shape) < 0.2; 
        }

        return false;
    }

    public getTerrain(x: number, y: number): TerrainType {
        // First check cave
        if (this.isCave(x, y)) {
             const caveDetail = this.terrainNoise.noise2D(x * 0.1, y * 0.1);
             
             // Small chance for soil (dirt patches in cave)
             if (caveDetail > 0.75) {
                 return TerrainType.SOIL;
             }
             
             // Mix of Rock and Smooth Stone for variety
             if (caveDetail < -0.2) {
                 return TerrainType.SMOOTH_STONE;
             }

             return TerrainType.ROCK;
        }

        const biome = this.getBiome(x, y);
        const noiseVal = this.terrainNoise.noise2D(x * 0.05, y * 0.05);

        switch (biome) {
            case BiomeType.DESERT:
                return noiseVal > 0.6 ? TerrainType.SOIL : TerrainType.SAND;
            case BiomeType.SWAMP:
                if (noiseVal > 0.5) return TerrainType.SOIL_RICH;
                if (noiseVal < -0.5) return TerrainType.SOIL;
                return TerrainType.MUD;
            case BiomeType.FOREST:
            default:
                if (noiseVal > 0.5) return TerrainType.SOIL_RICH;
                if (noiseVal < -0.5) return TerrainType.ROCK; // Some rocks in forest
                return TerrainType.SOIL;
        }
    }

    public isWall(x: number, y: number): boolean {
        // Walls exist at the boundary of caves
        // Check if this tile is NOT a cave, but a neighbor IS a cave (or vice versa, depending on how we define "Cave")
        // Actually, usually "Cave" means "Floor". "Not Cave" inside a "Cave System" means "Wall".
        
        // Let's refine definition:
        // presence > 0.4 defines "Cave Biome/Area".
        // Inside Cave Area:
        //   Math.abs(shape) < 0.2  => Floor (Tunnel)
        //   Math.abs(shape) >= 0.2 => Wall
        
        const presenceScale = 0.005;
        const presence = this.caveNoise.noise2D(x * presenceScale, y * presenceScale);

        if (presence > 0.4) {
            const shapeScale = 0.02;
            const shape = this.caveShapeNoise.noise2D(x * shapeScale, y * shapeScale);
            // If it's NOT a tunnel (floor), it's a wall
            return Math.abs(shape) >= 0.2;
        }

        return false;
    }

    public getObject(x: number, y: number): 'tree' | 'bush' | null {
        // Don't place objects in caves or walls
        if (this.isCave(x, y) || this.isWall(x, y)) return null;

        // Check terrain type restrictions
        const terrain = this.getTerrain(x, y);
        const forbiddenTerrains = [
            TerrainType.ROCK,
            TerrainType.SMOOTH_STONE,
            TerrainType.ANCIENT_CONCRETE,
            TerrainType.BROKEN_ASPHALT,
            TerrainType.TILE_STONE,
            TerrainType.WOOD_FLOOR
        ];

        if (forbiddenTerrains.includes(terrain)) {
            return null;
        }

        const biome = this.getBiome(x, y);
        // Use a high frequency noise for object placement or just random
        // Since we need it to be deterministic, use noise or hashed random
        // We can use a simple pseudo-random based on coords
        
        const rand = this.pseudoRandom(x, y);
        
        if (biome === BiomeType.FOREST) {
            if (rand > 0.95) return 'tree';
            if (rand > 0.90) return 'bush';
        } else if (biome === BiomeType.SWAMP) {
            if (rand > 0.98) return 'tree'; // Sparse dead trees
            if (rand > 0.95) return 'bush';
        } else if (biome === BiomeType.DESERT) {
            if (rand > 0.99) return 'bush'; // Cactus? (use bush for now)
        }

        return null;
    }

    private pseudoRandom(x: number, y: number): number {
        const sin = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
        return sin - Math.floor(sin);
    }
}
