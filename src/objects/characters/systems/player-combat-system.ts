import Phaser from 'phaser';
import { InventoryItem, inventorySystem } from '../../../systems/inventory-system';
import { BaseRangeWeapon, BaseMeleeWeapon, Hands, Shotgun, AssaultRifle } from '../../items';

export class PlayerCombatSystem {
    private scene: Phaser.Scene;
    private player: Phaser.GameObjects.Container;
    
    // Weapon Sprites
    private weaponSprite: Phaser.GameObjects.Sprite;
    private holdingHand: Phaser.GameObjects.Sprite;
    
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
    private fireDelayIndicator: Phaser.GameObjects.Graphics | null = null;

    // Melee State
    private isMeleeAttacking: boolean = false;
    private nextHandToAttack: 'left' | 'right' = Math.random() > 0.5 ? 'left' : 'right';
    private currentDirection: 'north' | 'south' | 'east' | 'west' = 'south';

    constructor(scene: Phaser.Scene, player: Phaser.GameObjects.Container, skinColorInt: number) {
        this.scene = scene;
        this.player = player;

        // Weapon Sprite
        this.weaponSprite = scene.add.sprite(0, 0, '');
        this.weaponSprite.setVisible(false);
        this.player.add(this.weaponSprite);
        
        // Holding Hand (for range weapons)
        this.holdingHand = scene.add.sprite(0, 0, 'weapon_hands');
        this.holdingHand.setTint(skinColorInt);
        this.holdingHand.setVisible(false);
        this.player.add(this.holdingHand);

        // Hands Visuals (Melee)
        this.leftHand = scene.add.sprite(10, -12, 'weapon_hands');
        this.leftHand.setTint(skinColorInt);
        this.leftHand.setVisible(false);
        
        this.rightHand = scene.add.sprite(10, 12, 'weapon_hands');
        this.rightHand.setTint(skinColorInt);
        this.rightHand.setVisible(false);

        this.player.add([this.leftHand, this.rightHand]);

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
            } else if (this.currentDirection === 'south') {
                // South: All Front
                this.player.bringToTop(this.leftHand);
                this.player.bringToTop(this.rightHand);
            } else if (this.currentDirection === 'east') {
                // East: Left Back, Right Front
                this.player.sendToBack(this.leftHand);
                this.player.bringToTop(this.rightHand);
            } else { // west
                // West: Right Back, Left Front
                this.player.sendToBack(this.rightHand);
                this.player.bringToTop(this.leftHand);
            }
        }
        
        // 2. Ranged Weapon (Weapon Sprite + Holding Hand)
        if (this.weaponSprite && this.weaponSprite.visible) {
            if (this.currentDirection === 'north') {
                // North: All Back
                // Send Weapon first (bottom), then Hand (on top of Weapon)
                this.player.sendToBack(this.holdingHand);
                this.player.sendToBack(this.weaponSprite);
            } else {
                // South/East/West: Weapon in Front
                // Bring Weapon first, then Hand (on top of Weapon)
                this.player.bringToTop(this.weaponSprite);
                this.player.bringToTop(this.holdingHand);
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
            this.leftHand.setVisible(true);
            this.rightHand.setVisible(true);
        } else if (this.weaponSprite) {
            // Equip Range Weapon
            this.leftHand.setVisible(false);
            this.rightHand.setVisible(false);
            
            this.weaponSprite.setTexture(item.item.getTexture());
            this.weaponSprite.setVisible(true);
            
            // Set width to 60 and maintain aspect ratio
            this.weaponSprite.displayWidth = 60;
            this.weaponSprite.scaleY = this.weaponSprite.scaleX;
            
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
        this.leftHand.setVisible(false);
        this.rightHand.setVisible(false);
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
        if (this.fireDelayIndicator) {
            const weaponLen = 60; 
            const muzzleDist = weaponLen * 0.5 + 15; 
            
            const weaponX = this.weaponSprite ? this.weaponSprite.x : 0;
            const weaponY = this.weaponSprite ? this.weaponSprite.y : 11;
            
            const indX = weaponX + Math.cos(angle) * muzzleDist;
            const indY = weaponY + Math.sin(angle) * muzzleDist;
            
            this.fireDelayIndicator.x = indX;
            this.fireDelayIndicator.y = indY;
        }
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

            if (this.equippedItem.extraData.currentAmmo <= 0) {
                this.isFiring = false;
                return;
            }

            this.lastFiredTime = now;
            this.equippedItem.extraData.currentAmmo--;

            const isAuto = weapon instanceof AssaultRifle;
            if (!isAuto) {
                this.isFiring = false;
            }

            this.fireBullet(weapon);

            // Show fire delay indicator for weapons with delay (e.g. Shotgun)
            if (weapon instanceof Shotgun) {
                this.showFireDelayIndicator(weapon.getFireRate());
            }
        }
    }

    private showFireDelayIndicator(duration: number) {
        if (this.fireDelayIndicator) this.fireDelayIndicator.destroy();
        
        this.fireDelayIndicator = this.scene.add.graphics();
        this.player.add(this.fireDelayIndicator);
        this.fireDelayIndicator.setDepth(200);
        
        const radius = 10;
        
        // Draw white semi-circle
        this.fireDelayIndicator.clear();
        this.fireDelayIndicator.lineStyle(2, 0xffffff);
        this.fireDelayIndicator.beginPath();
        // Semi-circle (top half relative to rotation? or right half?)
        // Let's use right half (-90 to 90) as it faces forward if 0 is right.
        // Phaser angles: 0 is right. -90 is up. 90 is down.
        // If we want "semi-circle", maybe -90 to 90 is good.
        this.fireDelayIndicator.arc(0, 0, radius, Phaser.Math.DegToRad(-90), Phaser.Math.DegToRad(90), false);
        this.fireDelayIndicator.strokePath();
        
        // Tween: Fade out
        this.scene.tweens.add({
            targets: this.fireDelayIndicator,
            alpha: 0,
            duration: duration,
            onComplete: () => {
                if (this.fireDelayIndicator) {
                    this.fireDelayIndicator.destroy();
                    this.fireDelayIndicator = null;
                }
            }
        });
    }

    private fireBullet(weapon: BaseRangeWeapon) {
        const pointer = this.scene.input.activePointer;
        const worldPoint = pointer.positionToCamera(this.scene.cameras.main) as Phaser.Math.Vector2;
        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, worldPoint.x, worldPoint.y);

        const projectileCount = weapon instanceof Shotgun ? 6 : 1;
        
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

            const bullet = this.scene.add.rectangle(startX, startY, 4, 4, 0xffff00);
            this.scene.physics.add.existing(bullet);
            const body = bullet.body as Phaser.Physics.Arcade.Body;
            
            const speed = 600;
            const velocity = this.scene.physics.velocityFromRotation(finalAngle, speed);
            body.setVelocity(velocity.x, velocity.y);

            this.scene.time.delayedCall(1000, () => bullet.destroy());
        }
    }

    private checkMeleeHit(damage: number) {
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
            
            if ('takeDamage' in gameObject && typeof (gameObject as any).takeDamage === 'function') {
                (gameObject as any).takeDamage(damage);
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
        if (extraData.currentAmmo >= weapon.getMagazineSize()) return;

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
            
            if (extraData.currentAmmo >= weapon.getMagazineSize()) {
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
        
        this.reloadIndicator.setDepth(200);

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
