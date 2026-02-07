import Phaser from 'phaser';
import { Button } from '../objects/ui/button';

export class MainMenu extends Phaser.Scene {
    private titleText!: Phaser.GameObjects.Text;
    private menuButtons: Button[] = [];

    constructor() {
        super('MainMenu');
    }

    create() {
        const { width, height } = this.scale;
        
        this.scale.on('resize', this.handleResize, this);

        this.titleText = this.add.text(width * 0.5, height * 0.2, 'Main Menu', {
            fontSize: '48px',
            color: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        // Clear existing buttons if any (e.g. if create is called multiple times, though usually scenes are destroyed)
        this.menuButtons = [];

        this.createMenuButton('New Game (Procedural)', 
            () => this.scene.start('CharacterCreator'), 
            0.4, 
            { fontSize: '28px', textColor: '#00ff00', textColorOver: '#ffff00' }
        );

        this.createMenuButton('Play Custom Map', 
            () => this.scene.start('MapSelectionScene', { mode: 'play' }), 
            0.5
        );

        this.createMenuButton('Map Editor', 
            () => this.scene.start('MapSelectionScene', { mode: 'edit' }), 
            0.6
        );

        this.createMenuButton('Walls Test Scene', 
            () => this.scene.start('WallTestScene'), 
            0.7
        );
    }

    private createMenuButton(text: string, onClick: () => void, yRatio: number, styleOverrides: any = {}) {
        const { width, height } = this.scale;
        const btn = new Button({
            scene: this,
            x: width * 0.5,
            y: height * yRatio,
            text,
            onClick,
            style: {
                fontSize: '24px',
                backgroundColor: 0x333333,
                ...styleOverrides
            }
        });
        
        // Store yRatio for resizing logic
        btn.setData('yRatio', yRatio);
        
        this.menuButtons.push(btn);
        return btn;
    }

    handleResize(gameSize: Phaser.Structs.Size) {
        const { width, height } = gameSize;
        
        if (this.titleText) {
            this.titleText.setPosition(width * 0.5, height * 0.2);
        }

        this.menuButtons.forEach(btn => {
            const ratio = btn.getData('yRatio');
            if (ratio) {
                btn.setPosition(width * 0.5, height * ratio);
            }
        });
    }
}
