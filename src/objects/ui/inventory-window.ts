import Phaser from 'phaser';
import { InventorySlot } from './inventory-slot';

export class InventoryWindow extends Phaser.GameObjects.Container {
    private background: Phaser.GameObjects.Rectangle;
    private slots: InventorySlot[] = [];
    private closeButton: Phaser.GameObjects.Text;
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
        this.add(this.background);

        // Header / Close Button
        this.closeButton = scene.add.text(width / 2 - 20, -height / 2 + 15, 'X', {
            fontSize: '20px',
            color: '#ffffff',
            backgroundColor: '#cc0000',
            padding: { x: 5, y: 2 }
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.setVisible(false));
        this.add(this.closeButton);

        // Slots
        const startX = -width / 2 + this.GAP + this.SLOT_SIZE / 2;
        const startY = -height / 2 + this.GAP + 30 + this.SLOT_SIZE / 2;

        for (let i = 0; i < 16; i++) {
            const col = i % this.COLS;
            const row = Math.floor(i / this.COLS);

            const slotX = startX + col * (this.SLOT_SIZE + this.GAP);
            const slotY = startY + row * (this.SLOT_SIZE + this.GAP);

            const slot = new InventorySlot(scene, slotX, slotY, this.SLOT_SIZE);
            
            // First 4 slots enabled, rest disabled
            if (i >= 4) {
                slot.setDisabled(true);
            }

            this.add(slot);
            this.slots.push(slot);
        }

        this.setVisible(false);
    }

    public toggle() {
        this.setVisible(!this.visible);
    }
}
