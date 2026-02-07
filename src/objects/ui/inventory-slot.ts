import Phaser from 'phaser';
import { InventoryItem } from '../../systems/inventory-system';

export class InventorySlot extends Phaser.GameObjects.Container {
    private background: Phaser.GameObjects.Rectangle;
    private border: Phaser.GameObjects.Graphics;
    private itemIcon: Phaser.GameObjects.Sprite | null = null;
    private quantityText: Phaser.GameObjects.Text | null = null;
    private isDisabled: boolean = false;
    private size: number;
    private isSelected: boolean = false;
    
    public slotIndex: number;
    public slotType: 'main' | 'quick';

    constructor(scene: Phaser.Scene, x: number, y: number, size: number = 50, type: 'main' | 'quick', index: number) {
        super(scene, x, y);
        this.size = size;
        this.slotType = type;
        this.slotIndex = index;

        // Background
        this.background = scene.add.rectangle(0, 0, size, size, 0x666666);
        this.add(this.background);

        // Border
        this.border = scene.add.graphics();
        this.drawBorder();
        this.add(this.border);

        this.setSize(size, size);
        this.setInteractive({ dropZone: true });
    }

    public setItem(item: InventoryItem | null) {
        if (this.itemIcon) {
            this.itemIcon.destroy();
            this.itemIcon = null;
        }
        if (this.quantityText) {
            this.quantityText.destroy();
            this.quantityText = null;
        }

        if (item) {
            // Icon
            this.itemIcon = this.scene.add.sprite(0, 0, item.item.getTexture());
            this.itemIcon.setDisplaySize(this.size * 0.8, this.size * 0.8);
            this.add(this.itemIcon);

            // Enable drag on the icon
            if (!this.isDisabled) {
                this.itemIcon.setInteractive({ useHandCursor: true });
                this.scene.input.setDraggable(this.itemIcon);
                
                // Store reference to slot info on the icon for drag events
                this.itemIcon.setData('slotType', this.slotType);
                this.itemIcon.setData('slotIndex', this.slotIndex);
                this.itemIcon.setData('originSlot', this);

                // Tooltip
                this.itemIcon.on('pointerover', (pointer: Phaser.Input.Pointer) => {
                    const name = item.item.getName();
                    const qty = item.quantity > 1 ? ` (${item.quantity})` : '';
                    this.scene.events.emit('tooltip-show', `${name}${qty}`, pointer.x, pointer.y);
                });

                this.itemIcon.on('pointerout', () => {
                    this.scene.events.emit('tooltip-hide');
                });

                // Shift+Click to equip/unequip
                this.itemIcon.on('pointerup', (pointer: Phaser.Input.Pointer) => {
                    const event = pointer.event as MouseEvent;
                    if (event.shiftKey) {
                        this.scene.events.emit('slot-shift-click', this.slotType, this.slotIndex);
                    }
                });
            }

            // Quantity
            if (item.quantity > 1) {
                this.quantityText = this.scene.add.text(this.size / 2 - 2, this.size / 2 - 2, item.quantity.toString(), {
                    fontSize: '12px',
                    color: '#ffffff',
                    stroke: '#000000',
                    strokeThickness: 2
                }).setOrigin(1, 1);
                this.add(this.quantityText);
            }
        }
    }

    public setDisabled(disabled: boolean) {
        this.isDisabled = disabled;
        this.background.setFillStyle(disabled ? 0x333333 : 0x666666);
        this.background.setAlpha(disabled ? 0.5 : 1);
        if (disabled) {
            this.disableInteractive();
            // Also disable icon drag if present
            if (this.itemIcon) {
                this.itemIcon.disableInteractive();
            }
        } else {
            this.setInteractive({ dropZone: true });
        }
    }

    public getIsDisabled(): boolean {
        return this.isDisabled;
    }

    public setSelected(selected: boolean) {
        this.isSelected = selected;
        this.drawBorder();
    }

    private drawBorder() {
        this.border.clear();
        if (this.isSelected) {
            this.border.lineStyle(2, 0xff0000);
        } else {
            this.border.lineStyle(2, 0x000000);
        }
        this.border.strokeRect(-this.size / 2, -this.size / 2, this.size, this.size);
    }
}
