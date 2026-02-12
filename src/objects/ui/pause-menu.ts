import Phaser from 'phaser';
import { Button } from './button';
import { DEPTHS } from '../../config/constants';

export class PauseMenu extends Phaser.GameObjects.Container {
    private background: Phaser.GameObjects.Rectangle;
    private closeButton: Button;
    private menuItems: Phaser.GameObjects.Container;
    
    constructor(options: {
        scene: Phaser.Scene;
        x: number;
        y: number;
        onExit: () => void;
        onResume?: () => void;
    }) {
        super(options.scene, options.x, options.y);
        
        const scene = options.scene;

        const width = 300;
        const height = 400;

        // Background
        this.background = scene.add.rectangle(0, 0, width, height, 0x222222, 0.95);
        this.background.setStrokeStyle(2, 0x444444);
        this.add(this.background);

        // Header / Close Button
        this.closeButton = new Button({
            scene,
            x: width / 2 - 20,
            y: -height / 2 + 15,
            text: 'X',
            onClick: () => {
                this.setVisible(false);
                if (options.onResume) options.onResume();
            },
            style: {
                fontSize: '20px',
                backgroundColor: 0xcc0000,
                padding: { x: 5, y: 2 }
            }
        });
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
        const exitBtn = new Button({
            scene,
            x: 0,
            y: 0,
            text: 'Exit to Menu',
            onClick: options.onExit,
            style: {
                width: 200,
                height: 50,
                backgroundColor: 0x444444,
                backgroundColorOver: 0x666666
            }
        });
        this.menuItems.add(exitBtn);

        this.setVisible(false);
        this.setDepth(DEPTHS.UI.POPUP); // Ensure it's on top
    }

    public toggle() {
        this.setVisible(!this.visible);
    }
}
