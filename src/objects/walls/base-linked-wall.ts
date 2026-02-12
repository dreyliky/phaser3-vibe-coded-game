import Phaser from 'phaser';
import { BaseWall, BaseWallOptions } from './base-wall';
import { DEBUG_SETTINGS, GAME_CONFIG, DEPTHS } from '../../config/constants';
import { WALL_ATLAS_MAPPING, WALL_SOLID_COLOR } from './wall-constants';
import { WallMaterial } from '../../config/wall-data';

import { Damageable } from '../../types/damageable';

export interface BaseLinkedWallOptions extends BaseWallOptions {
    material?: WallMaterial;
}

export class BaseLinkedWall extends BaseWall implements Damageable {
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
    private crackGraphics?: Phaser.GameObjects.Graphics;
    
    // Gradient Images for Rounded Corners
    private cornerImages: Phaser.GameObjects.Image[] = [];
    private innerCornerImages: Phaser.GameObjects.Image[] = [];

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
                // Only override solid color if the tint is NOT white (default)
                if (this.wallTint !== 0xFFFFFF) {
                    this.solidColor = this.wallTint;
                }
            }
        });
    }



    public getHealth(): number {
        return this.currentHealth;
    }

    public getMaxHealth(): number {
        return this.maxHealth;
    }

    public takeDamage(amount: number): void {
        this.currentHealth -= amount;
        
        // Visual feedback (flash red)
        this.scene.tweens.add({
            targets: this,
            alpha: 0.5,
            duration: 50,
            yoyo: true,
            repeat: 1
        });

        this.updateCracks();

        if (this.currentHealth <= 0) {
            this.destroy();
        }
    }

    private updateCracks() {
        if (!this.crackGraphics) {
            this.crackGraphics = this.scene.add.graphics();
            this.crackGraphics.setDepth(this.depth + 1);
        }

        this.crackGraphics.clear();
        
        const healthRatio = this.currentHealth / this.maxHealth;
        if (healthRatio >= 1) return;

        // Draw cracks based on damage
        this.crackGraphics.lineStyle(2, 0x000000, 0.7);
        
        const centerX = this.x;
        const centerY = this.y;
        const size = GAME_CONFIG.TILE_SIZE;
        
        // More cracks as health gets lower
        const crackCount = Math.floor((1 - healthRatio) * 5);
        
        for (let i = 0; i < crackCount; i++) {
            // Pseudo-random based on position and index to keep cracks consistent-ish
            // (In a real game, use a seeded random or stored crack data)
            const seed = (this.gridX * 100 + this.gridY) * 10 + i;
            const r1 = Math.sin(seed) * 0.5 + 0.5;
            const r2 = Math.cos(seed) * 0.5 + 0.5;
            const r3 = Math.sin(seed * 2) * 0.5 + 0.5;
            
            const startX = centerX + (r1 - 0.5) * size * 0.8;
            const startY = centerY + (r2 - 0.5) * size * 0.8;
            
            const endX = startX + (r3 - 0.5) * size * 0.6;
            const endY = startY + (Math.cos(seed * 2) - 0.5) * size * 0.6;
            
            this.crackGraphics.moveTo(startX, startY);
            this.crackGraphics.lineTo(endX, endY);
        }
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
        // Use getAnyNeighbor for solid check (Any wall type counts as a "blocker")
        const anyN = this.getAnyNeighbor(0, -1);
        const anyE = this.getAnyNeighbor(1, 0);
        const anyS = this.getAnyNeighbor(0, 1);
        const anyW = this.getAnyNeighbor(-1, 0);

        let solidMask = 0;
        if (anyN) solidMask |= 1;
        if (anyE) solidMask |= 2;
        if (anyS) solidMask |= 4;
        if (anyW) solidMask |= 8;

        // 2. Check if I am solid (Surrounded on all sides by ANY wall)
        const isSolid = (solidMask === 15);
        this.setSolidMode(isSolid);

        if (isSolid) {
            this.updateDebugInfo(15, 'S');
            return;
        }

        // 3. I am not solid (Perimeter). Calculate visual mask.
        // We want a clean "Box" look. 
        // We ignore neighbors that are themselves SOLID (surrounded).
        // This ensures perimeter walls don't visually connect to the solid interior.
        // For visual connections, we ONLY check SAME TYPE neighbors.
        
        const nN = this.getNeighbor(0, -1);
        const nE = this.getNeighbor(1, 0);
        const nS = this.getNeighbor(0, 1);
        const nW = this.getNeighbor(-1, 0);

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
                }).setOrigin(0.5).setDepth(DEPTHS.DEBUG.TEXT);
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

    private getAnyNeighbor(dx: number, dy: number): BaseLinkedWall | undefined {
        const key = this.getKey(this.gridX + dx, this.gridY + dy);
        return BaseLinkedWall.wallRegistry.get(key);
    }

    public checkSurrounded(): boolean {
        return this.getAnyNeighbor(0, -1) !== undefined && 
               this.getAnyNeighbor(1, 0) !== undefined && 
               this.getAnyNeighbor(0, 1) !== undefined && 
               this.getAnyNeighbor(-1, 0) !== undefined;
    }

    private setSolidMode(isSolid: boolean) {
        if (isSolid) {
            this.setVisible(false);
            this.updateSolidGraphics();
        } else {
            this.setVisible(true);
            if (this.solidGraphics) {
                this.solidGraphics.setVisible(false);
            }
        }
    }

    private updateSolidGraphics() {
        if (!this.solidGraphics) {
            this.solidGraphics = this.scene.add.graphics();
            this.solidGraphics.setDepth(this.depth);
        }
        
        this.solidGraphics.clear();
        this.solidGraphics.setVisible(true);

        // Hide all corner images first
        this.cornerImages.forEach(img => img.setVisible(false));
        this.innerCornerImages.forEach(img => img.setVisible(false));
        
        // Ensure texture exists
        this.ensureGradientTexture();
        this.ensureInnerCornerTexture();

        // Reduced overlap sizes as requested
        const solidOverlap = 24; // Increased from 22
        const gradientOverlap = 24; // Reduced from 42 to match solidR (User Request)
        
        const size = GAME_CONFIG.TILE_SIZE;
        const halfSize = size / 2;
        const color = this.solidColor;

        // Check neighbors for solidity
        const nN = this.getAnyNeighbor(0, -1);
        const nE = this.getAnyNeighbor(1, 0);
        const nS = this.getAnyNeighbor(0, 1);
        const nW = this.getAnyNeighbor(-1, 0);

        // Diagonals for corners
        const nNW = this.getAnyNeighbor(-1, -1);
        const nNE = this.getAnyNeighbor(1, -1);
        const nSW = this.getAnyNeighbor(-1, 1);
        const nSE = this.getAnyNeighbor(1, 1);

        const solidN = nN ? nN.checkSurrounded() : false;
        const solidE = nE ? nE.checkSurrounded() : false;
        const solidS = nS ? nS.checkSurrounded() : false;
        const solidW = nW ? nW.checkSurrounded() : false;

        const solidNW = nNW ? nNW.checkSurrounded() : false;
        const solidNE = nNE ? nNE.checkSurrounded() : false;
        const solidSW = nSW ? nSW.checkSurrounded() : false;
        const solidSE = nSE ? nSE.checkSurrounded() : false;

        // Determine if corners should be rounded (Outer Corners)
        // Only round if no neighbors on sides AND no diagonal neighbor (matches drawSolidCorner logic)
        const roundNW = !solidN && !solidW && !solidNW;
        const roundNE = !solidN && !solidE && !solidNE;
        const roundSW = !solidS && !solidW && !solidSW;
        const roundSE = !solidS && !solidE && !solidSE;

        // 1. Center (Cross Shape + Corners)
        this.solidGraphics.fillStyle(color, 1);
        
        // Vertical Strip (Center)
        this.solidGraphics.fillRect(
            this.x - halfSize, 
            this.y - halfSize + solidOverlap, 
            size, 
            size - (solidOverlap * 2)
        );

        // Horizontal Strip (Center)
        this.solidGraphics.fillRect(
            this.x - halfSize + solidOverlap, 
            this.y - halfSize, 
            size - (solidOverlap * 2), 
            size
        );

        // Fill Inner Corners
        let innerIndex = 0;
        const innerNW = solidN && solidW && !solidNW;
        const innerNE = solidN && solidE && !solidNE;
        const innerSW = solidS && solidW && !solidSW;
        const innerSE = solidS && solidE && !solidSE;

        // NW Inner
        if (innerNW) {
            const img = this.getInnerCornerImage(innerIndex++);
            img.setPosition(this.x - halfSize + (solidOverlap / 2), this.y - halfSize + (solidOverlap / 2));
            img.setOrigin(0.5);
            img.setAngle(0); // Top-Left cut-out matches NW placement (0,0)
            img.setTint(color);
            img.setVisible(true);
        } else if (!roundNW) {
            this.solidGraphics.fillRect(this.x - halfSize, this.y - halfSize, solidOverlap, solidOverlap);
        }

        // NE Inner
        if (innerNE) {
            const img = this.getInnerCornerImage(innerIndex++);
            img.setPosition(this.x + halfSize - solidOverlap + (solidOverlap / 2), this.y - halfSize + (solidOverlap / 2));
            img.setOrigin(0.5);
            img.setAngle(90); // Rotate to TR
            img.setTint(color);
            img.setVisible(true);
        } else if (!roundNE) {
            this.solidGraphics.fillRect(this.x + halfSize - solidOverlap, this.y - halfSize, solidOverlap, solidOverlap);
        }

        // SW Inner
        if (innerSW) {
            const img = this.getInnerCornerImage(innerIndex++);
            img.setPosition(this.x - halfSize + (solidOverlap / 2), this.y + halfSize - solidOverlap + (solidOverlap / 2));
            img.setOrigin(0.5);
            img.setAngle(-90); // Rotate to BL
            img.setTint(color);
            img.setVisible(true);
        } else if (!roundSW) {
            this.solidGraphics.fillRect(this.x - halfSize, this.y + halfSize - solidOverlap, solidOverlap, solidOverlap);
        }

        // SE Inner
        if (innerSE) {
            const img = this.getInnerCornerImage(innerIndex++);
            img.setPosition(this.x + halfSize - solidOverlap + (solidOverlap / 2), this.y + halfSize - solidOverlap + (solidOverlap / 2));
            img.setOrigin(0.5);
            img.setAngle(180); // Rotate to BR
            img.setTint(color);
            img.setVisible(true);
        } else if (!roundSE) {
            this.solidGraphics.fillRect(this.x + halfSize - solidOverlap, this.y + halfSize - solidOverlap, solidOverlap, solidOverlap);
        }

        // 2. Edge Strips (Solid Part + Gradient Part)
        // Shorten strips if they connect to a rounded corner
        
        // North
        this.drawSolidStrip(
            this.x - halfSize, this.y - halfSize - solidOverlap - gradientOverlap, 
            size, solidOverlap + gradientOverlap, 
            solidOverlap, gradientOverlap,
            solidN, 
            color, 
            0, 0, 1, 1, // Top-to-Bottom fade (0->1)
            roundNW ? solidOverlap : 0, // Shorten Left
            roundNE ? solidOverlap : 0  // Shorten Right
        );

        // South
        this.drawSolidStrip(
            this.x - halfSize, this.y + halfSize, 
            size, solidOverlap + gradientOverlap, 
            solidOverlap, gradientOverlap,
            solidS, 
            color, 
            1, 1, 0, 0, // Top-to-Bottom fade (1->0)
            roundSW ? solidOverlap : 0, // Shorten Left
            roundSE ? solidOverlap : 0  // Shorten Right
        );

        // West
        this.drawSolidStrip(
            this.x - halfSize - solidOverlap - gradientOverlap, this.y - halfSize, 
            solidOverlap + gradientOverlap, size, 
            solidOverlap, gradientOverlap,
            solidW, 
            color, 
            0, 1, 0, 1, // Left-to-Right fade (0->1)
            roundNW ? solidOverlap : 0, // Shorten Top
            roundSW ? solidOverlap : 0  // Shorten Bottom
        );

        // East
        this.drawSolidStrip(
            this.x + halfSize, this.y - halfSize, 
            solidOverlap + gradientOverlap, size, 
            solidOverlap, gradientOverlap,
            solidE, 
            color, 
            1, 0, 1, 0, // Left-to-Right fade (1->0)
            roundNE ? solidOverlap : 0, // Shorten Top
            roundSE ? solidOverlap : 0  // Shorten Bottom
        );

        // 3. Corners
        let imageIndex = 0;
        
        // NW Corner
        this.drawSolidCorner(
            this.x - halfSize - solidOverlap - gradientOverlap, this.y - halfSize - solidOverlap - gradientOverlap,
            solidOverlap + gradientOverlap, solidOverlap + gradientOverlap,
            solidOverlap, gradientOverlap,
            color,
            solidNW ? 1 : 0, solidN ? 1 : 0, solidW ? 1 : 0, 1,
            () => this.getCornerImage(imageIndex++)
        );

        // NE Corner
        this.drawSolidCorner(
            this.x + halfSize, this.y - halfSize - solidOverlap - gradientOverlap,
            solidOverlap + gradientOverlap, solidOverlap + gradientOverlap,
            solidOverlap, gradientOverlap,
            color,
            solidN ? 1 : 0, solidNE ? 1 : 0, 1, solidE ? 1 : 0,
            () => this.getCornerImage(imageIndex++)
        );

        // SW Corner
        this.drawSolidCorner(
            this.x - halfSize - solidOverlap - gradientOverlap, this.y + halfSize,
            solidOverlap + gradientOverlap, solidOverlap + gradientOverlap,
            solidOverlap, gradientOverlap,
            color,
            solidW ? 1 : 0, 1, solidSW ? 1 : 0, solidS ? 1 : 0,
            () => this.getCornerImage(imageIndex++)
        );

        // SE Corner
        this.drawSolidCorner(
            this.x + halfSize, this.y + halfSize,
            solidOverlap + gradientOverlap, solidOverlap + gradientOverlap,
            solidOverlap, gradientOverlap,
            color,
            1, solidE ? 1 : 0, solidS ? 1 : 0, solidSE ? 1 : 0,
            () => this.getCornerImage(imageIndex++)
        );
    }

    private getCornerImage(index: number): Phaser.GameObjects.Image {
        if (!this.cornerImages[index]) {
            const img = this.scene.add.image(0, 0, 'wall-radial-gradient-v4');
            img.setDepth(this.depth); // Same depth as solid graphics
            this.cornerImages[index] = img;
        }
        return this.cornerImages[index];
    }

    private getInnerCornerImage(index: number): Phaser.GameObjects.Image {
        if (!this.innerCornerImages[index]) {
            const img = this.scene.add.image(0, 0, 'wall-inner-corner-v2');
            img.setDepth(this.depth); 
            this.innerCornerImages[index] = img;
        }
        return this.innerCornerImages[index];
    }

    private ensureInnerCornerTexture() {
        const key = 'wall-inner-corner-v2';
        if (!this.scene.textures.exists(key)) {
            const size = 24; // solidOverlap (Updated)
            const radius = 18; // Bigger rounding radius (was 12)
            const canvas = this.scene.textures.createCanvas(key, size, size);
            if (canvas) {
                const context = (canvas as any).context as CanvasRenderingContext2D;
                
                // Fill white square
                context.fillStyle = '#ffffff';
                context.fillRect(0, 0, size, size);
                
                // Cut out rounded corner (Top-Left)
                context.globalCompositeOperation = 'destination-out';
                context.beginPath();
                context.arc(0, 0, radius, 0, Math.PI * 2);
                context.fill();
                
                // Reset composite operation
                context.globalCompositeOperation = 'source-over';
                
                canvas.refresh();
            }
        }
    }

    private ensureGradientTexture() {
        const key = 'wall-radial-gradient-v4';
        if (!this.scene.textures.exists(key)) {
            // Config for the texture
            const solidR = 0; // Set to 0 to match gradient height with rounding
            const gradR = 24; // Matches solidOverlap
            const totalR = solidR + gradR;
            const size = totalR * 2; 
            const center = totalR;

            const canvas = this.scene.textures.createCanvas(key, size, size);
            if (canvas) {
                const context = (canvas as any).context as CanvasRenderingContext2D;
                
                // Radial gradient from center
                const gradient = context.createRadialGradient(center, center, 0, center, center, totalR);
                
                // Calculate stop position for solid part
                const solidStop = solidR / totalR;
                
                gradient.addColorStop(0, 'rgba(255,255,255,1)');
                gradient.addColorStop(solidStop, 'rgba(255,255,255,1)'); 
                gradient.addColorStop(1, 'rgba(255,255,255,0)');
                
                context.fillStyle = gradient;
                context.fillRect(0, 0, size, size);
                
                canvas.refresh();
            }
        }
    }

    private drawSolidStrip(
        x: number, y: number, w: number, h: number, 
        solidSize: number, gradSize: number,
        isSolidNeighbor: boolean, color: number, 
        aTL: number, aTR: number, aBL: number, aBR: number,
        shortenStart: number = 0, shortenEnd: number = 0
    ) {
        if (!this.solidGraphics) return;

        // Apply shortening based on orientation
        if (w > h) {
            // Horizontal Strip (North/South)
            x += shortenStart;
            w -= (shortenStart + shortenEnd);
        } else {
            // Vertical Strip (West/East)
            y += shortenStart;
            h -= (shortenStart + shortenEnd);
        }

        if (isSolidNeighbor) {
            // Fill solid part only
            this.solidGraphics.fillStyle(color, 1);
            let sx = x, sy = y, sw = w, sh = h;
            if (aBL === 1 && aBR === 1 && aTL === 0) { // North
                sy = y + gradSize; sh = solidSize;
            } else if (aTL === 1 && aTR === 1 && aBL === 0) { // South
                sh = solidSize;
            } else if (aTR === 1 && aBR === 1 && aTL === 0) { // West
                sx = x + gradSize; sw = solidSize;
            } else if (aTL === 1 && aBL === 1 && aTR === 0) { // East
                sw = solidSize;
            }
            this.solidGraphics.fillRect(sx, sy, sw, sh);
        } else {
            // Gradient Only
            this.solidGraphics.fillStyle(color, 1);
            let gx = x, gy = y, gw = w, gh = h;
            
            if (aBL === 1 && aBR === 1 && aTL === 0) { // North
                gh = gradSize; 
                gy = y + solidSize; // Shift down to tile edge (worldY)
            } else if (aTL === 1 && aTR === 1 && aBL === 0) { // South
                gh = gradSize; 
                gy = y; // Start at tile edge
            } else if (aTR === 1 && aBR === 1 && aTL === 0) { // West
                gw = gradSize; 
                gx = x + solidSize; // Shift right to tile edge
            } else if (aTL === 1 && aBL === 1 && aTR === 0) { // East
                gw = gradSize; 
                gx = x; // Start at tile edge
            }
            
            this.solidGraphics.fillGradientStyle(color, color, color, color, aTL, aTR, aBL, aBR);
            this.solidGraphics.fillRect(gx, gy, gw, gh);
        }
    }

    private drawSolidCorner(
        x: number, y: number, w: number, h: number, 
        solidSize: number, gradSize: number,
        color: number, aTL: number, aTR: number, aBL: number, aBR: number,
        getImage: () => Phaser.GameObjects.Image
    ) {
        if (!this.solidGraphics) return;

        // Since solidR=0, the effective center for crop is gradSize (24)
        // Texture size is 48x48. Center at 24,24.
        const center = gradSize; 

        // Case 1: NW Outer Corner (Solid is BR)
        if (aBR > 0.9 && aTL < 0.1 && aTR < 0.1 && aBL < 0.1) {
            const img = getImage();
            img.setPosition(x + w + solidSize, y + h + solidSize); 
            img.setOrigin(0.5);
            img.setTint(color);
            img.setVisible(true);
            img.setCrop(0, 0, center, center); // TL Quadrant
            return;
        }

        // Case 2: NE Outer Corner (Solid is BL)
        if (aBL > 0.9 && aTL < 0.1 && aTR < 0.1 && aBR < 0.1) {
            const img = getImage();
            img.setPosition(x - solidSize, y + h + solidSize); 
            img.setOrigin(0.5);
            img.setTint(color);
            img.setVisible(true);
            img.setCrop(center, 0, center, center); // TR Quadrant
            return;
        }

        // Case 3: SW Outer Corner (Solid is TR)
        if (aTR > 0.9 && aTL < 0.1 && aBL < 0.1 && aBR < 0.1) {
            const img = getImage();
            // Fix gap: Shift up by 1px
            img.setPosition(x + w + solidSize, y - solidSize - 1); 
            img.setOrigin(0.5);
            img.setTint(color);
            img.setVisible(true);
            img.setCrop(0, center, center, center); // BL Quadrant
            return;
        }

        // Case 4: SE Outer Corner (Solid is TL)
        if (aTL > 0.9 && aTR < 0.1 && aBL < 0.1 && aBR < 0.1) {
            const img = getImage();
            // Fix gap: Shift up by 1px
            img.setPosition(x - solidSize, y - solidSize - 1); 
            img.setOrigin(0.5);
            img.setTint(color);
            img.setVisible(true);
            img.setCrop(center, center, center, center); // BR Quadrant
            return;
        }

        // Fallback for inner corners or mixed states
        this.solidGraphics.fillGradientStyle(color, color, color, color, aTL, aTR, aBL, aBR);
        this.solidGraphics.fillRect(x, y, w, h);
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
            const w = this.getAnyNeighbor(offset.x, offset.y);
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

        this.cornerImages.forEach(img => img.destroy());
        this.cornerImages = [];

        this.innerCornerImages.forEach(img => img.destroy());
        this.innerCornerImages = [];

        if (this.solidGraphics) {
            this.solidGraphics.destroy();
        }
        if (this.crackGraphics) {
            this.crackGraphics.destroy();
        }
        if (this.debugText) {
            this.debugText.destroy();
        }
        super.destroy(fromScene);
    }
}
