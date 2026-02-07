import Phaser from 'phaser';
import { Button } from '../objects/ui/button';

export class MainMenu extends Phaser.Scene {
    private titleText!: Phaser.GameObjects.Text;
    private playButton!: Button;
    private wallTestButton!: Button;

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

        this.playButton = new Button(this, width * 0.5, height * 0.5, 'New Game', () => {
            this.scene.start('CharacterCreator');
        }, {
            fontSize: '32px',
            textColor: '#00ff00',
            backgroundColor: 0x333333,
            textColorOver: '#ffff00'
        });

        this.wallTestButton = new Button(this, width * 0.5, height * 0.6, 'Walls Test Scene', () => {
            this.scene.start('WallTestScene');
        }, {
            fontSize: '24px',
            backgroundColor: 0x333333
        });
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
