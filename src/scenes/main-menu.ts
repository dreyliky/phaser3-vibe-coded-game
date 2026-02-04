import Phaser from 'phaser';

export class MainMenu extends Phaser.Scene {
    constructor() {
        super('MainMenu');
    }

    create() {
        const { width, height } = this.scale;

        this.add.text(width * 0.5, height * 0.3, 'Main Menu', {
            fontSize: '48px',
            color: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        const playButton = this.add.text(width * 0.5, height * 0.5, 'New Game', {
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
        .on('pointerover', () => playButton.setStyle({ fill: '#ffff00' }))
        .on('pointerout', () => playButton.setStyle({ fill: '#00ff00' }));
    }
}
