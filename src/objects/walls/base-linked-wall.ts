import Phaser from 'phaser';
import { BaseWall } from './base-wall';

// Mask -> Frame Index mapping derived from analysis
// Mask bitwise: N=1, E=2, S=4, W=8
const MAPPING = [12, 13, 14, 15, 8, 9, 10, 11, 4, 5, 6, 7, 0, 1, 2, 3];

export class BaseLinkedWall extends BaseWall {
    private static wallRegistry: Map<string, BaseLinkedWall> = new Map();
    private static TILE_SIZE = 80;

    private gridX: number;
    private gridY: number;
    private solidColor: number = 0x444444; // Default solid color
    private solidGraphics?: Phaser.GameObjects.Graphics;

    constructor(scene: Phaser.Scene, x: number, y: number, texture: string, frame?: string | number) {
        super(scene, x, y, texture, frame);
        
        // Snap to grid for logic
        this.gridX = Math.round(x / BaseLinkedWall.TILE_SIZE);
        this.gridY = Math.round(y / BaseLinkedWall.TILE_SIZE);
        
        // Register
        BaseLinkedWall.wallRegistry.set(this.getKey(this.gridX, this.gridY), this);

        // Initial update (defer to next tick to ensure neighbors are created)
        scene.time.delayedCall(1, () => this.updateConnection());
    }

    private getKey(gx: number, gy: number): string {
        return `${gx},${gy}`;
    }

    public updateConnection() {
        if (!this.scene) return;

        let mask = 0;
        
        // Check neighbors: N, E, S, W
        if (this.hasNeighbor(0, -1)) mask |= 1; // N
        if (this.hasNeighbor(1, 0))  mask |= 2; // E
        if (this.hasNeighbor(0, 1))  mask |= 4; // S
        if (this.hasNeighbor(-1, 0)) mask |= 8; // W

        // Special case: Surrounded on all sides (Mask 15 -> N+E+S+W)
        if (mask === 15) {
            this.setSolidMode(true);
        } else {
            this.setSolidMode(false);
            const frameIndex = MAPPING[mask];
            this.setFrame(frameIndex);
        }
    }

    private hasNeighbor(dx: number, dy: number): boolean {
        const key = this.getKey(this.gridX + dx, this.gridY + dy);
        const neighbor = BaseLinkedWall.wallRegistry.get(key);
        // Only connect to walls of the SAME type/texture
        return neighbor !== undefined && neighbor.texture.key === this.texture.key;
    }

    private setSolidMode(isSolid: boolean) {
        if (isSolid) {
            this.setVisible(false);
            if (!this.solidGraphics) {
                this.solidGraphics = this.scene.add.graphics();
                this.solidGraphics.fillStyle(this.solidColor, 1);
                this.solidGraphics.fillRect(
                    this.x - BaseLinkedWall.TILE_SIZE / 2, 
                    this.y - BaseLinkedWall.TILE_SIZE / 2, 
                    BaseLinkedWall.TILE_SIZE, 
                    BaseLinkedWall.TILE_SIZE
                );
                // Match depth
                this.solidGraphics.setDepth(this.depth);
            }
            this.solidGraphics.setVisible(true);
        } else {
            this.setVisible(true);
            if (this.solidGraphics) {
                this.solidGraphics.setVisible(false);
            }
        }
    }

    public destroy(fromScene?: boolean) {
        BaseLinkedWall.wallRegistry.delete(this.getKey(this.gridX, this.gridY));
        if (this.solidGraphics) {
            this.solidGraphics.destroy();
        }
        super.destroy(fromScene);
    }
}
