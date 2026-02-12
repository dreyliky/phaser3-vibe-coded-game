import Phaser from 'phaser';
import { Button } from './button';
import { DEPTHS } from '../../config/constants';

export type DropdownOption<T> = {
    label: string;
    value: T;
};

export interface DropdownConfig<T> {
    scene: Phaser.Scene;
    x: number;
    y: number;
    width: number;
    options: DropdownOption<T>[];
    onSelect: (value: T) => void;
    zIndex?: number;
}

export class Dropdown<T> extends Phaser.GameObjects.Container {
    private mainButton: Button;
    private optionsContainer: Phaser.GameObjects.Container;
    private options: DropdownOption<T>[];
    private isOpen: boolean = false;
    private onSelect: (value: T) => void;
    private labelText: Phaser.GameObjects.Text;
    private zIndex: number;
    
    constructor(config: DropdownConfig<T>) {
        super(config.scene, config.x, config.y);
        this.options = config.options;
        this.onSelect = config.onSelect;
        this.zIndex = config.zIndex || DEPTHS.UI.POPUP; // Default high z-index for dropdowns

        // Ensure this container stays fixed relative to camera if needed, 
        // but typically it's added to a UI container which handles scroll factor.
        // We set scrollFactor(0) just in case it's added directly to scene.
        this.setScrollFactor(0);

        // Main Button (Header)
        this.mainButton = new Button({
            scene: config.scene,
            x: 0,
            y: 0,
            text: '',
            style: { width: config.width, height: 30, backgroundColor: 0x444444 },
            onClick: () => this.toggle()
        });
        this.add(this.mainButton);

        this.labelText = config.scene.add.text(0, 0, `Filter: ${this.options[0]?.label || 'Select'}`, { fontSize: '14px', color: '#ffffff' }).setOrigin(0.5);
        this.add(this.labelText);

        // Options Container (Overlay)
        this.optionsContainer = config.scene.add.container(0, 30);
        this.optionsContainer.setVisible(false);
        this.add(this.optionsContainer);

        let optY = 0;
        const optHeight = 30;

        this.options.forEach(opt => {
            const btn = new Button({
                scene: config.scene,
                x: 0,
                y: optY + optHeight / 2, // Center Y relative to option slot
                text: opt.label,
                style: { width: config.width, height: optHeight, backgroundColor: 0x333333 },
                onClick: () => {
                    this.select(opt);
                }
            });
            this.optionsContainer.add(btn);
            optY += optHeight;
        });
        
        config.scene.add.existing(this);
    }

    public toggle() {
        this.isOpen = !this.isOpen;
        this.optionsContainer.setVisible(this.isOpen);
        
        if (this.isOpen) {
            // Bring this dropdown container to top of its parent (usually UI container)
            if (this.parentContainer) {
                this.parentContainer.bringToTop(this);
            } else {
                this.setDepth(this.zIndex); 
            }
        }
    }

    public select(option: DropdownOption<T>) {
        this.labelText.setText(`Filter: ${option.label}`);
        this.onSelect(option.value);
        this.toggle(); // Close
    }

    public setVisible(value: boolean) {
        super.setVisible(value);
        if (!value) {
            this.isOpen = false;
            this.optionsContainer.setVisible(false);
        }
        return this;
    }
}
