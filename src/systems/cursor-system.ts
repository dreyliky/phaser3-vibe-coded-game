import Phaser from 'phaser';

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
        let cursorKey = 'cursor_none';

        if (this.isHoveringButton) {
            cursorKey = 'cursor_hand';
        } else if (this.isUIWindowOpen) {
            cursorKey = 'cursor_none';
        } else {
            switch (this.currentWeaponType) {
                case 'melee':
                    cursorKey = 'cursor_sword';
                    break;
                case 'ranged':
                    cursorKey = 'cursor_target';
                    break;
                case 'none':
                default:
                    cursorKey = 'cursor_none';
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
