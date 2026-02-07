import Phaser from 'phaser';
import { Button } from './button';

export class TextSelector extends Phaser.GameObjects.Container {
    private valueText: Phaser.GameObjects.Text;
    private options: string[];
    private currentIndex: number;
    private onChange: (value: string) => void;

    constructor(
        scene: Phaser.Scene, 
        x: number, 
        y: number, 
        label: string, 
        options: string[], 
        initialValue: string, 
        onChange: (value: string) => void
    ) {
        super(scene, x, y);
        this.scene.add.existing(this);

        this.options = options;
        this.onChange = onChange;
        this.currentIndex = options.indexOf(initialValue);
        if (this.currentIndex === -1) this.currentIndex = 0;

        // Label
        const labelText = scene.add.text(-200, 0, label, { fontSize: '20px', color: '#aaaaaa' }).setOrigin(0, 0.5);
        this.add(labelText);

        // Value Text
        this.valueText = scene.add.text(0, 0, this.options[this.currentIndex], { fontSize: '20px', color: '#ffffff' }).setOrigin(0.5);
        this.add(this.valueText);

        // Left Arrow
        const leftArrow = new Button(scene, -100, 0, '<', () => this.selectPrevious(), {
            fontSize: '24px',
            backgroundColor: 0x000000,
            backgroundAlpha: 0, // Transparent
            padding: { x: 10, y: 5 }
        });
        this.add(leftArrow);

        // Right Arrow
        const rightArrow = new Button(scene, 100, 0, '>', () => this.selectNext(), {
            fontSize: '24px',
            backgroundColor: 0x000000,
            backgroundAlpha: 0, // Transparent
            padding: { x: 10, y: 5 }
        });
        this.add(rightArrow);
    }

    public setOptions(options: string[], initialValue?: string) {
        this.options = options;
        if (initialValue && this.options.includes(initialValue)) {
            this.currentIndex = this.options.indexOf(initialValue);
        } else {
            this.currentIndex = 0;
        }
        this.updateValue();
    }

    private selectNext() {
        this.currentIndex = (this.currentIndex + 1) % this.options.length;
        this.updateValue();
    }

    private selectPrevious() {
        this.currentIndex = (this.currentIndex - 1 + this.options.length) % this.options.length;
        this.updateValue();
    }

    private updateValue() {
        const value = this.options[this.currentIndex];
        this.valueText.setText(value);
        this.onChange(value);
    }
}
