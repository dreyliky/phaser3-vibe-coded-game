import { BaseWeapon, WeaponDefinition } from './base-weapon';

export abstract class BaseMeleeWeapon extends BaseWeapon {
    constructor(definition: WeaponDefinition) {
        super(definition);
    }
}
