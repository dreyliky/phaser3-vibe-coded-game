import Phaser from 'phaser';
import { InventoryWindow, QuickBar } from '../objects/ui';

export class HUD extends Phaser.Scene {
    private inventoryWindow!: InventoryWindow;
    private quickBar!: QuickBar;

    constructor() {
        super('HUD');
    }

    create() {
        const { width, height } = this.scale;

        // Quick Bar (Bottom Center)
        this.quickBar = new QuickBar(this, width * 0.5, height - 50);
        this.add.existing(this.quickBar);

        // Inventory Window (Center)
        this.inventoryWindow = new InventoryWindow(this, width * 0.5, height * 0.5);
        this.add.existing(this.inventoryWindow);

        // Input Handling
        if (this.input.keyboard) {
            this.input.keyboard.on('keydown-I', () => {
                this.inventoryWindow.toggle();
            });

            this.input.keyboard.on('keydown-ONE', () => {
                this.quickBar.selectSlot(0);
            });

            this.input.keyboard.on('keydown-TWO', () => {
                this.quickBar.selectSlot(1);
            });
        }

        // Clean up input on scene shutdown (if needed, though HUD usually persists)
        this.events.on('shutdown', () => {
            if (this.input.keyboard) {
                this.input.keyboard.off('keydown-I');
                this.input.keyboard.off('keydown-ONE');
                this.input.keyboard.off('keydown-TWO');
            }
        });
    }
}
