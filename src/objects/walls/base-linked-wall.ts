import Phaser from 'phaser';
import { BaseWall, BaseWallOptions } from './base-wall';
import { DEBUG_SETTINGS, GAME_CONFIG } from '../../config/constants';
import { WALL_ATLAS_MAPPING, WALL_SOLID_COLOR } from './wall-constants';
import { WallMaterial } from '../../config/wall-data';

export interface BaseLinkedWallOptions extends BaseWallOptions {
    material?: WallMaterial;
}

export class BaseLinkedWall extends BaseWall {
    private static wallRegistry: Map<string, BaseLinkedWall> = new Map();

    public static getWallAt(gridX: number, gridY: number): BaseLinkedWall | undefined {
        return this.wallRegistry.get(`${gridX},${gridY}`);
    }

    public static clearRegistry() {
        this.wallRegistry.clear();
    }

    private gridX: number;
    private gridY: number;
    private solidColor: number = WALL_SOLID_COLOR;
    private solidGraphics?: Phaser.GameObjects.Graphics;
    private debugText?: Phaser.GameObjects.Text;
    public autoUpdate: boolean = true;
    
    // Stats
    protected maxHealth: number = 100;
    protected currentHealth: number = 100;
    protected wallTint?: number;

    constructor(options: BaseLinkedWallOptions) {
        super(options);
        
        // Snap to grid for logic
        // Use Math.floor to ensure consistent grid coordinates for tiles starting at index 0
        this.gridX = Math.floor(options.x / GAME_CONFIG.TILE_SIZE);
        this.gridY = Math.floor(options.y / GAME_CONFIG.TILE_SIZE);
        
        // Apply Material Stats
        if (options.material) {
            this.maxHealth = options.material.maxHealth;
            this.currentHealth = this.maxHealth;
            this.wallTint = options.material.tint;
        }

        // Register
        BaseLinkedWall.wallRegistry.set(this.getKey(this.gridX, this.gridY), this);

        // Initial update (defer to next tick to ensure neighbors are created)
        options.scene.time.delayedCall(1, () => {
            this.updateConnection();
            this.updateSurroundings();
            
            // Apply Tint if set
            if (this.wallTint !== undefined) {
                this.setTint(this.wallTint);
                // Also update solid color to match tint if it's not the default
                this.solidColor = this.wallTint;
            }
        });
    }


    private getKey(gx: number, gy: number): string {
        return `${gx},${gy}`;
    }

    public setDepth(value: number): this {
        super.setDepth(value);
        if (this.solidGraphics) {
            this.solidGraphics.setDepth(value);
        }
        if (this.debugText) {
            this.debugText.setDepth(value + 1);
        }
        return this;
    }

    public updateConnection() {
        if (!this.scene || !this.autoUpdate) return;

        // 1. Calculate raw connectivity (who is present)
        const nN = this.getNeighbor(0, -1);
        const nE = this.getNeighbor(1, 0);
        const nS = this.getNeighbor(0, 1);
        const nW = this.getNeighbor(-1, 0);

        let rawMask = 0;
        if (nN) rawMask |= 1;
        if (nE) rawMask |= 2;
        if (nS) rawMask |= 4;
        if (nW) rawMask |= 8;

        // 2. Check if I am solid (Surrounded on all sides)
        const isSolid = (rawMask === 15);
        this.setSolidMode(isSolid);

        if (isSolid) {
            this.updateDebugInfo(15, 'S');
            return;
        }

        // 3. I am not solid (Perimeter). Calculate visual mask.
        // We want a clean "Box" look. 
        // We ignore neighbors that are themselves SOLID (surrounded).
        // This ensures perimeter walls don't visually connect to the solid interior.
        
        let visualMask = 0;
        if (nN && !nN.checkSurrounded()) visualMask |= 1;
        if (nE && !nE.checkSurrounded()) visualMask |= 2;
        if (nS && !nS.checkSurrounded()) visualMask |= 4;
        if (nW && !nW.checkSurrounded()) visualMask |= 8;

        const frameIndex = WALL_ATLAS_MAPPING[visualMask];
        this.setFrame(frameIndex);
        
        this.updateDebugInfo(visualMask, frameIndex);
    }

    private updateDebugInfo(mask: number, frame: string | number) {
        if (DEBUG_SETTINGS.SHOW_WALL_DEBUG) {
            if (!this.debugText) {
                this.debugText = this.scene.add.text(this.x, this.y, '', { 
                    fontSize: '10px', 
                    color: '#ffffff',
                    backgroundColor: '#000000'
                }).setOrigin(0.5).setDepth(1000);
            }
            this.debugText.setText(`M:${mask}\nF:${frame}`);
            this.debugText.setVisible(true);
        } else if (this.debugText) {
            this.debugText.setVisible(false);
        }
    }

    // Public to allow neighbors to access it
    public getNeighbor(dx: number, dy: number): BaseLinkedWall | undefined {
        const key = this.getKey(this.gridX + dx, this.gridY + dy);
        const neighbor = BaseLinkedWall.wallRegistry.get(key);
        // Only connect to walls of the SAME type/texture
        if (neighbor && neighbor.texture.key === this.texture.key) {
            return neighbor;
        }
        return undefined;
    }

    private checkSurrounded(): boolean {
        return this.hasNeighbor(0, -1) && 
               this.hasNeighbor(1, 0) && 
               this.hasNeighbor(0, 1) && 
               this.hasNeighbor(-1, 0);
    }

    private hasNeighbor(dx: number, dy: number): boolean {
        return this.getNeighbor(dx, dy) !== undefined;
    }

    private setSolidMode(isSolid: boolean) {
        if (isSolid) {
            this.setVisible(false);
            if (!this.solidGraphics) {
                this.solidGraphics = this.scene.add.graphics();
                this.solidGraphics.fillStyle(this.solidColor, 1);
                this.solidGraphics.fillRect(
                    this.x - GAME_CONFIG.TILE_SIZE / 2, 
                    this.y - GAME_CONFIG.TILE_SIZE / 2, 
                    GAME_CONFIG.TILE_SIZE, 
                    GAME_CONFIG.TILE_SIZE
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

    public updateSurroundings() {
        // We need to update a larger area to ensure consistency.
        // When a wall is added/removed:
        // 1. Its immediate neighbors might change their Solid state (become surrounded/un-surrounded).
        // 2. If an immediate neighbor changes Solid state, *its* neighbors might need to update their visual mask (because they ignore solid neighbors).
        // So we update all walls within Manhattan Distance 2.

        const wallsToUpdate = new Set<BaseLinkedWall>();

        // Offsets for Manhattan Distance <= 2
        // Distance 1: (0,1), (0,-1), (1,0), (-1,0)
        // Distance 2: (0,2), (0,-2), (2,0), (-2,0), (1,1), (1,-1), (-1,1), (-1,-1)
        const offsets = [
            // Distance 1
            {x: 0, y: -1}, {x: 1, y: 0}, {x: 0, y: 1}, {x: -1, y: 0},
            // Distance 2 (Cardinals)
            {x: 0, y: -2}, {x: 2, y: 0}, {x: 0, y: 2}, {x: -2, y: 0},
            // Distance 2 (Diagonals)
            {x: 1, y: -1}, {x: 1, y: 1}, {x: -1, y: 1}, {x: -1, y: -1}
        ];

        offsets.forEach(offset => {
            const w = this.getNeighbor(offset.x, offset.y);
            if (w) wallsToUpdate.add(w);
        });

        // Also update self just in case
        wallsToUpdate.add(this);

        wallsToUpdate.forEach(w => w.updateConnection());
    }

    public destroy(fromScene?: boolean) {
        BaseLinkedWall.wallRegistry.delete(this.getKey(this.gridX, this.gridY));
        
        if (!fromScene) {
            this.updateSurroundings();
        }

        if (this.solidGraphics) {
            this.solidGraphics.destroy();
        }
        if (this.debugText) {
            this.debugText.destroy();
        }
        super.destroy(fromScene);
    }
}
