import Phaser from 'phaser';

export class MainMenu extends Phaser.Scene {
    private titleText!: Phaser.GameObjects.Text;
    private playButton!: Phaser.GameObjects.Text;
    private wallTestButton!: Phaser.GameObjects.Text;

    constructor() {
        super('MainMenu');
    }

    create() {
        const { width, height } = this.scale;
        
        this.scale.on('resize', this.handleResize, this);

        this.titleText = this.add.text(width * 0.5, height * 0.3, 'Main Menu', {
            fontSize: '48px',
            color: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        this.playButton = this.add.text(width * 0.5, height * 0.5, 'New Game', {
            fontSize: '32px',
            color: '#00ff00',
            fontFamily: 'Arial',
            backgroundColor: '#333333',
            padding: { x: 20, y: 10 }
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
            this.scene.start('CharacterCreator');
        })
        .on('pointerover', () => this.playButton.setStyle({ fill: '#ffff00' }))
        .on('pointerout', () => this.playButton.setStyle({ fill: '#00ff00' }));

        this.wallTestButton = this.add.text(width * 0.5, height * 0.6, 'Walls Test Scene', {
            fontSize: '24px',
            color: '#ffffff',
            fontFamily: 'Arial',
            backgroundColor: '#333333',
            padding: { x: 20, y: 10 }
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
            this.scene.start('WallTestScene');
        })
        .on('pointerover', () => this.wallTestButton.setStyle({ fill: '#ffff00' }))
        .on('pointerout', () => this.wallTestButton.setStyle({ fill: '#ffffff' }));
    }

    handleResize(gameSize: Phaser.Structs.Size) {
        const { width, height } = gameSize;
        if (this.titleText) {
            this.titleText.setPosition(width * 0.5, height * 0.3);
        }
        if (this.playButton) {
            this.playButton.setPosition(width * 0.5, height * 0.5);
        }
        if (this.wallTestButton) {
            this.wallTestButton.setPosition(width * 0.5, height * 0.6);
        }
    }
}
