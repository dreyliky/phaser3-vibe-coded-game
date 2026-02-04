import Phaser from 'phaser';
import { CharacterDefinition } from '../../types/character';
import { CharacterVisual } from './character-visual';
import { InventoryItem } from '../../systems/inventory-system';
import { BaseRangeWeapon } from '../items';
import { Shotgun, AssaultRifle, Pistol } from '../items';

export class Player extends Phaser.GameObjects.Container {
    private visual: CharacterVisual;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private wasd!: {
        up: Phaser.Input.Keyboard.Key;
        down: Phaser.Input.Keyboard.Key;
        left: Phaser.Input.Keyboard.Key;
        right: Phaser.Input.Keyboard.Key;
    };
    private speed: number = 200;
    
    // Weapon
    private equippedItem: InventoryItem | null = null;
    private weaponSprite: Phaser.GameObjects.Sprite | null = null;
    private lastFiredTime: number = 0;
    private isFiring: boolean = false;

    constructor(scene: Phaser.Scene, x: number, y: number, definition: CharacterDefinition) {
        super(scene, x, y);

        // Visual
        this.visual = new CharacterVisual(scene, 0, 0, definition);
        this.add(this.visual);

        // Weapon Sprite
        this.weaponSprite = scene.add.sprite(0, 0, '');
        this.weaponSprite.setVisible(false);
        this.add(this.weaponSprite);

        // Physics
        scene.physics.add.existing(this);
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setSize(40, 60); // Approximate size, maybe adjustable
        body.setOffset(-20, -30); // Center the body
        body.setCollideWorldBounds(true);

        // Input
        if (scene.input.keyboard) {
            this.cursors = scene.input.keyboard.createCursorKeys();
            this.wasd = scene.input.keyboard.addKeys({
                up: Phaser.Input.Keyboard.KeyCodes.W,
                down: Phaser.Input.Keyboard.KeyCodes.S,
                left: Phaser.Input.Keyboard.KeyCodes.A,
                right: Phaser.Input.Keyboard.KeyCodes.D
            }) as any;
        }

        // Mouse Input for Shooting
        scene.input.on('pointerdown', () => { this.isFiring = true; });
        scene.input.on('pointerup', () => { this.isFiring = false; });

        // Add to scene
        scene.add.existing(this);
    }

    update() {
        this.handleMovement();
        this.handleRotation();
        this.handleShooting();
    }

    public equipWeapon(item: InventoryItem) {
        this.equippedItem = item;
        if (this.weaponSprite) {
            this.weaponSprite.setTexture(item.item.getTexture());
            this.weaponSprite.setVisible(true);
            this.weaponSprite.setDisplaySize(40, 20); // Scale down a bit
            // Adjust position slightly
            this.weaponSprite.x = 10;
            this.weaponSprite.y = 10;
        }
    }

    public unequipWeapon() {
        this.equippedItem = null;
        if (this.weaponSprite) {
            this.weaponSprite.setVisible(false);
        }
    }

    private handleShooting() {
        if (!this.isFiring || !this.equippedItem) return;

        const weapon = this.equippedItem.item;
        if (weapon instanceof BaseRangeWeapon) {
            // Check fire rate
            const now = this.scene.time.now;
            if (now - this.lastFiredTime < weapon.getFireRate()) return;

            // Check ammo
            if (this.equippedItem.extraData.currentAmmo <= 0) {
                // Out of ammo
                // Maybe play click sound
                this.isFiring = false; // Stop firing if out of ammo (simplification)
                return;
            }

            // Fire
            this.lastFiredTime = now;
            this.equippedItem.extraData.currentAmmo--;

            // Auto-fire check
            // If weapon is not auto, we need to release the button to fire again.
            // But Phaser's pointerdown/up logic above is simple state.
            // For semi-auto, we should only fire on 'pointerdown' event, not continuously in update loop.
            // But since we are in update loop, we need to know if it's auto.
            // Let's assume AssaultRifle is auto, others are semi.
            const isAuto = weapon instanceof AssaultRifle;
            
            if (!isAuto) {
                this.isFiring = false; // Force release for semi-auto
            }

            this.fireBullet(weapon);
        }
    }

    private fireBullet(weapon: BaseRangeWeapon) {
        // Calculate direction
        const pointer = this.scene.input.activePointer;
        const worldPoint = pointer.positionToCamera(this.scene.cameras.main) as Phaser.Math.Vector2;
        const angle = Phaser.Math.Angle.Between(this.x, this.y, worldPoint.x, worldPoint.y);

        // Projectile count (Shotgun = 6, others = 1)
        const projectileCount = weapon instanceof Shotgun ? 6 : 1;
        
        for (let i = 0; i < projectileCount; i++) {
            // Spread
            const spread = 0.1; // Radians
            const finalAngle = angle + (Math.random() - 0.5) * spread;

            // Create bullet (using graphics for now)
            const bullet = this.scene.add.rectangle(this.x, this.y, 4, 4, 0xffff00);
            this.scene.physics.add.existing(bullet);
            const body = bullet.body as Phaser.Physics.Arcade.Body;
            
            const speed = 600;
            const velocity = this.scene.physics.velocityFromRotation(finalAngle, speed);
            body.setVelocity(velocity.x, velocity.y);

            // Destroy after 1 second
            this.scene.time.delayedCall(1000, () => bullet.destroy());
        }
    }

    private handleMovement() {
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setVelocity(0);

        let velocityX = 0;
        let velocityY = 0;

        if (this.cursors.left.isDown || this.wasd.left.isDown) {
            velocityX = -this.speed;
        } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
            velocityX = this.speed;
        }

        if (this.cursors.up.isDown || this.wasd.up.isDown) {
            velocityY = -this.speed;
        } else if (this.cursors.down.isDown || this.wasd.down.isDown) {
            velocityY = this.speed;
        }

        // Normalize velocity for diagonal movement
        if (velocityX !== 0 && velocityY !== 0) {
            velocityX *= 0.707; // 1 / sqrt(2)
            velocityY *= 0.707;
        }

        body.setVelocity(velocityX, velocityY);
    }

    private handleRotation() {
        // Calculate angle to mouse pointer
        const pointer = this.scene.input.activePointer;
        // Adjust pointer position for camera
        const worldPoint = pointer.positionToCamera(this.scene.cameras.main) as Phaser.Math.Vector2;
        
        const angle = Phaser.Math.Angle.Between(this.x, this.y, worldPoint.x, worldPoint.y);
        const deg = Phaser.Math.RadToDeg(angle);

        // Determine direction based on angle
        // East: -45 to 45
        // South: 45 to 135
        // West: 135 to 180 OR -180 to -135
        // North: -135 to -45

        let direction: 'north' | 'south' | 'east' | 'west' = 'south';

        if (deg >= -45 && deg < 45) {
            direction = 'east';
        } else if (deg >= 45 && deg < 135) {
            direction = 'south';
        } else if (deg >= -135 && deg < -45) {
            direction = 'north';
        } else {
            direction = 'west';
        }

        this.visual.setDirection(direction);
    }
}
