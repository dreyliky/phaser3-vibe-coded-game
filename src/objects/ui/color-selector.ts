import Phaser from 'phaser';
import { Button } from './button';

export interface ColorSelectorOptions {
    scene: Phaser.Scene;
    x: number;
    y: number;
    label: string;
    colors: string[];
    initialValue: string;
    onChange: (value: string) => void;
}

export class ColorSelector extends Phaser.GameObjects.Container {
    private currentIndicator: Phaser.GameObjects.Arc;
    private colors: string[];
    private currentIndex: number;
    private onChange: (value: string) => void;

    constructor(options: ColorSelectorOptions) {
        super(options.scene, options.x, options.y);
        this.scene.add.existing(this);

        this.colors = options.colors;
        this.onChange = options.onChange;
        this.currentIndex = this.colors.indexOf(options.initialValue);
        if (this.currentIndex === -1) this.currentIndex = 0;

        // Label
        const labelText = options.scene.add.text(0, -30, options.label, { fontSize: '18px', color: '#aaaaaa' }).setOrigin(0.5);
        this.add(labelText);

        // Indicator
        const color = Phaser.Display.Color.HexStringToColor(this.colors[this.currentIndex]).color;
        this.currentIndicator = options.scene.add.circle(0, 0, 20, color);
        this.add(this.currentIndicator);

        // Left Arrow
        const leftArrow = new Button({
            scene: options.scene,
            x: -50,
            y: 0,
            text: '<',
            onClick: () => this.selectPrevious(),
            style: {
                fontSize: '24px',
                backgroundColor: 0x000000,
                backgroundAlpha: 0, // Transparent
                padding: { x: 10, y: 5 }
            }
        });
        this.add(leftArrow);

        // Right Arrow
        const rightArrow = new Button({
            scene: options.scene,
            x: 50,
            y: 0,
            text: '>',
            onClick: () => this.selectNext(),
            style: {
                fontSize: '24px',
                backgroundColor: 0x000000,
                backgroundAlpha: 0, // Transparent
                padding: { x: 10, y: 5 }
            }
        });
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
