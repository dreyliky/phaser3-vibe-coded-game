import Phaser from 'phaser';

export class Tooltip extends Phaser.GameObjects.Container {
    private background: Phaser.GameObjects.Graphics;
    private text: Phaser.GameObjects.Text;
    private padding: number = 8;

    constructor(scene: Phaser.Scene) {
        super(scene, 0, 0);

        this.background = scene.add.graphics();
        this.add(this.background);

        this.text = scene.add.text(0, 0, '', {
            fontSize: '14px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2,
            fontFamily: 'Arial'
        });
        this.add(this.text);

        this.setVisible(false);
        this.setDepth(1000); // Ensure it's on top
        scene.add.existing(this);
    }

    public show(content: string, x: number, y: number) {
        this.text.setText(content);
        
        const width = this.text.width + this.padding * 2;
        const height = this.text.height + this.padding * 2;

        this.background.clear();
        this.background.fillStyle(0x000000, 0.8);
        this.background.lineStyle(1, 0xaaaaaa, 1);
        this.background.fillRoundedRect(0, 0, width, height, 4);
        this.background.strokeRoundedRect(0, 0, width, height, 4);

        this.text.setPosition(this.padding, this.padding);

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
