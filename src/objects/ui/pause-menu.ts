import Phaser from 'phaser';

export class PauseMenu extends Phaser.GameObjects.Container {
    private background: Phaser.GameObjects.Rectangle;
    private closeButton: Phaser.GameObjects.Text;
    private menuItems: Phaser.GameObjects.Container;
    
    constructor(scene: Phaser.Scene, x: number, y: number, onExit: () => void) {
        super(scene, x, y);

        const width = 300;
        const height = 400;

        // Background
        this.background = scene.add.rectangle(0, 0, width, height, 0x222222, 0.95);
        this.background.setStrokeStyle(2, 0x444444);
        this.add(this.background);

        // Header / Close Button
        this.closeButton = scene.add.text(width / 2 - 20, -height / 2 + 15, 'X', {
            fontSize: '20px',
            color: '#ffffff',
            backgroundColor: '#cc0000',
            padding: { x: 5, y: 2 }
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.setVisible(false));
        this.add(this.closeButton);

        // Title
        const title = scene.add.text(0, -height / 2 + 40, 'PAUSE', {
            fontSize: '32px',
            color: '#ffffff',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.add(title);

        // Menu Items
        this.menuItems = scene.add.container(0, 0);
        this.add(this.menuItems);

        // Item 1: Exit to Menu
        const exitBtn = this.createButton(scene, 0, 0, 'Exit to Menu', onExit);
        this.menuItems.add(exitBtn);

        this.setVisible(false);
        this.setDepth(1000); // Ensure it's on top
    }

    private createButton(scene: Phaser.Scene, x: number, y: number, text: string, onClick: () => void): Phaser.GameObjects.Container {
        const btnContainer = scene.add.container(x, y);
        
        const bg = scene.add.rectangle(0, 0, 200, 50, 0x444444);
        const label = scene.add.text(0, 0, text, {
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5);

        bg.setInteractive({ useHandCursor: true })
          .on('pointerdown', onClick)
          .on('pointerover', () => bg.setFillStyle(0x666666))
          .on('pointerout', () => bg.setFillStyle(0x444444));

        btnContainer.add([bg, label]);
        return btnContainer;
    }

    public toggle() {
        this.setVisible(!this.visible);
    }
}
