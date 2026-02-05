import Phaser from 'phaser';
import { BaseItem } from '../objects/items/base-item';
import { ItemExtraData } from '../types/item-extra-data';
import { BaseRangeWeapon } from '../objects/items/weapons/base-range-weapon';
import { BaseMeleeWeapon } from '../objects/items/weapons/base-melee-weapon';
import { Hands } from '../objects/items/weapons/hands';

export interface InventoryItem {
    item: BaseItem;
    quantity: number;
    extraData?: ItemExtraData; // For weapon state like currentAmmo
}

export class InventorySystem extends Phaser.Events.EventEmitter {
    private slots: (InventoryItem | null)[];
    private quickSlots: (InventoryItem | null)[];
    private readonly INVENTORY_SIZE = 16;
    private readonly QUICK_SIZE = 3;

    constructor() {
        super();
        this.slots = new Array(this.INVENTORY_SIZE).fill(null);
        this.quickSlots = new Array(this.QUICK_SIZE).fill(null);
        
        // Initialize Hands in slot 0
        this.quickSlots[0] = this.createInventoryItem(new Hands(), 1);
    }

    public addItem(item: BaseItem, quantity: number = 1, extraData?: ItemExtraData): boolean {
        // Weapon Logic: Try Quick Slots first
        if (item instanceof BaseRangeWeapon || (item instanceof BaseMeleeWeapon && !(item instanceof Hands))) {
            // Find empty quick slot (SKIP SLOT 0 - HANDS)
            for (let i = 1; i < this.quickSlots.length; i++) {
                if (this.quickSlots[i] === null) {
                    this.quickSlots[i] = this.createInventoryItem(item, quantity, extraData);
                    this.emit('update', { type: 'quick', index: i, item: this.quickSlots[i] });
                    return true;
                }
            }
        }

        // Standard Logic (Non-weapon or weapon that didn't fit in quick slots)
        
        // 1. Try to stack (Main Inventory only)
        if (item.getMaxStack() > 1) {
             for (let i = 0; i < this.slots.length; i++) {
                const slot = this.slots[i];
                if (slot && slot.item.getId() === item.getId() && slot.quantity < slot.item.getMaxStack()) {
                    const space = slot.item.getMaxStack() - slot.quantity;
                    const add = Math.min(space, quantity);
                    slot.quantity += add;
                    quantity -= add;
                    this.emit('update', { type: 'main', index: i, item: slot });
                    if (quantity === 0) return true;
                }
            }
        }

        // 2. Find empty slot (Main Inventory only)
        for (let i = 0; i < this.slots.length; i++) {
            if (this.slots[i] === null) {
                this.slots[i] = this.createInventoryItem(item, quantity, extraData);
                this.emit('update', { type: 'main', index: i, item: this.slots[i] });
                return true;
            }
        }

        return false; // Inventory full
    }

    public canAddItem(item: BaseItem, quantity: number = 1): boolean {
        // Simulate addition
        let remaining = quantity;

        // Weapon check for quick slots
        if (item instanceof BaseRangeWeapon) {
             for (let i = 1; i < this.quickSlots.length; i++) { // Skip slot 0
                if (this.quickSlots[i] === null) {
                    return true;
                }
            }
        }

        // Stack check
        if (item.getMaxStack() > 1) {
            for (let i = 0; i < this.slots.length; i++) {
                const slot = this.slots[i];
                if (slot && slot.item.getId() === item.getId() && slot.quantity < slot.item.getMaxStack()) {
                    const space = slot.item.getMaxStack() - slot.quantity;
                    remaining -= space;
                    if (remaining <= 0) return true;
                }
            }
        }

        // Empty slot check
        if (remaining > 0) {
            for (let i = 0; i < this.slots.length; i++) {
                if (this.slots[i] === null) {
                    // One empty slot can take up to maxStack
                    const space = item.getMaxStack();
                    remaining -= space;
                    if (remaining <= 0) return true;
                }
            }
        }
        
        return remaining <= 0;
    }

    private createInventoryItem(item: BaseItem, quantity: number, extraData?: ItemExtraData): InventoryItem {
        const invItem: InventoryItem = { item, quantity };
        
        if (extraData) {
            invItem.extraData = extraData;
        } else if (item instanceof BaseRangeWeapon) {
            invItem.extraData = {
                currentAmmo: item.getMagazineSize() // Start full
            };
        }
        return invItem;
    }

    public getItemAt(type: 'main' | 'quick', index: number): InventoryItem | null {
        if (type === 'main') return this.slots[index];
        return this.quickSlots[index];
    }

    public setItemAt(type: 'main' | 'quick', index: number, item: InventoryItem | null) {
        // Protect Slot 0 of Quick Bar
        if (type === 'quick' && index === 0) {
            // Only allow setting if it's Hands (initialization) or if we are explicitly handling it (logic wise, we shouldn't replace it).
            // Actually, for simplicity: If we try to set null to slot 0, ignore it unless we are doing something very specific.
            // But strict rule: "Hands is the only item that will always exist... impossible to throw away".
            // So we just prevent setting it to null or another item if it's already Hands.
            
            // If we are trying to clear it (item is null), prevent it.
            if (item === null) return;
            
            // If we are trying to put something else there... prevent it?
            // "Slot for hands is unique that nothing else can be put there".
            if (!(item.item instanceof Hands)) return;
        }

        if (type === 'main') {
            this.slots[index] = item;
        } else {
            this.quickSlots[index] = item;
        }
        this.emit('update', { type, index, item });
    }

    public removeItem(type: 'main' | 'quick', index: number): InventoryItem | null {
        if (type === 'quick' && index === 0) return null; // Cannot remove Hands

        const item = this.getItemAt(type, index);
        this.setItemAt(type, index, null);
        return item;
    }

    public moveItem(fromType: 'main' | 'quick', fromIndex: number, toType: 'main' | 'quick', toIndex: number): boolean {
        const fromItem = this.getItemAt(fromType, fromIndex);
        const toItem = this.getItemAt(toType, toIndex);

        // If source is empty, nothing to move
        if (!fromItem) return false;

        // Restriction: Quick Slots can only hold Weapons (Melee/Ranged)
        if (toType === 'quick') {
            const isWeapon = fromItem.item instanceof BaseRangeWeapon || fromItem.item instanceof BaseMeleeWeapon;
            if (!isWeapon) {
                return false;
            }
        }

        // If destination has item, swap
        // Check if stackable?
        if (toItem && toItem.item.getId() === fromItem.item.getId() && fromItem.item.getMaxStack() > 1) {
            // Try to stack
            const space = toItem.item.getMaxStack() - toItem.quantity;
            if (space > 0) {
                const moveAmount = Math.min(space, fromItem.quantity);
                toItem.quantity += moveAmount;
                fromItem.quantity -= moveAmount;

                this.setItemAt(toType, toIndex, toItem); // Trigger update

                if (fromItem.quantity <= 0) {
                    this.setItemAt(fromType, fromIndex, null);
                } else {
                    this.setItemAt(fromType, fromIndex, fromItem);
                }
                return true;
            }
        }

        // Swap
        // Prevent swapping if one of them is Quick Slot 0 and the other is NOT Hands (which is always true basically)
        if ((fromType === 'quick' && fromIndex === 0) || (toType === 'quick' && toIndex === 0)) {
            return false; // Cannot move Hands
        }

        this.setItemAt(toType, toIndex, fromItem);
        this.setItemAt(fromType, fromIndex, toItem);

        return true;
    }

    public dropItem(type: 'main' | 'quick', index: number): InventoryItem | null {
        if (type === 'quick' && index === 0) return null; // Cannot drop Hands
        return this.removeItem(type, index);
    }
}

export const inventorySystem = new InventorySystem();
