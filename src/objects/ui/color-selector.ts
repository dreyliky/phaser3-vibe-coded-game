import Phaser from 'phaser';

export class ColorSelector extends Phaser.GameObjects.Container {
    private currentIndicator: Phaser.GameObjects.Arc;
    private colors: string[];
    private currentIndex: number;
    private onChange: (value: string) => void;

    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        label: string,
        colors: string[],
        initialValue: string,
        onChange: (value: string) => void
    ) {
        super(scene, x, y);
        this.scene.add.existing(this);

        this.colors = colors;
        this.onChange = onChange;
        this.currentIndex = colors.indexOf(initialValue);
        if (this.currentIndex === -1) this.currentIndex = 0;

        // Label
        const labelText = scene.add.text(0, -30, label, { fontSize: '18px', color: '#aaaaaa' }).setOrigin(0.5);
        this.add(labelText);

        // Indicator
        const color = Phaser.Display.Color.HexStringToColor(this.colors[this.currentIndex]).color;
        this.currentIndicator = scene.add.circle(0, 0, 20, color);
        this.add(this.currentIndicator);

        // Left Arrow
        const leftArrow = scene.add.text(-50, 0, '<', { fontSize: '24px', color: '#ffffff' })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.selectPrevious());
        this.add(leftArrow);

        // Right Arrow
        const rightArrow = scene.add.text(50, 0, '>', { fontSize: '24px', color: '#ffffff' })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.selectNext());
        this.add(rightArrow);
    }

    private selectNext() {
        this.currentIndex = (this.currentIndex + 1) % this.colors.length;
        this.updateValue();
    }

    private selectPrevious() {
        this.currentIndex = (this.currentIndex - 1 + this.colors.length) % this.colors.length;
        this.updateValue();
    }

    private updateValue() {
        const value = this.colors[this.currentIndex];
        const color = Phaser.Display.Color.HexStringToColor(value).color;
        this.currentIndicator.setFillStyle(color);
        this.onChange(value);
    }
}
