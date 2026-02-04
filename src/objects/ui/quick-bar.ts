import Phaser from 'phaser';
import { InventorySlot } from './inventory-slot';

export class QuickBar extends Phaser.GameObjects.Container {
    private slots: InventorySlot[] = [];
    private readonly SLOT_SIZE = 60;
    private readonly GAP = 10;
    private selectedIndex: number = -1;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y);

        const width = 2 * (this.SLOT_SIZE + this.GAP) + this.GAP;
        const height = this.SLOT_SIZE + this.GAP * 2;

        // Background (optional, maybe semi-transparent)
        // this.add(scene.add.rectangle(0, 0, width, height, 0x000000, 0.5));

        const startX = -width / 2 + this.GAP + this.SLOT_SIZE / 2;
        
        for (let i = 0; i < 2; i++) {
            const slotX = (i === 0 ? -1 : 1) * (this.SLOT_SIZE / 2 + this.GAP / 2);
            
            const slot = new InventorySlot(scene, slotX, 0, this.SLOT_SIZE);
            this.add(slot);
            this.slots.push(slot);

            // Label
            const label = scene.add.text(slotX, this.SLOT_SIZE / 2 + 10, (i + 1).toString(), {
                fontSize: '16px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 2
            }).setOrigin(0.5);
            this.add(label);
        }
    }

    public selectSlot(index: number) {
        if (index < 0 || index >= this.slots.length) return;

        // If clicking same slot, maybe toggle off? Or just keep it selected.
        // Usually weapon selection stays until another is selected or holstered.
        // Let's assume strict selection for now.
        
        if (this.selectedIndex === index) {
            // Deselect if already selected (toggle behavior)
            this.slots[this.selectedIndex].setSelected(false);
            this.selectedIndex = -1;
        } else {
            // Deselect old
            if (this.selectedIndex !== -1) {
                this.slots[this.selectedIndex].setSelected(false);
            }
            // Select new
            this.selectedIndex = index;
            this.slots[this.selectedIndex].setSelected(true);
        }
    }
}
