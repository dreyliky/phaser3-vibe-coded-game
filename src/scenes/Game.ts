import Phaser from 'phaser';
import { Player } from '../objects';
import { BodyType, CharacterDefinition, FaceType, Gender, HairType } from '../types/character';
import { HAIR_COLORS, SKIN_COLORS } from '../config/constants';
import { WorldItem, AssaultRifle, Pistol, Shotgun, LightAmmo, StandardAmmo, HeavyAmmo, BuckshotAmmo } from '../objects/items';
import { inventorySystem } from '../systems/inventory-system';

export class Game extends Phaser.Scene {
    private player!: Player;
    private characterDefinition!: CharacterDefinition;
    private worldItems: Phaser.Physics.Arcade.Group;

    constructor() {
        super('GameScene');
    }

    init(data: { character: CharacterDefinition }) {
        this.characterDefinition = data.character || {
            gender: Gender.Male,
            bodyType: BodyType.Male,
            faceType: FaceType.Average_Normal,
            hairType: HairType.Mohawk,
            skinColor: SKIN_COLORS[0],
            hairColor: HAIR_COLORS[2]
        };
    }

    create() {
        const { width, height } = this.scale;
        
        // Launch HUD
        this.scene.launch('HUD');

        // World Items Group (Created BEFORE Player)
        this.worldItems = this.physics.add.group();

        // Create Player (Created AFTER Items so it renders ON TOP)
        this.player = new Player(this, width * 0.5, height * 0.5, this.characterDefinition);
        this.player.setDepth(100); // Explicitly set depth to ensure it's above everything


        // Spawn test items
        this.spawnItem(new AssaultRifle(), 300, 300);
        this.spawnItem(new Pistol(), 400, 300);
        this.spawnItem(new Shotgun(), 500, 300);
        this.spawnItem(new StandardAmmo(), 350, 400);
        this.spawnItem(new LightAmmo(), 450, 400);
        this.spawnItem(new BuckshotAmmo(), 550, 400);

        // Input for interaction
        if (this.input.keyboard) {
            this.input.keyboard.addCapture('TAB'); // Prevent default browser tab behavior

            this.input.keyboard.on('keydown-E', () => this.tryPickupItem());
            
            // Inventory Toggle (TAB)
            this.input.keyboard.on('keydown-TAB', () => {
                const inventoryWindow = this.scene.get('InventoryScene') as any; // Assuming inventory is in HUD or separate
                // Wait, InventoryWindow is likely in HUD scene or Game scene?
                // Based on previous context, InventoryWindow was created in HUD scene or Game scene?
                // Let's check where InventoryWindow is created. 
                // In my memory, I asked to create InventoryWindow. 
                // The Read output of Game.ts didn't show InventoryWindow creation.
                // It showed `this.scene.launch('HUD');`.
                // So InventoryWindow is probably in HUD scene.
                const hudScene = this.scene.get('HUD') as any;
                if (hudScene && hudScene.inventoryWindow) {
                    hudScene.inventoryWindow.toggle();
                }
            });

            // Quick Slot Selection (1, 2, 3)
            this.input.keyboard.on('keydown-ONE', () => this.selectQuickSlot(0));
            this.input.keyboard.on('keydown-TWO', () => this.selectQuickSlot(1));
            this.input.keyboard.on('keydown-THREE', () => this.selectQuickSlot(2));
        }

        // Listen for HUD events (weapon equip/unequip)
        const hudScene = this.scene.get('HUD') as any; // Cast to any to access custom properties/events easier if types missing
        hudScene.events.on('weapon-equipped', (item: any) => {
            this.player.equipWeapon(item);
        });
        hudScene.events.on('weapon-unequipped', () => {
            this.player.unequipWeapon();
        });

        // Drop Weapon (G)
        this.input.keyboard.on('keydown-G', () => {
            const quickBar = hudScene.quickBar; // Access quickBar from HUD
            if (quickBar) {
                const selectedIndex = quickBar.getSelectedIndex();
                if (selectedIndex !== -1) {
                    const item = inventorySystem.dropItem('quick', selectedIndex);
                    if (item) {
                        this.spawnPlayerDrop(item.item, item.quantity, item.extraData);
                    }
                }
            }
        });

        // Sync initial weapon state (ensure Hands or default slot 0 is equipped)
        // We do this after listeners are set up, but we can also force it directly.
        const initialQuickItem = inventorySystem.getItemAt('quick', 0);
        if (initialQuickItem) {
            this.player.equipWeapon(initialQuickItem);
        }
    }

    update() {
        this.player.update();
        this.updateItemHighlight();
    }

    private selectQuickSlot(index: number) {
        const hudScene = this.scene.get('HUD') as any;
        if (hudScene && hudScene.quickBar) {
            hudScene.quickBar.selectSlot(index);
        }
    }

    private updateItemHighlight() {
        // Reset all highlights
        this.worldItems.getChildren().forEach((child) => {
            (child as WorldItem).setHighlight(false);
        });

        // Find nearest item
        let nearestItem: WorldItem | null = null;
        let minDist = 100; // Pickup range

        this.worldItems.getChildren().forEach((child) => {
            const item = child as WorldItem;
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, item.x, item.y);
            if (dist < minDist) {
                minDist = dist;
                nearestItem = item;
            }
        });

        if (nearestItem) {
            const item = nearestItem as WorldItem;
            const canAdd = inventorySystem.canAddItem(item.getItem(), item.getQuantity());
            item.setHighlight(true, canAdd ? 0x00ff00 : 0xff0000);
        }
    }

    public spawnPlayerDrop(item: any, quantity: number, extraData?: any) {
        // Get drop direction (mouse pointer)
        const pointer = this.input.activePointer;
        const worldPoint = pointer.positionToCamera(this.cameras.main) as Phaser.Math.Vector2;
        const baseAngle = Phaser.Math.Angle.Between(this.player.x, this.player.y, worldPoint.x, worldPoint.y);
        
        // Add random variation to angle (+- 20 degrees)
        const angleVar = Phaser.Math.DegToRad(Phaser.Math.Between(-20, 20));
        const finalAngle = baseAngle + angleVar;

        const dist = 50 + Phaser.Math.Between(-10, 20); // Random distance variation
        const targetX = this.player.x + Math.cos(finalAngle) * dist;
        const targetY = this.player.y + Math.sin(finalAngle) * dist;
        
        // Spawn at player position
        const worldItem = new WorldItem(this, this.player.x, this.player.y, item, quantity, extraData);
        this.worldItems.add(worldItem);
        
        // Animation: Start larger (Container scale 0.8), move to position, scale back to 1 (Container scale)
        // Note: The internal sprite is already scaled (0.35 or 0.5) by WorldItem constructor.
        // We only animate the Container scale.
        worldItem.setScale(0.8); 
        
        const randomSpin = Phaser.Math.Between(180, 540) * (Math.random() > 0.5 ? 1 : -1);

        this.tweens.add({
            targets: worldItem,
            x: targetX,
            y: targetY,
            scaleX: 1, // Reset container scale to 1
            scaleY: 1,
            angle: worldItem.angle + randomSpin, // Spin
            duration: 300,
            ease: 'Power2'
        });
    }

    private spawnItem(item: any, x: number, y: number, quantity: number = 1, extraData?: any) {
        const worldItem = new WorldItem(this, x, y, item, quantity, extraData);
        this.worldItems.add(worldItem);
    }

    private tryPickupItem() {
        // Find nearest item
        let nearestItem: WorldItem | null = null;
        let minDist = 100; // Pickup range

        this.worldItems.getChildren().forEach((child) => {
            const item = child as WorldItem;
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, item.x, item.y);
            if (dist < minDist) {
                minDist = dist;
                nearestItem = item;
            }
        });

        if (nearestItem) {
            const worldItem = nearestItem as WorldItem;
            const added = inventorySystem.addItem(worldItem.getItem(), worldItem.getQuantity(), worldItem.getExtraData());
            if (added) {
                worldItem.destroy();
            }
        }
    }
}
