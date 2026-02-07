import Phaser from 'phaser';
import { InventorySlot } from './inventory-slot';
import { inventorySystem, InventoryItem } from '../../systems/inventory-system';

export class QuickBar extends Phaser.GameObjects.Container {
    private slots: InventorySlot[] = [];
    private readonly SLOT_SIZE = 60;
    private readonly GAP = 10;
    private selectedIndex: number = 0; // Default to 0 (Hands)

    public getSelectedIndex(): number {
        return this.selectedIndex;
    }

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y);

        const width = 3 * (this.SLOT_SIZE + this.GAP) + this.GAP; // 3 slots
        const height = this.SLOT_SIZE + this.GAP * 2;

        // Background (Drop Zone to catch drops on bar)
        // Transparent but interactive
        const background = scene.add.rectangle(0, 0, width, height, 0x000000, 0);
        background.setInteractive({ dropZone: true });
        this.add(background);

        const startX = -width / 2 + this.GAP + this.SLOT_SIZE / 2;
        
        for (let i = 0; i < 3; i++) {
            const slotX = startX + i * (this.SLOT_SIZE + this.GAP);
            
            const slot = new InventorySlot({
                scene,
                x: slotX,
                y: 0,
                size: this.SLOT_SIZE,
                type: 'quick',
                index: i
            });
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
        
        // Load initial state
        for (let i = 0; i < 3; i++) {
            const item = inventorySystem.getItemAt('quick', i);
            if (item) {
                this.slots[i].setItem(item);
            }
        }
        
        // Select first slot by default
        this.slots[0].setSelected(true);
        // Trigger initial equip if item exists
        const initialItem = inventorySystem.getItemAt('quick', 0);
        if (initialItem) {
             this.scene.time.delayedCall(100, () => {
                 this.selectSlot(0);
             });
        } else {
             this.slots[0].setSelected(true);
        }

        // Listen for inventory updates
        inventorySystem.on('update', this.handleInventoryUpdate);
    }

    private handleInventoryUpdate = (data: { type: string, index: number, item: InventoryItem | null }) => {
        if (data.type === 'quick') {
            this.slots[data.index].setItem(data.item);
            
            // If this is the selected slot, update equipped weapon
            if (this.selectedIndex === data.index) {
                if (data.item) {
                    this.scene.events.emit('weapon-equipped', data.item);
                } else {
                    // Current weapon removed/dropped.
                    // Since we cannot have empty active slot, switch to Hands (slot 0)
                    // Hands (slot 0) is never empty/removable.
                    this.selectSlot(0);
                }
            }
        }
    };

    public destroy(fromScene?: boolean): void {
        inventorySystem.off('update', this.handleInventoryUpdate);
        super.destroy(fromScene);
    }

    public selectSlot(index: number) {
        if (index < 0 || index >= this.slots.length) return;

        // Prevent selecting empty slot
        const item = inventorySystem.getItemAt('quick', index);
        if (!item) return;

        if (this.selectedIndex === index) {
            // Already selected, do nothing (always must have one selected)
            return;
        } else {
            // Deselect old
            if (this.selectedIndex !== -1) {
                this.slots[this.selectedIndex].setSelected(false);
            }
            // Select new
            this.selectedIndex = index;
            this.slots[this.selectedIndex].setSelected(true);
            
            // Notify game about weapon change
            // We already checked item exists above
            this.scene.events.emit('weapon-equipped', item);
        }
    }
}
