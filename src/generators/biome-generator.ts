
import { BiomeType } from '../types/map';
import { WORLD_GEN_CONFIG } from '../config/world-generation-config';

export { BiomeType };

export class BiomeGenerator {
    private width: number;
    private height: number;
    private biomeGrid: BiomeType[][];
    private caveRadius: number;

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.biomeGrid = [];
        // Cave radius is roughly 15% of the smaller dimension
        this.caveRadius = Math.min(width, height) * WORLD_GEN_CONFIG.cave.radiusRatio;
    }

    public generate(): BiomeType[][] {
        const centerX = this.width / 2;
        const centerY = this.height / 2;

        for (let x = 0; x < this.width; x++) {
            this.biomeGrid[x] = [];
            for (let y = 0; y < this.height; y++) {
                // Calculate distance from center
                const dx = x - centerX;
                const dy = y - centerY;
                const distance = Math.sqrt(dx * dx + dy * dy);

                // Check for Center Cave
                // We add a little noise or irregularity if we want, but a circle is fine for the "Idea"
                if (distance < this.caveRadius) {
                    this.biomeGrid[x][y] = BiomeType.CAVE;
                    continue;
                }

                // Determine Biome by Angle
                // atan2 returns -PI to PI
                const angle = Math.atan2(dy, dx);
                
                // Divide into 3 sectors (120 degrees each = 2*PI / 3 radians)
                // -PI to -PI/3 (-180 to -60) -> Forest
                // -PI/3 to PI/3 (-60 to 60) -> Desert
                // PI/3 to PI (60 to 180) -> Swamp
                
                let type: BiomeType;

                if (angle >= -Math.PI && angle < -Math.PI / 3) {
                    type = BiomeType.FOREST;
                } else if (angle >= -Math.PI / 3 && angle < Math.PI / 3) {
                    type = BiomeType.DESERT;
                } else {
                    type = BiomeType.SWAMP;
                }

                this.biomeGrid[x][y] = type;
            }
        }

        return this.biomeGrid;
    }

    public getBiomeAt(x: number, y: number): BiomeType {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            return this.biomeGrid[x][y];
        }
        return BiomeType.FOREST; // Default
    }
}
