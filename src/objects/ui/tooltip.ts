import Phaser from 'phaser';

export interface TooltipConfig {
    fontSize?: string;
    fontFamily?: string;
    textColor?: string;
    backgroundColor?: number;
    backgroundAlpha?: number;
    borderColor?: number;
    borderThickness?: number;
    padding?: number;
}

export class Tooltip extends Phaser.GameObjects.Container {
    private background: Phaser.GameObjects.Graphics;
    private text: Phaser.GameObjects.Text;
    private config: Required<TooltipConfig>;

    constructor(scene: Phaser.Scene, config?: TooltipConfig) {
        super(scene, 0, 0);

        this.config = {
            fontSize: config?.fontSize || '14px',
            fontFamily: config?.fontFamily || 'Arial',
            textColor: config?.textColor || '#ffffff',
            backgroundColor: config?.backgroundColor ?? 0x000000,
            backgroundAlpha: config?.backgroundAlpha ?? 0.8,
            borderColor: config?.borderColor ?? 0xaaaaaa,
            borderThickness: config?.borderThickness ?? 1,
            padding: config?.padding ?? 8
        };

        this.background = scene.add.graphics();
        this.add(this.background);

        this.text = scene.add.text(0, 0, '', {
            fontSize: this.config.fontSize,
            color: this.config.textColor,
            stroke: '#000000',
            strokeThickness: 2,
            fontFamily: this.config.fontFamily
        });
        this.add(this.text);

        this.setVisible(false);
        this.setDepth(3000); // High depth but below cursor (which should be MAX_SAFE_INTEGER)
        scene.add.existing(this);
    }

    public show(content: string, x: number, y: number) {
        this.text.setText(content);
        
        const width = this.text.width + this.config.padding * 2;
        const height = this.text.height + this.config.padding * 2;

        this.background.clear();
        this.background.fillStyle(this.config.backgroundColor, this.config.backgroundAlpha);
        this.background.lineStyle(this.config.borderThickness, this.config.borderColor, 1);
        this.background.fillRoundedRect(0, 0, width, height, 4);
        this.background.strokeRoundedRect(0, 0, width, height, 4);

        this.text.setPosition(this.config.padding, this.config.padding);

        // Adjust position to keep within bounds
        const { width: cameraWidth, height: cameraHeight } = this.scene.scale;
        
        let finalX = x + 15; // Offset from cursor
        let finalY = y + 15;

        if (finalX + width > cameraWidth) {
            finalX = x - width - 5;
        }
        if (finalY + height > cameraHeight) {
            finalY = y - height - 5;
        }

        this.setPosition(finalX, finalY);
        this.setVisible(true);
        this.setAlpha(1);
    }

    public hide() {
        this.setVisible(false);
    }
}
