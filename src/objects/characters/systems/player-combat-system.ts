import Phaser from 'phaser';
import { InventoryItem, inventorySystem } from '../../../systems';
import { BaseRangeWeapon, BaseMeleeWeapon, Shotgun, AssaultRifle } from '../../items';
import { Damageable } from '../../../types/damageable';
import { DEPTHS } from '../../../config/constants';

export class PlayerCombatSystem {
    private scene: Phaser.Scene;
    private player: Phaser.GameObjects.Container;
    
    // Weapon Sprites
    private weaponSprite: Phaser.GameObjects.Sprite;
    private holdingHand: Phaser.GameObjects.Sprite;
    
    // Outlines
    private weaponOutline: Phaser.GameObjects.Sprite;
    private holdingHandOutline: Phaser.GameObjects.Sprite;
    private leftHandOutline: Phaser.GameObjects.Sprite;
    private rightHandOutline: Phaser.GameObjects.Sprite;
    
    // Melee Sprites
    private leftHand: Phaser.GameObjects.Sprite;
    private rightHand: Phaser.GameObjects.Sprite;
    private handOffsets = { left: 0, right: 0 };

    // State
    private equippedItem: InventoryItem | null = null;
    private isFiring: boolean = false;
    private lastFiredTime: number = 0;
    private recoilOffset: { x: number, y: number } = { x: 0, y: 0 };
    
    // Reload State
    private isReloading: boolean = false;
    private reloadTimer: Phaser.Time.TimerEvent | null = null;
    private reloadIndicator: Phaser.GameObjects.Graphics | null = null;
    
    // Muzzle Flash
    private muzzleFlash: Phaser.GameObjects.Graphics | null = null;

    // Melee State
    private isMeleeAttacking: boolean = false;
    private nextHandToAttack: 'left' | 'right' = Math.random() > 0.5 ? 'left' : 'right';
    private currentDirection: 'north' | 'south' | 'east' | 'west' = 'south';
    
    private bulletsGroup: Phaser.GameObjects.Group;

    constructor(scene: Phaser.Scene, player: Phaser.GameObjects.Container, skinColorInt: number, bulletsGroup: Phaser.GameObjects.Group) {
        this.scene = scene;
        this.player = player;
        this.bulletsGroup = bulletsGroup;

        // Weapon Sprite
        this.weaponSprite = scene.add.sprite(0, 0, '');
        this.weaponSprite.setVisible(false);
        this.player.add(this.weaponSprite);
        
        // Weapon Outline
        this.weaponOutline = scene.add.sprite(0, 0, '');
        this.weaponOutline.setVisible(false);
        this.weaponOutline.setAlpha(0.4);
        this.weaponOutline.setTint(0xffffff);
        this.player.add(this.weaponOutline);
        
        // Holding Hand (for range weapons)
        this.holdingHand = scene.add.sprite(0, 0, 'weapon_hands');
        this.holdingHand.setTint(skinColorInt);
        this.holdingHand.setVisible(false);
        this.holdingHand.setScale(0.8);
        this.player.add(this.holdingHand);

        // Holding Hand Outline
        this.holdingHandOutline = scene.add.sprite(0, 0, 'weapon_hands');
        this.holdingHandOutline.setVisible(false);
        this.holdingHandOutline.setAlpha(0.4);
        this.holdingHandOutline.setTint(skinColorInt);
        this.holdingHandOutline.setScale(0.8);
        this.player.add(this.holdingHandOutline);

        // Hands Visuals (Melee)
        this.leftHand = scene.add.sprite(10, -12, 'weapon_hands');
        this.leftHand.setTint(skinColorInt);
        this.leftHand.setVisible(false);
        this.leftHand.setScale(0.8);
        
        this.rightHand = scene.add.sprite(10, 12, 'weapon_hands');
        this.rightHand.setTint(skinColorInt);
        this.rightHand.setVisible(false);
        this.rightHand.setScale(0.8);

        // Melee Outlines
        this.leftHandOutline = scene.add.sprite(10, -12, 'weapon_hands');
        this.leftHandOutline.setTint(skinColorInt);
        this.leftHandOutline.setVisible(false);
        this.leftHandOutline.setAlpha(0.4);
        this.leftHandOutline.setScale(0.8);

        this.rightHandOutline = scene.add.sprite(10, 12, 'weapon_hands');
        this.rightHandOutline.setTint(skinColorInt);
        this.rightHandOutline.setVisible(false);
        this.rightHandOutline.setAlpha(0.4);
        this.rightHandOutline.setScale(0.8);

        this.player.add([this.leftHand, this.rightHand, this.leftHandOutline, this.rightHandOutline]);

        // Input Listeners
        scene.input.on('pointerdown', () => {
            this.isFiring = true;
            this.handleShooting();
        });

        scene.input.on('pointerup', () => {
            this.isFiring = false;
        });

        if (scene.input.keyboard) {
            scene.input.keyboard.on('keydown-R', () => {
                this.startReload();
            });
        }
    }

    public update() {
        this.handleRotation();
        this.handleShooting();
    }

    public setDirection(direction: 'north' | 'south' | 'east' | 'west') {
        this.currentDirection = direction;
        this.updateZIndex();
    }

    private updateZIndex() {
        // 1. Melee Hands
        if (this.leftHand.visible && this.rightHand.visible) {
            if (this.currentDirection === 'north') {
                // North: All Back
                this.player.sendToBack(this.leftHand);
                this.player.sendToBack(this.rightHand);
                
                // Show Outlines on Top
                this.leftHandOutline.setVisible(true);
                this.rightHandOutline.setVisible(true);
                this.player.bringToTop(this.leftHandOutline);
                this.player.bringToTop(this.rightHandOutline);
            } else if (this.currentDirection === 'south') {
                // South: All Front
                this.player.bringToTop(this.leftHand);
                this.player.bringToTop(this.rightHand);
                
                // Hide Outlines
                this.leftHandOutline.setVisible(false);
                this.rightHandOutline.setVisible(false);
            } else if (this.currentDirection === 'east') {
                // East: Left Back, Right Front
                this.player.sendToBack(this.leftHand);
                this.player.bringToTop(this.rightHand);
                
                // Hide Outlines
                this.leftHandOutline.setVisible(false);
                this.rightHandOutline.setVisible(false);
            } else { // west
                // West: Right Back, Left Front
                this.player.sendToBack(this.rightHand);
                this.player.bringToTop(this.leftHand);
                
                // Hide Outlines
                this.leftHandOutline.setVisible(false);
                this.rightHandOutline.setVisible(false);
            }
        }
        
        // 2. Ranged Weapon (Weapon Sprite + Holding Hand)
        if (this.weaponSprite && this.weaponSprite.visible) {
            if (this.currentDirection === 'north') {
                // North: All Back
                // Send Weapon first (bottom), then Hand (on top of Weapon)
                this.player.sendToBack(this.holdingHand);
                this.player.sendToBack(this.weaponSprite);

                // Show Outlines on Top
                this.weaponOutline.setVisible(true);
                this.holdingHandOutline.setVisible(true);
                this.player.bringToTop(this.weaponOutline);
                this.player.bringToTop(this.holdingHandOutline);
            } else {
                // South/East/West: Weapon in Front
                // Bring Weapon first, then Hand (on top of Weapon)
                this.player.bringToTop(this.weaponSprite);
                this.player.bringToTop(this.holdingHand);
                
                // Hide Outlines
                this.weaponOutline.setVisible(false);
                this.holdingHandOutline.setVisible(false);
            }
            
            if (this.reloadIndicator) {
                 this.player.bringToTop(this.reloadIndicator);
            }
        }
    }

    public equipWeapon(item: InventoryItem) {
        this.cancelReload();
        this.equippedItem = item;

        if (item.item instanceof BaseMeleeWeapon) {
            // Equip Melee Weapon (Hands)
            this.weaponSprite.setVisible(false);
            this.holdingHand.setVisible(false);
            
            this.weaponOutline.setVisible(false);
            this.holdingHandOutline.setVisible(false);
            
            this.leftHand.setVisible(true);
            this.rightHand.setVisible(true);

            // Hide melee outlines initially (managed by updateZIndex)
            this.leftHandOutline.setVisible(false);
            this.rightHandOutline.setVisible(false);
        } else if (this.weaponSprite) {
            // Equip Range Weapon
            this.leftHand.setVisible(false);
            this.rightHand.setVisible(false);
            this.leftHandOutline.setVisible(false);
            this.rightHandOutline.setVisible(false);
            
            this.weaponSprite.setTexture(item.item.getTexture());
            this.weaponSprite.setVisible(true);
            
            this.weaponOutline.setTexture(item.item.getTexture());
            
            // Set width to 60 and maintain aspect ratio
            this.weaponSprite.displayWidth = 60;
            this.weaponSprite.scaleY = this.weaponSprite.scaleX;

            this.weaponOutline.displayWidth = 60;
            this.weaponOutline.scaleY = this.weaponOutline.scaleX;
            
            // Adjust position: Center of body
            this.weaponSprite.x = 0;
            this.weaponSprite.y = 11;
            
            // Show Holding Hand
            this.holdingHand.setVisible(true);
            this.holdingHand.x = -10;
            this.holdingHand.y = this.weaponSprite.y + 5; 
        }
    }

    public unequipWeapon() {
        this.cancelReload();
        this.equippedItem = null;
        this.weaponSprite.setVisible(false);
        this.holdingHand.setVisible(false);
        this.weaponOutline.setVisible(false);
        this.holdingHandOutline.setVisible(false);
        this.leftHand.setVisible(false);
        this.rightHand.setVisible(false);
        this.leftHandOutline.setVisible(false);
        this.rightHandOutline.setVisible(false);
    }

    public getEquippedItem(): InventoryItem | null {
        return this.equippedItem;
    }

    public getAmmoInfo(): { current: number, total: number, isWeapon: boolean, caliber: string } | null {
        if (!this.equippedItem || !(this.equippedItem.item instanceof BaseRangeWeapon)) {
            return null;
        }

        const weapon = this.equippedItem.item as BaseRangeWeapon;
        const extraData = this.equippedItem.extraData || {};
        const current = extraData.currentAmmo || 0;
        
        const caliber = weapon.getCaliber();
        let total = 0;

        // Count total ammo in inventory
        for (let i = 0; i < 16; i++) {
            const item = inventorySystem.getItemAt('main', i);
            if (item && item.item.getId() === `ammo_${caliber}`) {
                 total += item.quantity;
            }
        }

        return { current, total, isWeapon: true, caliber };
    }

    private handleRotation() {
        // Calculate angle to mouse pointer
        const pointer = this.scene.input.activePointer;
        const worldPoint = pointer.positionToCamera(this.scene.cameras.main) as Phaser.Math.Vector2;
        
        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, worldPoint.x, worldPoint.y);

        // Weapon Rotation
        if (this.weaponSprite && this.weaponSprite.visible) {
            this.weaponSprite.setRotation(angle);
            
            // Move weapon forward by 6px in direction of view
            const forwardOffset = 6;
            const forwardX = Math.cos(angle) * forwardOffset;
            const forwardY = Math.sin(angle) * forwardOffset;

            // Directional Y Offset
            let directionalY = 11; // Default for South
            if (this.currentDirection === 'north') {
                directionalY = 0;
            } else if (this.currentDirection === 'east' || this.currentDirection === 'west') {
                directionalY = 11 - 4; // 7
            }

            // Apply recoil and forward offset
            this.weaponSprite.x = 0 + forwardX + this.recoilOffset.x;
            this.weaponSprite.y = directionalY + forwardY + this.recoilOffset.y;
            
            // Rotate holding hand logic
            // Simple rotation for now as per previous implementation logic (revisiting complex orbit logic if needed)
            // Previous implementation used complex math but user didn't complain about it?
            // Wait, in previous turn I wrote logic to rotate holding hand.
            // Let's reuse that logic.

            // RECOIL PIVOT
            const pivotX = this.weaponSprite.x;
            const pivotY = this.weaponSprite.y;
            const offsetX = -10;
            const offsetY = 5;
            
            if (Math.abs(angle) > Math.PI / 2) {
               this.weaponSprite.setFlipY(true);
               this.holdingHand.setFlipY(true);
               
               // Mirror Y offset logic
               const rotX2 = offsetX * Math.cos(angle) - (-offsetY) * Math.sin(angle);
               const rotY2 = offsetX * Math.sin(angle) + (-offsetY) * Math.cos(angle);
               this.holdingHand.x = pivotX + rotX2;
               this.holdingHand.y = pivotY + rotY2;
            } else {
               this.weaponSprite.setFlipY(false);
               this.holdingHand.setFlipY(false);

               const rotX = offsetX * Math.cos(angle) - offsetY * Math.sin(angle);
               const rotY = offsetX * Math.sin(angle) + offsetY * Math.cos(angle);
               this.holdingHand.x = pivotX + rotX;
               this.holdingHand.y = pivotY + rotY;
            }
            
            this.holdingHand.setRotation(angle);

            // Sync Outlines
            if (this.weaponOutline.visible) {
                this.weaponOutline.setPosition(this.weaponSprite.x, this.weaponSprite.y);
                this.weaponOutline.setRotation(this.weaponSprite.rotation);
                this.weaponOutline.setFlipY(this.weaponSprite.flipY);
            }
            
            if (this.holdingHandOutline.visible) {
                this.holdingHandOutline.setPosition(this.holdingHand.x, this.holdingHand.y);
                this.holdingHandOutline.setRotation(this.holdingHand.rotation);
                this.holdingHandOutline.setFlipY(this.holdingHand.flipY);
            }
        }
        
        // Hands Rotation
        if (this.leftHand.visible && this.rightHand.visible) {
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);

            // Left Hand (10, -12)
            const leftDist = 16 + this.handOffsets.left;
            this.leftHand.setPosition(
                leftDist * cos - (-12) * sin,
                leftDist * sin + (-12) * cos
            );
            this.leftHand.setRotation(angle);

            // Right Hand (10, 12)
            const rightDist = 16 + this.handOffsets.right;
            this.rightHand.setPosition(
                rightDist * cos - 12 * sin,
                rightDist * sin + 12 * cos
            );
            this.rightHand.setRotation(angle);

            // Sync Outlines
            if (this.leftHandOutline.visible) {
                this.leftHandOutline.setPosition(this.leftHand.x, this.leftHand.y);
                this.leftHandOutline.setRotation(this.leftHand.rotation);
                this.leftHandOutline.setFlipY(this.leftHand.flipY);
            }
            if (this.rightHandOutline.visible) {
                this.rightHandOutline.setPosition(this.rightHand.x, this.rightHand.y);
                this.rightHandOutline.setRotation(this.rightHand.rotation);
                this.rightHandOutline.setFlipY(this.rightHand.flipY);
            }
        }

        // Reload Indicator Rotation
        if (this.reloadIndicator) {
            const weaponLen = 60; 
            const muzzleDist = weaponLen * 0.5 + 15; 
            
            const weaponX = this.weaponSprite ? this.weaponSprite.x : 0;
            const weaponY = this.weaponSprite ? this.weaponSprite.y : 11;
            
            const indX = weaponX + Math.cos(angle) * muzzleDist;
            const indY = weaponY + Math.sin(angle) * muzzleDist;
            
            this.reloadIndicator.x = indX;
            this.reloadIndicator.y = indY;
        }

        // Fire Delay Indicator Rotation
        this.updateMuzzleFlashPosition();
    }

    private handleShooting() {
        if (!this.isFiring || !this.equippedItem) return;

        // Cancel reload if trying to shoot
        if (this.isReloading) {
            this.cancelReload();
        }

        const weapon = this.equippedItem.item;
        
        // Melee Attack (Hands)
        if (weapon instanceof BaseMeleeWeapon) {
            if (this.isMeleeAttacking) return;

            this.isMeleeAttacking = true;
            const isLeft = this.nextHandToAttack === 'left';
            
            this.scene.tweens.add({
                targets: this.handOffsets,
                [isLeft ? 'left' : 'right']: 20, // Punch forward offset
                duration: 100,
                yoyo: true,
                onComplete: () => {
                    this.isMeleeAttacking = false;
                    this.nextHandToAttack = isLeft ? 'right' : 'left';
                    // Reset logic is handled by yoyo, but just in case of float errors
                    this.handOffsets[isLeft ? 'left' : 'right'] = 0;
                }
            });
            
            this.checkMeleeHit(weapon.getDamage());
            return;
        }

        if (weapon instanceof BaseRangeWeapon) {
            const now = this.scene.time.now;
            if (now - this.lastFiredTime < weapon.getFireRate()) return;

            if (!this.equippedItem.extraData || (this.equippedItem.extraData.currentAmmo ?? 0) <= 0) {
                this.isFiring = false;
                return;
            }

            this.lastFiredTime = now;
            if (this.equippedItem.extraData) {
                this.equippedItem.extraData.currentAmmo = (this.equippedItem.extraData.currentAmmo || 0) - 1;
            }

            const isAuto = weapon instanceof AssaultRifle;
            if (!isAuto) {
                this.isFiring = false;
            }

            this.showMuzzleFlash(weapon);
            this.fireBullet(weapon);
        }
    }

    private showMuzzleFlash(weapon: BaseRangeWeapon) {
        if (this.muzzleFlash) this.muzzleFlash.destroy();
        
        this.muzzleFlash = this.scene.add.graphics();
        this.player.add(this.muzzleFlash);
        // Ensure flash is above weapon
        this.player.bringToTop(this.muzzleFlash);
        
        // Configuration based on weapon type
        let radius = 10;
        let color = 0xffffaa; // Light yellow
        let alpha = 0.8;
        let duration = 50;

        if (weapon instanceof Shotgun) {
            radius = 25;
            color = 0xffaa00; // More orange/intense
            alpha = 0.9;
            duration = 80;
        } else if (weapon instanceof AssaultRifle) {
            radius = 15;
            color = 0xffffcc;
            alpha = 0.8;
            duration = 40;
        } else {
            // Pistol/Default
            radius = 8;
            color = 0xffffff;
            alpha = 0.7;
            duration = 30;
        }
        
        this.muzzleFlash.clear();
        // Core white center
        this.muzzleFlash.fillStyle(0xffffff, 1);
        this.muzzleFlash.fillCircle(0, 0, radius * 0.4);
        
        // Outer glow
        this.muzzleFlash.fillStyle(color, alpha);
        this.muzzleFlash.fillCircle(0, 0, radius);
        
        // Position update will happen in update() loop, but set initial position here
        this.updateMuzzleFlashPosition();

        // Tween: Fade out
        this.scene.tweens.add({
            targets: this.muzzleFlash,
            alpha: 0,
            scale: 0.5,
            duration: duration,
            onComplete: () => {
                if (this.muzzleFlash) {
                    this.muzzleFlash.destroy();
                    this.muzzleFlash = null;
                }
            }
        });
    }

    private updateMuzzleFlashPosition() {
        if (!this.muzzleFlash || !this.weaponSprite) return;
        
        const weaponLen = 60; 
        const muzzleDist = weaponLen * 0.5 + 5; // Tip of the barrel
        
        const weaponRotation = this.weaponSprite.rotation;
        
        // Calculate position relative to player center
        // Weapon pivot is at player center (0,0) with offset
        // Weapon sprite position:
        const weaponX = this.weaponSprite.x;
        const weaponY = this.weaponSprite.y;
        
        const flashX = weaponX + Math.cos(weaponRotation) * muzzleDist;
        const flashY = weaponY + Math.sin(weaponRotation) * muzzleDist;
        
        this.muzzleFlash.x = flashX;
        this.muzzleFlash.y = flashY;
    }

    private fireBullet(weapon: BaseRangeWeapon) {
        const pointer = this.scene.input.activePointer;
        const worldPoint = pointer.positionToCamera(this.scene.cameras.main) as Phaser.Math.Vector2;
        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, worldPoint.x, worldPoint.y);

        const projectileCount = 1;
        const caliber = weapon.getCaliber();
        
        let texture = 'projectile_standard';
        let colliderScale = 1/8;
        
        switch(caliber) {
            case 'heavy':
                texture = 'projectile_heavy';
                break;
            case 'standard':
                texture = 'projectile_standard';
                break;
            case 'buckshot':
                texture = 'projectile_buckshot';
                colliderScale = 1/4;
                break;
            case 'light':
                texture = 'projectile_light';
                break;
        }
        
        for (let i = 0; i < projectileCount; i++) {
            const spread = 0.1;
            const finalAngle = angle + (Math.random() - 0.5) * spread;

            // Recoil Effect
            if (this.weaponSprite) {
                const recoilDist = 5;
                const recoilX = Math.cos(finalAngle) * -recoilDist;
                const recoilY = Math.sin(finalAngle) * -recoilDist;
                
                this.recoilOffset.x = 0;
                this.recoilOffset.y = 0;
                
                this.scene.tweens.add({
                    targets: this.recoilOffset,
                    x: recoilX,
                    y: recoilY,
                    duration: 50,
                    yoyo: true,
                    ease: 'Quad.easeOut'
                });
            }

            let startX = this.player.x;
            let startY = this.player.y;
            
            if (this.weaponSprite) {
                const weaponLen = this.weaponSprite.displayWidth;
                const muzzleOffset = weaponLen * 0.5;
                startX = this.player.x + this.weaponSprite.x + Math.cos(finalAngle) * muzzleOffset;
                startY = this.player.y + this.weaponSprite.y + Math.sin(finalAngle) * muzzleOffset;
            }

            const bullet = this.bulletsGroup.create(startX, startY, texture) as Phaser.Physics.Arcade.Sprite;
            bullet.setTint(0xffff93);
            bullet.setDepth(DEPTHS.LIGHTING.BASE - 100); // Ensure bullets are above world objects but below lighting
            // this.scene.physics.add.existing(bullet); // Group.create adds physics body if group is physics enabled
            const body = bullet.body as Phaser.Physics.Arcade.Body;
            
            // Set rotation (Assuming sprite points UP)
            bullet.setRotation(finalAngle + Math.PI / 2);
            
            const speed = 1200;
            const velocity = this.scene.physics.velocityFromRotation(finalAngle, speed);
            body.setVelocity(velocity.x, velocity.y);

            // Collider setup
            const width = bullet.width;
            const height = bullet.height;
            const size = width * colliderScale;
            
            body.setSize(size, size);
            
            // Calculate offset to place collider at the tip
            // The tip is at distance height/2 from center in direction of travel
            // We want the collider center to be close to the tip
            const tipDistance = (height / 2) - (size / 2);
            
            const offsetXFromCenter = Math.cos(finalAngle) * tipDistance;
            const offsetYFromCenter = Math.sin(finalAngle) * tipDistance;
            
            const finalOffsetX = offsetXFromCenter + bullet.displayOriginX - (size / 2);
            const finalOffsetY = offsetYFromCenter + bullet.displayOriginY - (size / 2);
            
            body.setOffset(finalOffsetX, finalOffsetY);

            // Store damage in bullet
            (bullet as any).damage = weapon.getDamage();

            this.scene.time.delayedCall(1000, () => {
                if (bullet.active) bullet.destroy();
            });
        }
    }

    private checkMeleeHit(damage: number) {
        // Hands cannot break objects (Walls/Trees)
        // Check if we have a weapon equipped that is NOT just hands (BaseMeleeWeapon could be hands)
        // Actually, BaseMeleeWeapon is generic.
        // We need to check if it's the default "Hands" item or something else.
        // Or simply: if the user said "Hands cannot break objects", and we are here,
        // we need to know if we are using "Hands".
        
        // In equipWeapon:
        // if (item.item instanceof BaseMeleeWeapon) -> Equip Melee Weapon (Hands)
        // Currently we only have Hands as melee?
        // Let's assume if weapon is melee, it might be hands.
        // I'll check the item ID or name.
        
        if (this.equippedItem && this.equippedItem.item) {
             // If it's not hands (id 'weapon_hands' maybe?), allow damage.
             // But we don't have other melee weapons yet.
             // If we add an Axe later, it should damage.
             // For now, assume melee = hands = no structure damage.
             // UNLESS we check if it is NOT hands.
             if (this.equippedItem.item.getId() !== 'weapon_hands') {
                 // canDamageStructures = true; // For future melee weapons
             }
        }
        
        // However, the prompt says "Hands objects cannot be broken".
        // It implies we can't break objects with hands.
        // So I'll enforce: if target is Wall or Tree, and we are using Hands, do nothing.

        const pointer = this.scene.input.activePointer;
        const worldPoint = pointer.positionToCamera(this.scene.cameras.main) as Phaser.Math.Vector2;
        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, worldPoint.x, worldPoint.y);
        
        const reach = 40;
        const hitX = this.player.x + Math.cos(angle) * reach;
        const hitY = this.player.y + Math.sin(angle) * reach;
        
        const bodies = this.scene.physics.overlapCirc(hitX, hitY, 20, true, true) as Phaser.Physics.Arcade.Body[];
        
        for (const body of bodies) {
            if (body.gameObject === this.player) continue;
            
            const gameObject = body.gameObject;
            if (!gameObject) continue;
            
            if ('takeDamage' in gameObject) {
                // Check for structure immunity against hands
                // Assuming all melee currently is Hands.
                // We need to import classes to check instanceof, or check properties.
                // To avoid circular dependency, check if it has 'getMaxHealth' (Damageable).
                
                // Hacky check for Wall/Tree names or types if needed.
                // But simpler: "Hands cannot break objects".
                // If it is a Wall or Tree.
                const isStructure = (gameObject.constructor.name === 'Tree' || 
                                     gameObject.constructor.name === 'BaseLinkedWall' ||
                                     gameObject.constructor.name.includes('Wall'));

                if (isStructure) {
                     // If we are using hands (which we are if we are in melee and no other melee weapon exists)
                     // TODO: When adding Axe/Crowbar, update this check.
                     continue; 
                }

                const damageable = gameObject as unknown as Damageable;
                if (typeof damageable.takeDamage === 'function') {
                    damageable.takeDamage(damage);
                }
            }
        }
    }

    private startReload() {
        if (!this.equippedItem || !(this.equippedItem.item instanceof BaseRangeWeapon)) {
            return;
        }

        if (this.isReloading) return;

        const weapon = this.equippedItem.item as BaseRangeWeapon;
        const extraData = this.equippedItem.extraData || {};
        const currentAmmo = extraData.currentAmmo || 0;
        const magSize = weapon.getMagazineSize();

        if (currentAmmo >= magSize) return;

        if (weapon instanceof Shotgun) {
            this.startShotgunReload(weapon);
        } else {
            this.startMagazineReload(weapon);
        }
    }

    private cancelReload() {
        if (this.isReloading) {
            this.isReloading = false;
            if (this.reloadTimer) {
                this.reloadTimer.remove();
                this.reloadTimer = null;
            }
            if (this.reloadIndicator) {
                this.reloadIndicator.destroy();
                this.reloadIndicator = null;
            }
        }
    }

    private startMagazineReload(weapon: BaseRangeWeapon) {
        const caliber = weapon.getCaliber();
        const ammoItem = this.findAmmoInInventory(caliber);
        
        if (!ammoItem) {
            return;
        }

        this.isReloading = true;
        const duration = weapon.getReloadSpeed();

        this.createReloadIndicator(duration);

        this.reloadTimer = this.scene.time.delayedCall(duration, () => {
            this.finishMagazineReload(weapon);
        });
    }

    private finishMagazineReload(weapon: BaseRangeWeapon) {
        const extraData = this.equippedItem!.extraData || { currentAmmo: 0 };
        const currentAmmo = extraData.currentAmmo || 0;
        const magSize = weapon.getMagazineSize();
        let needed = magSize - currentAmmo;

        const caliber = weapon.getCaliber();
        let consumed = 0;
        
        while (needed > 0) {
            const ammoStack = this.findAmmoInInventory(caliber);
            if (!ammoStack) break;

            const take = Math.min(needed, ammoStack.quantity);
            
            const item = inventorySystem.getItemAt(ammoStack.type, ammoStack.index);
            if (item) {
                item.quantity -= take;
                if (item.quantity <= 0) {
                    inventorySystem.removeItem(ammoStack.type, ammoStack.index);
                } else {
                    inventorySystem.setItemAt(ammoStack.type, ammoStack.index, item);
                }
            }
            
            consumed += take;
            needed -= take;
        }

        extraData.currentAmmo = currentAmmo + consumed;
        this.equippedItem!.extraData = extraData;
        
        this.cancelReload();
    }

    private startShotgunReload(weapon: Shotgun) {
        const caliber = weapon.getCaliber();
        const ammoItem = this.findAmmoInInventory(caliber);
        if (!ammoItem) return;

        const extraData = this.equippedItem!.extraData || { currentAmmo: 0 };
        if ((extraData.currentAmmo || 0) >= weapon.getMagazineSize()) return;

        this.isReloading = true;
        
        const shellDuration = 600; 

        this.createReloadIndicator(shellDuration);

        this.reloadTimer = this.scene.time.delayedCall(shellDuration, () => {
            this.insertShotgunShell(weapon);
        });
    }

    private insertShotgunShell(weapon: Shotgun) {
        if (!this.isReloading) return;

        const caliber = weapon.getCaliber();
        const ammoStack = this.findAmmoInInventory(caliber);
        
        if (ammoStack) {
            const item = inventorySystem.getItemAt(ammoStack.type, ammoStack.index);
            if (item) {
                item.quantity -= 1;
                if (item.quantity <= 0) {
                    inventorySystem.removeItem(ammoStack.type, ammoStack.index);
                } else {
                    inventorySystem.setItemAt(ammoStack.type, ammoStack.index, item);
                }
            }
            
            const extraData = this.equippedItem!.extraData || { currentAmmo: 0 };
            extraData.currentAmmo = (extraData.currentAmmo || 0) + 1;
            this.equippedItem!.extraData = extraData;
            
            if ((extraData.currentAmmo || 0) >= weapon.getMagazineSize()) {
                this.cancelReload();
            } else {
                if (this.reloadIndicator) {
                    this.reloadIndicator.destroy();
                    this.reloadIndicator = null;
                }
                
                const shellDuration = 600;
                this.createReloadIndicator(shellDuration);
                this.reloadTimer = this.scene.time.delayedCall(shellDuration, () => {
                    this.insertShotgunShell(weapon);
                });
            }
        } else {
            this.cancelReload();
        }
    }

    private findAmmoInInventory(caliber: string): { type: 'main' | 'quick', index: number, quantity: number } | null {
        for (let i = 0; i < 16; i++) {
            const item = inventorySystem.getItemAt('main', i);
            if (item && item.item.getId() === `ammo_${caliber}`) {
                 return { type: 'main', index: i, quantity: item.quantity };
            }
        }
        return null;
    }

    private createReloadIndicator(duration: number) {
        if (this.reloadIndicator) this.reloadIndicator.destroy();

        this.reloadIndicator = this.scene.add.graphics();
        this.player.add(this.reloadIndicator);
        
        this.reloadIndicator.setDepth(DEPTHS.COMBAT.RELOAD_INDICATOR);

        const radius = 8;
        const startAngle = -90;
        
        this.scene.tweens.addCounter({
            from: 0,
            to: 360,
            duration: duration,
            onUpdate: (tween) => {
                if (!this.reloadIndicator) return;
                const angle = tween.getValue() as number;
                this.reloadIndicator.clear();
                
                this.reloadIndicator.lineStyle(2, 0x555555);
                this.reloadIndicator.strokeCircle(0, 0, radius);
                
                this.reloadIndicator.lineStyle(2, 0x00ff00);
                this.reloadIndicator.beginPath();
                this.reloadIndicator.arc(0, 0, radius, Phaser.Math.DegToRad(startAngle), Phaser.Math.DegToRad(startAngle + angle), false);
                this.reloadIndicator.strokePath();
            }
        });
    }
}
