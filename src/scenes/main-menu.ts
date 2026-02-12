import Phaser from 'phaser';
import { Button } from '../objects/ui/button';
import { cursorSystem } from '../systems/cursor-system';

export class MainMenu extends Phaser.Scene {
    private titleText!: Phaser.GameObjects.Text;
    private menuButtons: Button[] = [];
    private cursor!: Phaser.GameObjects.Sprite;
    private onCursorChanged!: (key: string) => void;
    private cursorOffset = { x: 0, y: 0 };

    constructor() {
        super('MainMenu');
    }

    create() {
        const { width, height } = this.scale;
        
        // Initialize Cursor
        this.input.setDefaultCursor('none');
        this.cursor = this.add.sprite(0, 0, 'cursor_none')
            .setDepth(100000) // Always on top
            .setScale(0.5)
            .setOrigin(0, 0);

        this.onCursorChanged = (key: string) => {
             if (!this.cursor || !this.cursor.scene) return;
            this.cursor.setTexture(key);
            // In menu we mostly use pointer or hand, so origin 0,0 is fine usually, 
            // but if we reuse target cursor logic:
            if (key === 'cursor_target') {
                this.cursor.setOrigin(0.5, 0.5);
                this.cursorOffset = { x: 0, y: 0 };
            } else {
                this.cursor.setOrigin(0, 0);
                this.cursorOffset = { x: -9, y: -6 };
            }
        };

        cursorSystem.on('cursor-changed', this.onCursorChanged);
        
        // Ensure we start with none/default in menu
        cursorSystem.setUIWindowOpen(false); 
        cursorSystem.setWeaponType('none');
        this.onCursorChanged(cursorSystem.getCurrentCursorKey());
        
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

    update() {
        if (this.cursor) {
            const pointer = this.input.activePointer;
            this.cursor.setPosition(pointer.x + this.cursorOffset.x, pointer.y + this.cursorOffset.y);
        }
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

    shutdown() {
        if (this.onCursorChanged) {
            cursorSystem.off('cursor-changed', this.onCursorChanged);
        }
    }
}
