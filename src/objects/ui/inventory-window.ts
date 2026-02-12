import Phaser from 'phaser';
import { InventorySlot } from './inventory-slot';
import { inventorySystem, InventoryItem } from '../../systems/inventory-system';
import { Button } from './button';

export class InventoryWindow extends Phaser.GameObjects.Container {
    private background: Phaser.GameObjects.Rectangle;
    private slots: InventorySlot[] = [];
    private closeButton: Button;
    private readonly SLOT_SIZE = 50;
    private readonly GAP = 10;
    private readonly COLS = 4;
    private readonly ROWS = 4;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y);

        const width = this.COLS * (this.SLOT_SIZE + this.GAP) + this.GAP;
        const height = this.ROWS * (this.SLOT_SIZE + this.GAP) + this.GAP + 30; // +30 for header

        // Background
        this.background = scene.add.rectangle(0, 0, width, height, 0x222222, 0.9);
        this.background.setInteractive({ dropZone: true }); // Make it a drop zone to catch drops on window
        this.add(this.background);

        // Header / Close Button
        this.closeButton = new Button({
            scene,
            x: width / 2 - 20,
            y: -height / 2 + 15,
            text: 'X',
            onClick: () => {
                this.setVisible(false);
                this.scene.events.emit('inventory-window-closed');
            },
            style: {
                fontSize: '20px',
                backgroundColor: 0xcc0000,
                padding: { x: 5, y: 2 }
            }
        });
        this.add(this.closeButton);

        // Slots
        const startX = -width / 2 + this.GAP + this.SLOT_SIZE / 2;
        const startY = -height / 2 + this.GAP + 30 + this.SLOT_SIZE / 2;

        for (let i = 0; i < 16; i++) {
            const col = i % this.COLS;
            const row = Math.floor(i / this.COLS);

            const slotX = startX + col * (this.SLOT_SIZE + this.GAP);
            const slotY = startY + row * (this.SLOT_SIZE + this.GAP);

            const slot = new InventorySlot({
                scene,
                x: slotX,
                y: slotY,
                size: this.SLOT_SIZE,
                type: 'main',
                index: i
            });
            
            // First 4 slots enabled, rest disabled
            if (i >= 4) {
                slot.setDisabled(true);
            }

            this.add(slot);
            this.slots.push(slot);
        }

        // Load initial state
        for (let i = 0; i < 16; i++) {
            const item = inventorySystem.getItemAt('main', i);
            if (item) {
                this.slots[i].setItem(item);
            }
        }

        this.setVisible(false);

        // Listen for inventory updates
        inventorySystem.on('update', this.handleInventoryUpdate);
    }

    private handleInventoryUpdate = (data: { type: string, index: number, item: InventoryItem | null }) => {
        if (data.type === 'main') {
            this.slots[data.index].setItem(data.item);
        }
    };

    public destroy(fromScene?: boolean): void {
        inventorySystem.off('update', this.handleInventoryUpdate);
        super.destroy(fromScene);
    }

    public toggle() {
        this.setVisible(!this.visible);
    }

    public isSlotDisabled(index: number): boolean {
        if (index >= 0 && index < this.slots.length) {
            return this.slots[index].getIsDisabled(); // Need to add getter to InventorySlot
        }
        return true;
    }
}
