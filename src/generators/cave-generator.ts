import Phaser from 'phaser';
import { WORLD_GEN_CONFIG } from '../config/world-generation-config';

export class CaveGenerator {
    private width: number;
    private height: number;
    private margin: number;
    private grid: number[][]; // 0: Empty, 1: Wall
    private caveMask: boolean[][]; // true: Inside cave area, false: Outside void

    constructor(width: number, height: number, margin?: number) {
        this.width = width;
        this.height = height;
        this.margin = margin ?? WORLD_GEN_CONFIG.cave.margin;
        this.grid = [];
        this.caveMask = [];
    }

    public generate(): number[][] {
        this.generateCaveMask();
        this.initializeGrid();
        
        // Run Cellular Automata iterations
        for (let i = 0; i < WORLD_GEN_CONFIG.cave.smoothingIterations; i++) {
            this.smoothMap();
        }

        // Create entrances
        this.createOrganicEntrances(Phaser.Math.Between(WORLD_GEN_CONFIG.cave.entranceCountMin, WORLD_GEN_CONFIG.cave.entranceCountMax)); 

        return this.grid;
    }

    public isInsideCave(gridX: number, gridY: number): boolean {
        if (gridX < 0 || gridX >= this.width || gridY < 0 || gridY >= this.height) {
            return false;
        }
        // If mask is not generated yet, fallback to margin check
        if (!this.caveMask || this.caveMask.length === 0) {
            return gridX >= this.margin && gridX < this.width - this.margin &&
                   gridY >= this.margin && gridY < this.height - this.margin;
        }
        return this.caveMask[gridX][gridY];
    }

    private generateCaveMask() {
        this.caveMask = [];
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        // Calculate safe radius that ensures we stay within margins even with noise
        const safeZoneRadius = Math.min(this.width, this.height) / 2 - this.margin;
        const baseRadius = safeZoneRadius * 0.75; // 75% of available space

        // Simple noise function parameters
        const noiseOffset = Math.random() * 100;
        const spikes = Phaser.Math.Between(4, 7);
        const spikeAmplitude = baseRadius * 0.35; // 35% variation

        for (let x = 0; x < this.width; x++) {
            this.caveMask[x] = [];
            for (let y = 0; y < this.height; y++) {
                const dx = x - centerX;
                const dy = y - centerY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const angle = Math.atan2(dy, dx);

                // Calculate noisy radius for this angle
                // Use a combination of sine waves to simulate noise
                let radiusLimit = baseRadius;
                radiusLimit += Math.sin(angle * spikes + noiseOffset) * spikeAmplitude;
                radiusLimit += Math.cos(angle * (spikes + 3) - noiseOffset) * (spikeAmplitude * 0.5);
                
                // If point is within the noisy radius, it's inside the cave area
                this.caveMask[x][y] = distance < radiusLimit;
            }
        }
    }

    private initializeGrid() {
        this.grid = [];

        for (let x = 0; x < this.width; x++) {
            this.grid[x] = [];
            for (let y = 0; y < this.height; y++) {
                if (this.caveMask[x][y]) {
                    if (this.isMaskBoundary(x, y)) {
                        // Edge of the cave mask is always a wall to form the shell
                        this.grid[x][y] = 1;
                    } else {
                        // Interior is random
                        this.grid[x][y] = Math.random() < WORLD_GEN_CONFIG.cave.initialChance ? 1 : 0;
                    }
                } else {
                    // Outside mask is void
                    this.grid[x][y] = 0;
                }
            }
        }
    }

    private isMaskBoundary(x: number, y: number): boolean {
        if (!this.caveMask[x][y]) return false;

        // Check neighbors. If any neighbor is NOT in mask, then this is a boundary.
        for (let nx = x - 1; nx <= x + 1; nx++) {
            for (let ny = y - 1; ny <= y + 1; ny++) {
                if (nx < 0 || nx >= this.width || ny < 0 || ny >= this.height) {
                    // Edge of map is considered "outside mask" for this purpose
                    return true; 
                }
                if (!this.caveMask[nx][ny]) {
                    return true;
                }
            }
        }
        return false;
    }

    private smoothMap() {
        const newGrid: number[][] = [];

        for (let x = 0; x < this.width; x++) {
            newGrid[x] = [];
            for (let y = 0; y < this.height; y++) {
                if (this.caveMask[x][y]) {
                    // Preserve boundary walls!
                    if (this.isMaskBoundary(x, y)) {
                        newGrid[x][y] = 1;
                        continue;
                    }

                    const neighborWallCount = this.getNeighborWallCount(x, y);

                    if (neighborWallCount > 4) {
                        newGrid[x][y] = 1;
                    } else if (neighborWallCount < 4) {
                        newGrid[x][y] = 0;
                    } else {
                        newGrid[x][y] = this.grid[x][y];
                    }
                } else {
                    newGrid[x][y] = 0;
                }
            }
        }

        this.grid = newGrid;
    }

    private getNeighborWallCount(gridX: number, gridY: number): number {
        let wallCount = 0;

        for (let neighborX = gridX - 1; neighborX <= gridX + 1; neighborX++) {
            for (let neighborY = gridY - 1; neighborY <= gridY + 1; neighborY++) {
                if (neighborX >= 0 && neighborX < this.width && neighborY >= 0 && neighborY < this.height) {
                    if (neighborX !== gridX || neighborY !== gridY) {
                        // Count walls. Note: Outside mask is 0 (Empty), so we don't count it.
                        // This allows internal walls to "erode" if they are near empty space, 
                        // but since we preserve the shell via isMaskBoundary in smoothMap, 
                        // we only care about internal CA here.
                        if (this.grid[neighborX][neighborY] === 1) {
                            wallCount++;
                        }
                    }
                } else {
                    // Outside map bounds.
                    wallCount++;
                }
            }
        }

        return wallCount;
    }

    private createOrganicEntrances(count: number) {
        const centerX = this.width / 2;
        const centerY = this.height / 2;

        for (let i = 0; i < count; i++) {
            // Cast a ray from outside towards center
            const angle = Math.random() * Math.PI * 2;
            const dx = Math.cos(angle);
            const dy = Math.sin(angle);

            // Start far out
            let tx = centerX + dx * (Math.max(this.width, this.height));
            let ty = centerY + dy * (Math.max(this.width, this.height));

            // Walk towards center until we hit a wall (the shell)
            let steps = 0;
            const maxSteps = Math.max(this.width, this.height) * 2;

            while (steps < maxSteps) {
                const gridX = Math.round(tx);
                const gridY = Math.round(ty);

                if (gridX >= 0 && gridX < this.width && gridY >= 0 && gridY < this.height) {
                    if (this.grid[gridX][gridY] === 1) {
                        // Found the shell! Dig from here inwards
                        this.digTunnel({ startX: gridX, startY: gridY, dx: -dx, dy: -dy });
                        break;
                    }
                }

                tx -= dx * 0.5; // Step size
                ty -= dy * 0.5;
                steps++;
            }
        }
    }

    private digTunnel(options: { startX: number; startY: number; dx: number; dy: number }) {
        let x = options.startX;
        let y = options.startY;
        let steps = 0;
        const maxSteps = 25; // Dig deeper for organic shapes

        // Using floating point for direction to handle angles
        let cx = x;
        let cy = y;

        // Clear the starting wall area (wider entrance)
        this.clearCircle(Math.round(cx), Math.round(cy), 2);

        // Move inward
        while (steps < maxSteps) {
            cx += options.dx;
            cy += options.dy;
            steps++;

            const ix = Math.round(cx);
            const iy = Math.round(cy);

            if (ix < 0 || ix >= this.width || iy < 0 || iy >= this.height) break;

            // If we hit open space inside the cave, stop
            // But we need to ensure we punched through the shell first. 
            // The shell might be thick.
            // Let's just dig for a bit, then check if we are in open space.
            if (steps > 5 && this.grid[ix][iy] === 0 && this.isInsideCave(ix, iy)) {
                 // Connected!
                 break;
            }

            this.clearCircle(ix, iy, 1.5);
            
            // Add slight randomness to direction
            cx += (Math.random() - 0.5) * 0.5;
            cy += (Math.random() - 0.5) * 0.5;
        }
    }

    private clearCircle(centerX: number, centerY: number, radius: number) {
        const r2 = radius * radius;
        for (let x = Math.floor(centerX - radius); x <= Math.ceil(centerX + radius); x++) {
            for (let y = Math.floor(centerY - radius); y <= Math.ceil(centerY + radius); y++) {
                if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
                    const dx = x - centerX;
                    const dy = y - centerY;
                    if (dx*dx + dy*dy <= r2) {
                        this.grid[x][y] = 0;
                    }
                }
            }
        }
    }
}
