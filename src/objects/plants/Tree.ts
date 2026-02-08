// import Phaser from 'phaser';
import { BasePlant, BasePlantOptions } from './base-plant';
import { Damageable } from '../../types/damageable';

export class Tree extends BasePlant implements Damageable {
    private bulletHitbox: Phaser.Physics.Arcade.Sprite;
    private maxHealth: number = 100;
    private currentHealth: number = 100;
    private crackGraphics?: Phaser.GameObjects.Graphics;

    constructor(options: BasePlantOptions) {
        super(options);
        
        const width = this.width;
        const height = this.height;
        
        // Tree collider: small box at the bottom (trunk)
        // Reduced height as requested
        const colliderWidth = width * 0.2; 
        const colliderHeight = height * 0.05; // Reduced from 0.1 to 0.05
        
        this.setBodySize(colliderWidth, colliderHeight);
        
        // Offset to position the collider at the bottom center
        // Adjusted to be lower on the trunk (closer to roots)
        const yOffset = height - colliderHeight - 10; 
        
        this.setOffset((width - colliderWidth) / 2, yOffset);

        // Create Bullet Hitbox (Higher, 1/4 of tree height)
        // It needs to be a separate Physics Sprite to have its own body
        this.bulletHitbox = options.scene.physics.add.sprite(this.x, this.y, '');
        this.bulletHitbox.setVisible(false);
        this.bulletHitbox.setOrigin(0.5, 1); // Anchor at bottom to match tree's logical positioning if needed, but center is easier
        
        const hitboxHeight = height * 0.25;
        const hitboxWidth = width * 0.3; // Slightly wider than trunk
        
        this.bulletHitbox.setBodySize(hitboxWidth, hitboxHeight);
        
        // Position hitbox above the trunk collider
        // Tree Origin is (0.5, 0.5) by default for Sprites? No, Arcade Sprites are 0.5, 0.5 usually.
        // BasePlant -> Phaser.Physics.Arcade.Sprite.
        
        // Let's position the hitbox relative to the tree center
        // We want it 1/4 height. Let's say roughly in the middle of the trunk/lower canopy.
        // Trunk collider is at bottom.
        
        this.bulletHitbox.setPosition(this.x, this.y + (height / 2) - (hitboxHeight / 2) - 20); // Tweaking position
        this.bulletHitbox.setImmovable(true);
        
        // Store reference to parent tree in the hitbox for collision handling
        (this.bulletHitbox as any).parentTree = this;
    }

    public getBulletHitbox(): Phaser.Physics.Arcade.Sprite {
        return this.bulletHitbox;
    }

    public getHealth(): number {
        return this.currentHealth;
    }

    public getMaxHealth(): number {
        return this.maxHealth;
    }

    public takeDamage(amount: number): void {
        this.currentHealth -= amount;
        
        // Visual feedback
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

        this.crackGraphics.lineStyle(2, 0x000000, 0.7);
        
        const centerX = this.x;
        const centerY = this.y; // Center of sprite
        
        // Random cracks
        const crackCount = Math.floor((1 - healthRatio) * 5);
        
        for (let i = 0; i < crackCount; i++) {
            const seed = (this.x + this.y) * 10 + i;
            const angle = seed % 6.28;
            const len = 20;
            
            this.crackGraphics.moveTo(centerX, centerY);
            this.crackGraphics.lineTo(centerX + Math.cos(angle) * len, centerY + Math.sin(angle) * len);
        }
    }

    public destroy(fromScene?: boolean) {
        if (this.bulletHitbox) {
            this.bulletHitbox.destroy();
        }
        if (this.crackGraphics) {
            this.crackGraphics.destroy();
        }
        super.destroy(fromScene);
    }
}
