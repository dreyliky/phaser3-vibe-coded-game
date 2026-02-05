import Phaser from 'phaser';
import { InventoryWindow, QuickBar, PauseMenu, Tooltip } from '../objects/ui';
import { inventorySystem } from '../systems/inventory-system';
import { InventorySlot } from '../objects/ui/inventory-slot';

export class HUD extends Phaser.Scene {
    private inventoryWindow!: InventoryWindow;
    private quickBar!: QuickBar;
    private pauseMenu!: PauseMenu;
    private ammoText!: Phaser.GameObjects.Text;
    private caliberText!: Phaser.GameObjects.Text;
    private tooltip!: Tooltip;
    private backdrop!: Phaser.GameObjects.Rectangle;

    constructor() {
        super('HUD');
    }

    create() {
        const { width, height } = this.scale;

        // Backdrop (Black, 20% opacity, behind windows)
        this.backdrop = this.add.rectangle(0, 0, width, height, 0x000000, 0.2)
            .setOrigin(0)
            .setDepth(90)
            .setVisible(false)
            .setInteractive(); // Block clicks below

        // Quick Bar (Bottom Center)
        this.quickBar = new QuickBar(this, width * 0.5, height - 50);
        this.quickBar.setDepth(95);
        this.add.existing(this.quickBar);

        // Inventory Window (Center)
        this.inventoryWindow = new InventoryWindow(this, width * 0.5, height * 0.5);
        this.inventoryWindow.setDepth(100);
        this.add.existing(this.inventoryWindow);

        // Pause Menu (Center)
        this.pauseMenu = new PauseMenu(this, width * 0.5, height * 0.5, () => {
            this.scene.stop('GameScene');
            this.scene.stop('HUD');
            this.scene.start('MainMenu');
        }, () => {
            // On Resume
            this.updateBackdrop();
        });
        this.pauseMenu.setDepth(101);
        this.add.existing(this.pauseMenu);

        // Tooltip
        this.tooltip = new Tooltip(this);
        
        // Listen for tooltip events from HUD elements (Inventory/QuickBar)
        this.events.on('tooltip-show', (content: string, x: number, y: number) => {
            this.tooltip.show(content, x, y);
        });

        this.events.on('tooltip-hide', () => {
            this.tooltip.hide();
        });

        // Listen for tooltip events from GameScene elements (WorldItems)
        const gameScene = this.scene.get('GameScene');
        if (gameScene) {
            gameScene.events.on('tooltip-show', (content: string, x: number, y: number) => {
                this.tooltip.show(content, x, y);
            });

            gameScene.events.on('tooltip-hide', () => {
                this.tooltip.hide();
            });
        }

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
                this.toggleInventory();
            });

            this.input.keyboard.on('keydown-ESC', () => {
                this.handleEsc();
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
            // Reparent to scene to ensure it's on top of everything (UI, Windows)
            const worldTransform = gameObject.getWorldTransformMatrix();
            const globalPos = worldTransform.transformPoint(0, 0);
            
            gameObject.parentContainer.remove(gameObject);
            this.add.existing(gameObject);
            gameObject.setPosition(globalPos.x, globalPos.y);
            gameObject.setDepth(10000); // Higher than everything (Windows are 100-101, Tooltip usually high)
            
            gameObject.setAlpha(0.8);
        });

        this.input.on('drag', (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Sprite, dragX: number, dragY: number) => {
            // Use pointer position directly since gameObject is now child of Scene (Screen Space)
            // This fixes the issue where sprite jumps to top-left or weird coordinates
            gameObject.x = pointer.x;
            gameObject.y = pointer.y;
        });

        this.input.on('drop', (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Sprite, dropZone: any) => {
            // Check if dropped on InventoryWindow background (which is a drop zone now)
            // If so, just return (cancel drop), so it snaps back in dragend
            if (!dropZone.slotType) {
                // Not a slot (likely window background)
                return;
            }

            const fromType = gameObject.getData('slotType');
            const fromIndex = gameObject.getData('slotIndex');
            const toType = dropZone.slotType;
            const toIndex = dropZone.slotIndex;

            // Check if target slot is disabled (if in main inventory)
            if (toType === 'main') {
                if (this.inventoryWindow.isSlotDisabled(toIndex)) {
                    // Cannot drop to disabled slot
                    return; 
                }
            }

            inventorySystem.moveItem(fromType, fromIndex, toType, toIndex);
            
            // Visual reset will be handled by inventory update or dragend cleanup
        });

        this.input.on('dragend', (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Sprite, dropped: boolean) => {
            // Check if dropped successfully? 
            // The 'dropped' param is true if pointerup happened on a drop zone.
            // But we might have rejected the drop in 'drop' handler (e.g. disabled slot).
            // However, Phaser doesn't easily let 'drop' handler cancel 'dropped' state for 'dragend'.
            // Logic: If moveItem happened, the slot would have updated and destroyed this gameObject (old icon).
            // If this gameObject is still active, it means either:
            // 1. Drop failed (rejected by logic)
            // 2. Dropped on nothing (dropped = false)
            
            if (gameObject.active) {
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
                
                // If still active (was not dropped to world OR drop was rejected/cancelled), put back to slot
                if (gameObject.active) {
                    const originSlot = gameObject.getData('originSlot') as InventorySlot;
                    if (originSlot) {
                        this.children.remove(gameObject);
                        originSlot.add(gameObject);
                        gameObject.setPosition(0, 0);
                        gameObject.setAlpha(1);
                        gameObject.setDepth(0);
                    } else {
                        // Should not happen, but destroy if lost
                        gameObject.destroy();
                    }
                }
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
            
            // Clean up tooltip listeners
            this.events.off('tooltip-show');
            this.events.off('tooltip-hide');
            
            const gameScene = this.scene.get('GameScene');
            if (gameScene) {
                gameScene.events.off('tooltip-show');
                gameScene.events.off('tooltip-hide');
            }
        });
    }

    update() {
        const gameScene = this.scene.get('GameScene') as any;
        if (!gameScene || !gameScene.player) {
            this.ammoText.setText('');
            this.caliberText.setText('');
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

    public handleShiftClick(type: 'main' | 'quick', index: number) {
        if (type === 'main') {
            const item = inventorySystem.getItemAt('main', index);
            if (!item) return;

            // Strategy:
            // 1. Try to move to first empty quick slot (excluding Hands at 0)
            // 2. If no empty slot, try to move to selected quick slot (if != 0)
            
            // Check for empty slots
            let moved = false;
            // Check slots 1 and 2 (InventorySystem has 3 slots, 0 is Hands)
            for (let i = 1; i < 3; i++) { 
                 const quickItem = inventorySystem.getItemAt('quick', i);
                 if (!quickItem) {
                     moved = inventorySystem.moveItem('main', index, 'quick', i);
                     if (moved) {
                         this.time.delayedCall(0, () => this.events.emit('tooltip-hide'));
                         return;
                     }
                 }
            }
            
            // If not moved (full), try selected slot
            if (!moved) {
                const selectedIndex = this.quickBar.getSelectedIndex();
                if (selectedIndex !== 0) {
                    const movedToSelected = inventorySystem.moveItem('main', index, 'quick', selectedIndex);
                    if (movedToSelected) {
                        this.time.delayedCall(0, () => this.events.emit('tooltip-hide'));
                    }
                }
            }
        } else {
            // Quick Slot -> Main Inventory
            if (index === 0) return; // Cannot move Hands

            const item = inventorySystem.getItemAt('quick', index);
            if (!item) return;

            // 1. Try to stack
            if (item.item.getMaxStack() > 1) {
                for (let i = 0; i < 16; i++) {
                    // Skip disabled slots
                    if (this.inventoryWindow.isSlotDisabled(i)) continue;

                    const slot = inventorySystem.getItemAt('main', i);
                    if (slot && slot.item.getId() === item.item.getId() && slot.quantity < slot.item.getMaxStack()) {
                        const moved = inventorySystem.moveItem('quick', index, 'main', i);
                        if (moved) {
                            this.time.delayedCall(0, () => this.events.emit('tooltip-hide'));
                            return;
                        }
                    }
                }
            }

            // 2. Find empty slot
            for (let i = 0; i < 16; i++) {
                // Skip disabled slots
                if (this.inventoryWindow.isSlotDisabled(i)) continue;

                const slot = inventorySystem.getItemAt('main', i);
                if (!slot) {
                    const moved = inventorySystem.moveItem('quick', index, 'main', i);
                    if (moved) {
                        this.time.delayedCall(0, () => this.events.emit('tooltip-hide'));
                    }
                    return;
                }
            }
        }
    }

    private toggleInventory() {
        if (this.pauseMenu.visible) return;
        this.inventoryWindow.toggle();
        this.updateBackdrop();
    }

    private handleEsc() {
        if (this.inventoryWindow.visible) {
            this.inventoryWindow.setVisible(false);
            this.updateBackdrop();
        } else {
            // Only open PauseMenu if Inventory is closed
            // Toggle pause menu
            this.pauseMenu.toggle();
            this.updateBackdrop();
        }
    }

    private updateBackdrop() {
        const isAnyWindowOpen = this.inventoryWindow.visible || this.pauseMenu.visible;
        this.backdrop.setVisible(isAnyWindowOpen);
    }
}
