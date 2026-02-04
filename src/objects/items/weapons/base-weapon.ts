import { BaseItem, ItemDefinition } from '../base-item';

export interface WeaponDefinition extends ItemDefinition {
    damage: number;
}

export abstract class BaseWeapon extends BaseItem {
    protected weaponDef: WeaponDefinition;

    constructor(definition: WeaponDefinition) {
        super(definition);
        this.weaponDef = definition;
    }

    public getDamage(): number {
        return this.weaponDef.damage;
    }
}
