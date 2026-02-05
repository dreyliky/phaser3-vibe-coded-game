import Phaser from 'phaser';
import { InventorySlot } from './inventory-slot';
import { inventorySystem } from '../../systems/inventory-system';

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
             // We need to delay this slightly or ensure Game scene is ready to listen?
             // HUD is launched from Game. Game listens to HUD events.
             // If HUD is created after Game sets up listeners, it's fine.
             // Game create(): launch HUD, then setup listeners.
             // HUD create(): creates QuickBar.
             // So listeners might NOT be ready if HUD create runs synchronously immediately.
             // But scene launch is usually async-ish or scheduled.
             // Safer to emit? Or Game pulls?
             // Game listens: hudScene.events.on...
             // If we emit now, Game might miss it if it hasn't subscribed yet.
             // But Game launches HUD, then subscribes.
             // "this.scene.launch('HUD');" returns nothing.
             // "this.scene.get('HUD')" gets the scene.
             // If HUD is not active/created yet, get('HUD') might return null or inactive scene.
             // Phaser Scene launch starts the scene.
             
             // Actually, in Game.ts:
             // this.scene.launch('HUD');
             // const hudScene = this.scene.get('HUD');
             // hudScene.events.on(...)
             
             // If HUD scene initializes quickly, we might be fine.
             // But to be safe, Game should probably check initial state OR QuickBar should emit with a small delay.
             // Or better: Game requests state.
             
             // For now, let's assume it works or just rely on the fact that Player starts with nothing and we want Hands.
             // If Game misses the event, Player has no weapon.
             // Let's add a small delay for the initial emit in QuickBar, just in case.
             this.scene.time.delayedCall(100, () => {
                 this.selectSlot(0);
             });
        } else {
             this.slots[0].setSelected(true);
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
                        // Current weapon removed/dropped.
                        // Since we cannot have empty active slot, switch to Hands (slot 0)
                        // Hands (slot 0) is never empty/removable.
                        this.selectSlot(0);
                    }
                }
            }
        });
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
