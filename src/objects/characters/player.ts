import Phaser from 'phaser';
import { CharacterDefinition } from '../../types/character';
import { CharacterVisual } from './character-visual';
import { InventoryItem, inventorySystem } from '../../systems/inventory-system';
import { BaseRangeWeapon, BaseMeleeWeapon, Hands } from '../items';
import { Shotgun, AssaultRifle, Pistol } from '../items';
import { Damageable } from '../../interfaces/damageable';

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
    private holdingHand: Phaser.GameObjects.Sprite | null = null;
    private lastFiredTime: number = 0;
    private isFiring: boolean = false;
    private recoilOffset: { x: number, y: number } = { x: 0, y: 0 };

    // Reload
    private isReloading: boolean = false;
    private reloadTimer: Phaser.Time.TimerEvent | null = null;
    private reloadIndicator: Phaser.GameObjects.Graphics | null = null;

    // Hands (Melee)
    private handsContainer: Phaser.GameObjects.Container;
    private leftHand: Phaser.GameObjects.Sprite;
    private rightHand: Phaser.GameObjects.Sprite;
    private nextHandToAttack: 'left' | 'right' = Math.random() > 0.5 ? 'left' : 'right';
    private isMeleeAttacking: boolean = false;

    constructor(scene: Phaser.Scene, x: number, y: number, definition: CharacterDefinition) {
        super(scene, x, y);

        // Visual
        this.visual = new CharacterVisual(scene, 0, 0, definition);
        this.add(this.visual);

        // Weapon Sprite
        this.weaponSprite = scene.add.sprite(0, 0, '');
        this.weaponSprite.setVisible(false);
        this.add(this.weaponSprite);
        
        const skinColorInt = parseInt(definition.skinColor.replace('#', '0x'), 16);

        // Holding Hand (for range weapons)
        // Positioned relative to weapon or center.
        // It should be rendered ABOVE the weapon.
        this.holdingHand = scene.add.sprite(0, 0, 'weapon_hands');
        this.holdingHand.setTint(skinColorInt);
        this.holdingHand.setVisible(false);
        this.add(this.holdingHand);

        // Hands Visuals (Melee)
        this.handsContainer = scene.add.container(0, 0);
        this.handsContainer.setVisible(false);
        this.add(this.handsContainer);

        // Position hands relative to center. Assuming facing East (0 deg) is +X.
        // Left hand is at top (-Y), Right hand is at bottom (+Y).
        // Slightly forward (+X).
        this.leftHand = scene.add.sprite(10, -12, 'weapon_hands');
        this.leftHand.setTint(skinColorInt);
        
        this.rightHand = scene.add.sprite(10, 12, 'weapon_hands');
        this.rightHand.setTint(skinColorInt);

        this.handsContainer.add([this.leftHand, this.rightHand]);

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
        scene.input.on('pointerdown', () => {
            this.isFiring = true;
            this.handleShooting();
        });

        scene.input.on('pointerup', () => {
            this.isFiring = false;
        });

        // Input for reload
        if (scene.input.keyboard) {
            scene.input.keyboard.on('keydown-R', () => {
                this.startReload();
            });
        }

        // Add to scene
        scene.add.existing(this);
    }

    update() {
        this.handleMovement();
        this.handleRotation();
        this.handleShooting();
    }

    public equipWeapon(item: InventoryItem) {
        // Stop any ongoing reload
        this.cancelReload();

        this.equippedItem = item;

        if (item.item instanceof BaseMeleeWeapon) {
            // Equip Melee Weapon (Hands)
            if (this.weaponSprite) {
                this.weaponSprite.setVisible(false);
            }
            if (this.holdingHand) {
                this.holdingHand.setVisible(false);
            }
            this.handsContainer.setVisible(true);
        } else if (this.weaponSprite) {
            // Equip Range Weapon
            this.handsContainer.setVisible(false);
            
            this.weaponSprite.setTexture(item.item.getTexture());
            this.weaponSprite.setVisible(true);
            
            // Set width to 60 and maintain aspect ratio
            this.weaponSprite.displayWidth = 60;
            this.weaponSprite.scaleY = this.weaponSprite.scaleX;
            
            // Adjust position: Center of body
            this.weaponSprite.x = 0;
            this.weaponSprite.y = 11; // Raised by 2px from 13 to 11
            
            // Show Holding Hand
            if (this.holdingHand) {
                this.holdingHand.setVisible(true);
                // Position "under" the weapon along Y axis (visualy below) but layered above
                // "під зброєю по Y" means Y coordinate is larger (downwards in Phaser)
                // Let's place it at weapon Y + offset.
                // Assuming gun grip is somewhere below the center.
                // Or user meant "under" as in "lower Y value" (visually higher)?
                // "під зброєю" usually means "beneath" (higher Y value).
                // Let's try putting it slightly below the weapon center.
                this.holdingHand.x = -10; // Slightly back near grip
                this.holdingHand.y = this.weaponSprite.y + 5; 
            }
        }
    }

    public unequipWeapon() {
        // Stop any ongoing reload
        this.cancelReload();

        this.equippedItem = null;
        if (this.weaponSprite) {
            this.weaponSprite.setVisible(false);
        }
        if (this.holdingHand) {
            this.holdingHand.setVisible(false);
        }
        this.handsContainer.setVisible(false);
    }

    private startReload() {
        if (!this.equippedItem || !(this.equippedItem.item instanceof BaseRangeWeapon)) {
            return;
        }

        if (this.isReloading) return;

        const weapon = this.equippedItem.item as BaseRangeWeapon;
        const extraData = this.equippedItem.extraData || {};
        const currentAmmo = extraData.ammo || 0;
        const magSize = weapon.getMagazineSize();

        if (currentAmmo >= magSize) return; // Full

        // Shotgun Logic
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
        // Check if we have ANY ammo of this type
        const caliber = weapon.getCaliber();
        const ammoItem = this.findAmmoInInventory(caliber);
        
        if (!ammoItem) {
            return;
        }

        this.isReloading = true;
        const duration = weapon.getReloadSpeed();

        // Create indicator
        this.createReloadIndicator(duration);

        this.reloadTimer = this.scene.time.delayedCall(duration, () => {
            this.finishMagazineReload(weapon);
        });
    }

    private finishMagazineReload(weapon: BaseRangeWeapon) {
        const extraData = this.equippedItem!.extraData || { ammo: 0 };
        const currentAmmo = extraData.ammo || 0;
        const magSize = weapon.getMagazineSize();
        let needed = magSize - currentAmmo;

        const caliber = weapon.getCaliber();
        let consumed = 0;
        
        while (needed > 0) {
            const ammoStack = this.findAmmoInInventory(caliber);
            if (!ammoStack) break;

            const take = Math.min(needed, ammoStack.quantity);
            
            // inventorySystem.removeItem(ammoStack.type, ammoStack.index, take); // OLD Incorrect
            
            // Correct way:
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

        // Update weapon ammo
        extraData.ammo = currentAmmo + consumed;
        this.equippedItem!.extraData = extraData;
        
        this.cancelReload();
    }

    private startShotgunReload(weapon: Shotgun) {
        const caliber = weapon.getCaliber();
        const ammoItem = this.findAmmoInInventory(caliber);
        if (!ammoItem) return;

        const extraData = this.equippedItem!.extraData || { ammo: 0 };
        if (extraData.ammo >= weapon.getMagazineSize()) return;

        this.isReloading = true;
        
        // 600ms per shell or based on reloadSpeed?
        // Let's use 600ms per shell as discussed.
        const shellDuration = 600; 

        this.createReloadIndicator(shellDuration);

        this.reloadTimer = this.scene.time.delayedCall(shellDuration, () => {
            this.insertShotgunShell(weapon);
        });
    }

    private insertShotgunShell(weapon: Shotgun) {
        if (!this.isReloading) return; // Cancelled

        const caliber = weapon.getCaliber();
        const ammoStack = this.findAmmoInInventory(caliber);
        
        if (ammoStack) {
            // Take 1
            // inventorySystem.removeItem(ammoStack.type, ammoStack.index, 1);
            
            const item = inventorySystem.getItemAt(ammoStack.type, ammoStack.index);
            if (item) {
                item.quantity -= 1;
                if (item.quantity <= 0) {
                    inventorySystem.removeItem(ammoStack.type, ammoStack.index);
                } else {
                    inventorySystem.setItemAt(ammoStack.type, ammoStack.index, item);
                }
            }
            
            // Add 1
            const extraData = this.equippedItem!.extraData || { ammo: 0 };
            extraData.ammo = (extraData.ammo || 0) + 1;
            this.equippedItem!.extraData = extraData;
            
            // Check if full
            if (extraData.ammo >= weapon.getMagazineSize()) {
                this.cancelReload();
            } else {
                // Continue reloading
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
        this.add(this.reloadIndicator);
        
        this.reloadIndicator.x = 40;
        this.reloadIndicator.y = 11;
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

    private checkMeleeHit(damage: number) {
        // Calculate hit position based on cursor direction
        const pointer = this.scene.input.activePointer;
        const worldPoint = pointer.positionToCamera(this.scene.cameras.main) as Phaser.Math.Vector2;
        const angle = Phaser.Math.Angle.Between(this.x, this.y, worldPoint.x, worldPoint.y);
        
        const reach = 40; // Range of punch
        const hitX = this.x + Math.cos(angle) * reach;
        const hitY = this.y + Math.sin(angle) * reach;
        
        // Check for overlap
        // overlapCirc(x, y, radius, includeDynamic, includeStatic)
        const bodies = this.scene.physics.overlapCirc(hitX, hitY, 20, true, true) as Phaser.Physics.Arcade.Body[];
        
        for (const body of bodies) {
            // Skip self
            if (body.gameObject === this) continue;
            
            const gameObject = body.gameObject;
            if (!gameObject) continue;
            
            // Check for Damageable interface
            if ('takeDamage' in gameObject && typeof (gameObject as any).takeDamage === 'function') {
                (gameObject as any).takeDamage(damage);
                
                // Visual feedback (optional)
                // console.log(`Hit ${gameObject.name || 'object'} for ${damage} damage`);
            }
        }
    }

    private handleShooting() {
        if (!this.isFiring || !this.equippedItem) return;

        const weapon = this.equippedItem.item;
        
        // Melee Attack (Hands)
        if (weapon instanceof BaseMeleeWeapon) {
            if (this.isMeleeAttacking) return;

            // Attack Logic
            this.isMeleeAttacking = true;
            const hand = this.nextHandToAttack === 'left' ? this.leftHand : this.rightHand;
            const originalX = hand.x;

            this.scene.tweens.add({
                targets: hand,
                x: originalX + 20, // Punch forward
                duration: 100,
                yoyo: true,
                onComplete: () => {
                    this.isMeleeAttacking = false;
                    this.nextHandToAttack = this.nextHandToAttack === 'left' ? 'right' : 'left';
                    hand.x = originalX; // Ensure reset
                }
            });
            
            // Deal damage
            this.checkMeleeHit(weapon.getDamage());
            return;
        }

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

            // Recoil Effect
            if (this.weaponSprite) {
                const recoilDist = 5;
                // Calculate recoil vector relative to current weapon rotation
                // Angle is the shooting angle.
                const recoilX = Math.cos(finalAngle) * -recoilDist;
                const recoilY = Math.sin(finalAngle) * -recoilDist;
                
                // We tween the recoilOffset object
                // Reset first
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

            // Calculate muzzle position
            let startX = this.x;
            let startY = this.y;
            
            if (this.weaponSprite) {
                const weaponLen = this.weaponSprite.displayWidth;
                const muzzleOffset = weaponLen * 0.5;
                startX = this.x + this.weaponSprite.x + Math.cos(finalAngle) * muzzleOffset;
                startY = this.y + this.weaponSprite.y + Math.sin(finalAngle) * muzzleOffset;
            }

            // Create bullet (using graphics for now)
            const bullet = this.scene.add.rectangle(startX, startY, 4, 4, 0xffff00);
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

        // Weapon Rotation
        if (this.weaponSprite && this.weaponSprite.visible) {
            this.weaponSprite.setRotation(angle);
            
            // Apply recoil to weapon
            // Base position is (0, 11)
            this.weaponSprite.x = 0 + this.recoilOffset.x;
            this.weaponSprite.y = 11 + this.recoilOffset.y;
            
            // Rotate holding hand with weapon
            if (this.holdingHand && this.holdingHand.visible) {
                 // We need to orbit the hand around the body center to match weapon rotation?
                 // No, weapon rotates around its center (0,0 of player container + offset).
                 // Weapon is at (0, 11).
                 // Hand is at (-10, 16) (11+5).
                 // If we rotate the weapon sprite, it rotates around its origin (center).
                 // If we want the hand to follow, we need to calculate its position based on rotation.
                 
                 // However, Player container doesn't rotate. Only sprites do?
                 // No, we are setting rotation on weaponSprite.
                 // weaponSprite is added to Player container.
                 // Player container moves but doesn't rotate (it uses visual direction).
                 // Actually, "weaponSprite.setRotation(angle)" rotates the sprite around its own origin.
                 // Weapon is at (0, 11).
                 
                 // If we want the hand to stay attached to the gun, we should probably put them in a Container?
                 // But user asked to render hand OVER weapon.
                 // If they are separate sprites in Player container:
                 // Hand must also rotate.
                 
                 // Let's rotate hand too.
                 this.holdingHand.setRotation(angle);
                 
                 // Also need to adjust position to orbit?
                 // Weapon origin is center. Hand is offset.
                 // If we just rotate hand around its own center, it stays at (-10, 16).
                 // It won't look attached to the gun if the gun rotates around (0,11).
                 
                 // Better approach:
                 // Create a "WeaponContainer" inside Player.
                 // Add WeaponSprite and HoldingHand to WeaponContainer.
                 // Rotate WeaponContainer.
                 // But wait, existing code rotates `weaponSprite`.
                 // Refactoring to Container might be safer.
                 
                 // Let's do manual orbit calculation for now to avoid big refactor.
                 // Pivot is weapon position (0, 11).
                 // Hand offset from weapon center is (-10, 5).
                 // We need to rotate this offset vector by `angle`.
                 
                 // RECOIL: Pivot moves!
                 const pivotX = this.weaponSprite.x;
                 const pivotY = this.weaponSprite.y;
                 const offsetX = -10;
                 const offsetY = 5; // relative to weapon center
                 
                 // Rotate offset
                 // Phaser rotation is clockwise? Yes.
                 // x' = x cos - y sin
                 // y' = x sin + y cos
                 
                 // Adjust for flip
                 let effectiveAngle = angle;
                 let effectiveOffsetX = offsetX;
                 let effectiveOffsetY = offsetY;

                 if (Math.abs(angle) > Math.PI / 2) {
                    this.weaponSprite.setFlipY(true);
                    this.holdingHand.setFlipY(true); // Flip hand too
                    // When flipped, Y offset should be inverted relative to rotated frame?
                    // Or X offset?
                    // FlipY on sprite flips texture.
                    // If we rotate 180 deg (facing left):
                    // Normal: Hand is "below" gun.
                    // Flipped: Hand should still be "below" gun visually?
                    // If gun is upside down (flipped), "below" in texture space is "above" in screen space?
                    // No, FlipY makes it look right side up when rotated > 90.
                    // So "bottom" of gun is still "bottom".
                    
                    // However, we need to mirror the offset position relative to the pivot?
                    // If we flip Y, the texture is mirrored.
                    // The "grip" on the texture moves?
                    // If texture is symmetric-ish, it's fine.
                    // Let's assume just rotation is enough, but check flip.
                    
                    effectiveOffsetY = -offsetY; // Mirror Y offset if flipped?
                 } else {
                    this.weaponSprite.setFlipY(false);
                    this.holdingHand.setFlipY(false);
                 }
                 
                 const r = Math.sqrt(effectiveOffsetX*effectiveOffsetX + effectiveOffsetY*effectiveOffsetY);
                 const offsetAngle = Math.atan2(effectiveOffsetY, effectiveOffsetX);
                 
                 const finalAngle = angle + offsetAngle;
                 
                 // Wait, simple rotation matrix:
                 // x' = x*cos(theta) - y*sin(theta)
                 // y' = x*sin(theta) + y*cos(theta)
                 // applied to offset (offsetX, offsetY)
                 
                 // If flipped, we might need to change offset.
                 // Let's try simple rotation first.
                 
                 const rotX = offsetX * Math.cos(angle) - offsetY * Math.sin(angle);
                 const rotY = offsetX * Math.sin(angle) + offsetY * Math.cos(angle);
                 
                 // Calculate final position by adding rotated offset to PIVOT (which has recoil)
                 this.holdingHand.x = pivotX + rotX;
                 this.holdingHand.y = pivotY + rotY;
                 
                 // If flipped, we need to adjust because "offsetY = 5" (down) might need to be "up" if texture is flipped?
                 // If FlipY is true, the texture is mirrored vertically.
                 // So "down" in texture space becomes "up" in local space before rotation?
                 // Actually, FlipY is applied AFTER rotation in Phaser usually? Or before?
                 // Usually it's local.
                 
                 if (this.weaponSprite.flipY) {
                     // If weapon is flipped, the grip moves to the other side of the centerline?
                     // Let's just try mirroring the Y offset.
                     const rotX2 = offsetX * Math.cos(angle) - (-offsetY) * Math.sin(angle);
                     const rotY2 = offsetX * Math.sin(angle) + (-offsetY) * Math.cos(angle);
                     this.holdingHand.x = pivotX + rotX2;
                     this.holdingHand.y = pivotY + rotY2;
                 }
            }
        }
        
        // Hands Rotation
        if (this.handsContainer && this.handsContainer.visible) {
            this.handsContainer.setRotation(angle);
            // No flipY needed for simple circle hands, as they are symmetric
        }

        // Reload Indicator Rotation
        if (this.reloadIndicator) {
            const weaponLen = 60; // We set displayWidth to 60
            const muzzleDist = weaponLen * 0.5 + 15; // 15px offset from center
            
            const weaponX = this.weaponSprite ? this.weaponSprite.x : 0;
            const weaponY = this.weaponSprite ? this.weaponSprite.y : 11;
            
            const indX = weaponX + Math.cos(angle) * muzzleDist;
            const indY = weaponY + Math.sin(angle) * muzzleDist;
            
            this.reloadIndicator.x = indX;
            this.reloadIndicator.y = indY;
        }

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
