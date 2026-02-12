import Phaser from 'phaser';
import { cursorSystem } from '../systems/cursor-system';

export class MapEditorOverlay extends Phaser.Scene {
    private cursor!: Phaser.GameObjects.Sprite;
    private onCursorChanged!: (key: string) => void;
    private cursorOffset = { x: -9, y: -6 };

    constructor() {
        super('MapEditorOverlay');
    }

    create() {
        // Initialize Cursor
        this.cursor = this.add.sprite(0, 0, 'cursor_none')
            .setDepth(100000)
            .setScale(0.5)
            .setOrigin(0, 0);

        this.onCursorChanged = (key: string) => {
            if (!this.cursor || !this.cursor.scene) return;
            this.cursor.setTexture(key);
            if (key === 'cursor_target') {
                this.cursor.setOrigin(0.5, 0.5);
                this.cursorOffset = { x: 0, y: 0 };
            } else {
                this.cursor.setOrigin(0, 0);
                this.cursorOffset = { x: -9, y: -6 };
            }
        };

        cursorSystem.on('cursor-changed', this.onCursorChanged);
        this.onCursorChanged(cursorSystem.getCurrentCursorKey());

        this.events.on('shutdown', () => {
            cursorSystem.off('cursor-changed', this.onCursorChanged);
        });
    }

    update() {
        if (this.cursor) {
            const pointer = this.input.activePointer;
            this.cursor.setPosition(pointer.x + this.cursorOffset.x, pointer.y + this.cursorOffset.y);
        }
    }
}
