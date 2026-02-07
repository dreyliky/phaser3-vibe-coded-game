import Phaser from 'phaser';
import { Player } from '../objects';
import { BaseItem, WorldItem } from '../objects/items';
import { inventorySystem } from './inventory-system';
import { ItemExtraData } from '../types/item-extra-data';

export class ItemInteractionSystem {
    private scene: Phaser.Scene;
    private player: Player;
    private worldItems: Phaser.Physics.Arcade.Group;

    constructor(scene: Phaser.Scene, player: Player) {
        this.scene = scene;
        this.player = player;
        this.worldItems = scene.physics.add.group();
    }

    public update() {
        this.updateItemHighlight();
    }

    public spawnItem(options: {
        item: BaseItem;
        x: number;
        y: number;
        quantity?: number;
        extraData?: ItemExtraData;
    }) {
        const { item, x, y, quantity = 1, extraData } = options;
        const worldItem = new WorldItem({
            scene: this.scene,
            x,
            y,
            item,
            quantity,
            extraData
        });
        this.worldItems.add(worldItem);
    }

    public spawnPlayerDrop(item: BaseItem, quantity: number, extraData?: ItemExtraData) {
        // Get drop direction (mouse pointer)
        const pointer = this.scene.input.activePointer;
        const worldPoint = pointer.positionToCamera(this.scene.cameras.main) as Phaser.Math.Vector2;
        const baseAngle = Phaser.Math.Angle.Between(this.player.x, this.player.y, worldPoint.x, worldPoint.y);
        
        // Add random variation to angle (+- 20 degrees)
        const angleVar = Phaser.Math.DegToRad(Phaser.Math.Between(-20, 20));
        const finalAngle = baseAngle + angleVar;

        const dist = 50 + Phaser.Math.Between(-10, 20); // Random distance variation
        const targetX = this.player.x + Math.cos(finalAngle) * dist;
        const targetY = this.player.y + Math.sin(finalAngle) * dist;
        
        // Spawn at player position
        const worldItem = new WorldItem({
            scene: this.scene,
            x: this.player.x,
            y: this.player.y,
            item,
            quantity,
            extraData
        });
        this.worldItems.add(worldItem);
        
        // Animation: Start larger (Container scale 0.8), move to position, scale back to 1 (Container scale)
        worldItem.setScale(0.8); 
        
        const randomSpin = Phaser.Math.Between(180, 540) * (Math.random() > 0.5 ? 1 : -1);

        this.scene.tweens.add({
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

    public tryPickupItem() {
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
}
