import Phaser from 'phaser';
import { InventoryWindow, QuickBar, PauseMenu } from '../objects/ui';
import { inventorySystem } from '../systems/inventory-system';
import { InventorySlot } from '../objects/ui/inventory-slot';

export class HUD extends Phaser.Scene {
    private inventoryWindow!: InventoryWindow;
    private quickBar!: QuickBar;
    private pauseMenu!: PauseMenu;
    private ammoText!: Phaser.GameObjects.Text;
    private caliberText!: Phaser.GameObjects.Text;

    constructor() {
        super('HUD');
    }

    create() {
        const { width, height } = this.scale;

        // Quick Bar (Bottom Center)
        this.quickBar = new QuickBar(this, width * 0.5, height - 50);
        this.add.existing(this.quickBar);

        // Inventory Window (Center)
        this.inventoryWindow = new InventoryWindow(this, width * 0.5, height * 0.5);
        this.add.existing(this.inventoryWindow);

        // Pause Menu (Center)
        this.pauseMenu = new PauseMenu(this, width * 0.5, height * 0.5, () => {
            this.scene.stop('GameScene');
            this.scene.stop('HUD');
            this.scene.start('MainMenu');
        });
        this.add.existing(this.pauseMenu);

        // Ammo Display (Bottom Left)
        this.ammoText = this.add.text(20, height - 40, '', {
            fontSize: '24px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2,
            fontFamily: 'Arial'
        });
        this.ammoText.setScrollFactor(0);

        // Caliber Display (Below Ammo)
        this.caliberText = this.add.text(20, height - 15, '', {
            fontSize: '8px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 1,
            fontFamily: 'Arial'
        });
        this.caliberText.setScrollFactor(0);

        // Input Handling
        if (this.input.keyboard) {
            this.input.keyboard.addCapture('TAB');
            
            this.input.keyboard.on('keydown-TAB', () => {
                this.inventoryWindow.toggle();
            });

            this.input.keyboard.on('keydown-ESC', () => {
                this.pauseMenu.toggle();
            });

            this.input.keyboard.on('keydown-ONE', () => {
                this.quickBar.selectSlot(0);
            });

            this.input.keyboard.on('keydown-TWO', () => {
                this.quickBar.selectSlot(1);
            });

            this.input.keyboard.on('keydown-THREE', () => {
                this.quickBar.selectSlot(2);
            });
        }

        // Drag and Drop
        this.input.on('dragstart', (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Sprite) => {
            this.children.bringToTop(gameObject);
            gameObject.setAlpha(0.8);
        });

        this.input.on('drag', (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Sprite, dragX: number, dragY: number) => {
            gameObject.x = dragX;
            gameObject.y = dragY;
        });

        this.input.on('drop', (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Sprite, dropZone: InventorySlot) => {
            const fromType = gameObject.getData('slotType');
            const fromIndex = gameObject.getData('slotIndex');
            const toType = dropZone.slotType;
            const toIndex = dropZone.slotIndex;

            inventorySystem.moveItem(fromType, fromIndex, toType, toIndex);
            
            // Reset visual immediately (though update will handle it)
            gameObject.x = 0;
            gameObject.y = 0;
            gameObject.setAlpha(1);
        });

        this.input.on('dragend', (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Sprite, dropped: boolean) => {
            if (!dropped) {
                // Drop to world
                const fromType = gameObject.getData('slotType');
                const fromIndex = gameObject.getData('slotIndex');
                
                const item = inventorySystem.dropItem(fromType, fromIndex);
                if (item) {
                    // Notify Game scene to spawn item
                    const gameScene = this.scene.get('GameScene') as any;
                    if (gameScene && gameScene.itemInteractionSystem) {
                        gameScene.itemInteractionSystem.spawnPlayerDrop(item.item, item.quantity, item.extraData);
                    }
                }
            }
            
            // Ensure visual reset if not destroyed
            if (gameObject.active) {
                gameObject.x = 0;
                gameObject.y = 0;
                gameObject.setAlpha(1);
            }
        });

        // Clean up input on scene shutdown (if needed, though HUD usually persists)
        this.events.on('shutdown', () => {
            if (this.input.keyboard) {
                this.input.keyboard.off('keydown-TAB');
                this.input.keyboard.off('keydown-ESC');
                this.input.keyboard.off('keydown-ONE');
                this.input.keyboard.off('keydown-TWO');
                this.input.keyboard.off('keydown-THREE');
            }
        });
    }

    update() {
        const gameScene = this.scene.get('GameScene') as any;
        if (!gameScene || !gameScene.player) {
            this.ammoText.setText('');
            return;
        }

        const ammoInfo = gameScene.player.getAmmoInfo();
        if (ammoInfo && ammoInfo.isWeapon) {
            const text = ammoInfo.total > 0 ? `${ammoInfo.current}/${ammoInfo.total}` : `${ammoInfo.current}`;
            this.ammoText.setText(text);
            this.ammoText.setVisible(true);

            this.caliberText.setText(ammoInfo.caliber);
            this.caliberText.setVisible(true);
        } else {
            this.ammoText.setVisible(false);
            this.caliberText.setVisible(false);
        }
    }
}
