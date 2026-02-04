import Phaser from 'phaser';

export class InventorySlot extends Phaser.GameObjects.Container {
    private background: Phaser.GameObjects.Rectangle;
    private border: Phaser.GameObjects.Graphics;
    private itemIcon: Phaser.GameObjects.Sprite | null = null;
    private isDisabled: boolean = false;
    private size: number;
    private isSelected: boolean = false;

    constructor(scene: Phaser.Scene, x: number, y: number, size: number = 50) {
        super(scene, x, y);
        this.size = size;

        // Background
        this.background = scene.add.rectangle(0, 0, size, size, 0x666666);
        this.add(this.background);

        // Border
        this.border = scene.add.graphics();
        this.drawBorder();
        this.add(this.border);

        this.setSize(size, size);
        this.setInteractive();
    }

    public setDisabled(disabled: boolean) {
        this.isDisabled = disabled;
        this.background.setFillStyle(disabled ? 0x333333 : 0x666666);
        this.background.setAlpha(disabled ? 0.5 : 1);
        if (disabled) {
            this.disableInteractive();
        } else {
            this.setInteractive();
        }
    }

    public setSelected(selected: boolean) {
        this.isSelected = selected;
        this.drawBorder();
    }

    private drawBorder() {
        this.border.clear();
        if (this.isSelected) {
            this.border.lineStyle(2, 0xff0000);
        } else {
            this.border.lineStyle(2, 0x000000);
        }
        this.border.strokeRect(-this.size / 2, -this.size / 2, this.size, this.size);
    }
}
