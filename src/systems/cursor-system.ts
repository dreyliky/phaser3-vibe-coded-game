import Phaser from 'phaser';
import { SPRITE_KEYS } from '../config/constants';

export type WeaponCursorType = 'melee' | 'ranged' | 'none';

export class CursorSystem extends Phaser.Events.EventEmitter {
    private currentWeaponType: WeaponCursorType = 'none';
    private isUIWindowOpen: boolean = false;
    private isHoveringButton: boolean = false;

    constructor() {
        super();
    }

    public setWeaponType(type: WeaponCursorType) {
        if (this.currentWeaponType !== type) {
            this.currentWeaponType = type;
            this.updateCursor();
        }
    }

    public setUIWindowOpen(isOpen: boolean) {
        if (this.isUIWindowOpen !== isOpen) {
            this.isUIWindowOpen = isOpen;
            this.updateCursor();
        }
    }

    public setHoverButton(isHovering: boolean) {
        if (this.isHoveringButton !== isHovering) {
            this.isHoveringButton = isHovering;
            this.updateCursor();
        }
    }

    public reset() {
        this.currentWeaponType = 'none';
        this.isUIWindowOpen = false;
        this.isHoveringButton = false;
        this.updateCursor();
    }

    public getCurrentCursorKey(): string {
        let cursorKey: string = SPRITE_KEYS.UI.CURSOR.NONE;

        if (this.isHoveringButton) {
            cursorKey = SPRITE_KEYS.UI.CURSOR.HAND;
        } else if (this.isUIWindowOpen) {
            cursorKey = SPRITE_KEYS.UI.CURSOR.NONE;
        } else {
            switch (this.currentWeaponType) {
                case 'melee':
                    cursorKey = SPRITE_KEYS.UI.CURSOR.SWORD;
                    break;
                case 'ranged':
                    cursorKey = SPRITE_KEYS.UI.CURSOR.TARGET;
                    break;
                case 'none':
                default:
                    cursorKey = SPRITE_KEYS.UI.CURSOR.NONE;
                    break;
            }
        }
        return cursorKey;
    }

    private updateCursor() {
        const cursorKey = this.getCurrentCursorKey();
        this.emit('cursor-changed', cursorKey);
    }
}

export const cursorSystem = new CursorSystem();
