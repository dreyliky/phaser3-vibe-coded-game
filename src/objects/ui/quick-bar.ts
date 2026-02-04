import Phaser from 'phaser';
import { InventorySlot } from './inventory-slot';
import { inventorySystem } from '../../systems/inventory-system';

export class QuickBar extends Phaser.GameObjects.Container {
    private slots: InventorySlot[] = [];
    private readonly SLOT_SIZE = 60;
    private readonly GAP = 10;
    private selectedIndex: number = -1;

    public getSelectedIndex(): number {
        return this.selectedIndex;
    }

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y);

        const width = 2 * (this.SLOT_SIZE + this.GAP) + this.GAP;
        const height = this.SLOT_SIZE + this.GAP * 2;

        const startX = -width / 2 + this.GAP + this.SLOT_SIZE / 2;
        
        for (let i = 0; i < 2; i++) {
            const slotX = (i === 0 ? -1 : 1) * (this.SLOT_SIZE / 2 + this.GAP / 2);
            
            const slot = new InventorySlot(scene, slotX, 0, this.SLOT_SIZE, 'quick', i);
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

        // Listen for inventory updates
        inventorySystem.on('update', (data: { type: string, index: number, item: any }) => {
            if (data.type === 'quick') {
                this.slots[data.index].setItem(data.item);
                
                // If this is the selected slot, update equipped weapon
                if (this.selectedIndex === data.index) {
                    if (data.item) {
                        this.scene.events.emit('weapon-equipped', data.item);
                    } else {
                        this.scene.events.emit('weapon-unequipped');
                    }
                }
            }
        });
    }

    public selectSlot(index: number) {
        if (index < 0 || index >= this.slots.length) return;

        if (this.selectedIndex === index) {
            // Deselect if already selected (toggle behavior)
            this.slots[this.selectedIndex].setSelected(false);
            this.selectedIndex = -1;
            this.scene.events.emit('weapon-unequipped');
        } else {
            // Deselect old
            if (this.selectedIndex !== -1) {
                this.slots[this.selectedIndex].setSelected(false);
            }
            // Select new
            this.selectedIndex = index;
            this.slots[this.selectedIndex].setSelected(true);
            
            // Notify game about weapon change
            const item = inventorySystem.getItemAt('quick', index);
            if (item) {
                this.scene.events.emit('weapon-equipped', item);
            } else {
                this.scene.events.emit('weapon-unequipped');
            }
        }
    }
}
