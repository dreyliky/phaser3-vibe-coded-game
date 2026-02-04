import { BaseItem, ItemDefinition } from '../base-item';

export interface AmmoDefinition extends ItemDefinition {
    damage: number;
    caliber: string;
}

export abstract class BaseAmmo extends BaseItem {
    protected ammoDef: AmmoDefinition;

    constructor(definition: AmmoDefinition) {
        super(definition);
        this.ammoDef = definition;
    }

    public getDamage(): number {
        return this.ammoDef.damage;
    }

    public getCaliber(): string {
        return this.ammoDef.caliber;
    }
}
