import Phaser from 'phaser';

export interface ButtonOptions {
    width?: number;
    height?: number;
    backgroundColor?: number;
    backgroundColorOver?: number;
    backgroundAlpha?: number;
    textColor?: string;
    textColorOver?: string;
    fontSize?: string;
    fontFamily?: string;
    padding?: { x?: number, y?: number };
}

export interface ButtonConstructorOptions {
    scene: Phaser.Scene;
    x: number;
    y: number;
    text: string;
    onClick: () => void;
    style?: ButtonOptions;
}

export class Button extends Phaser.GameObjects.Container {
    private background: Phaser.GameObjects.Rectangle;
    private textObj: Phaser.GameObjects.Text;
    private onClick: () => void;
    private options: ButtonOptions;

    constructor(options: ButtonConstructorOptions) {
        super(options.scene, options.x, options.y);
        this.onClick = options.onClick;
        this.options = options.style || {};
        const scene = options.scene;

        // Defaults
        const fontSize = this.options.fontSize || '24px';
        const fontFamily = this.options.fontFamily || 'Arial';
        const textColor = this.options.textColor || '#ffffff';
        const bgColor = this.options.backgroundColor !== undefined ? this.options.backgroundColor : 0x333333;
        const bgAlpha = this.options.backgroundAlpha !== undefined ? this.options.backgroundAlpha : 1;
        
        // Measure text to determine default width/height if not provided
        const tempText = scene.make.text({ text: options.text, style: { fontSize, fontFamily } });
        const textWidth = tempText.width;
        const textHeight = tempText.height;
        tempText.destroy();

        const paddingX = this.options.padding?.x ?? 20;
        const paddingY = this.options.padding?.y ?? 10;
        
        const width = this.options.width || (textWidth + paddingX * 2);
        const height = this.options.height || (textHeight + paddingY * 2);

        // Background
        this.background = scene.add.rectangle(0, 0, width, height, bgColor, bgAlpha);
        this.add(this.background);

        // Text
        this.textObj = scene.add.text(0, 0, options.text, {
            fontSize: fontSize,
            color: textColor,
            fontFamily: fontFamily
        }).setOrigin(0.5);
        this.add(this.textObj);

        // Interaction
        this.setSize(width, height);
        this.setInteractive({ useHandCursor: true });

        this.on('pointerover', this.onPointerOver, this);
        this.on('pointerout', this.onPointerOut, this);
        this.on('pointerup', this.onPointerUp, this);
        
        // Add to scene
        scene.add.existing(this);
    }

    private onPointerOver() {
        const bgColorOver = this.options.backgroundColorOver !== undefined ? this.options.backgroundColorOver : 0x444444;
        const textColorOver = this.options.textColorOver || '#ffff00';
        const bgAlpha = this.options.backgroundAlpha !== undefined ? this.options.backgroundAlpha : 1;
        
        this.background.setFillStyle(bgColorOver, bgAlpha);
        this.textObj.setColor(textColorOver);
    }

    private onPointerOut() {
        const bgColor = this.options.backgroundColor !== undefined ? this.options.backgroundColor : 0x333333;
        const textColor = this.options.textColor || '#ffffff';
        const bgAlpha = this.options.backgroundAlpha !== undefined ? this.options.backgroundAlpha : 1;

        this.background.setFillStyle(bgColor, bgAlpha);
        this.textObj.setColor(textColor);
    }

    private onPointerUp() {
        this.onClick();
    }
    
    public setText(text: string) {
        this.textObj.setText(text);
    }
}
