import { BaseWeapon, WeaponDefinition } from './base-weapon';

export interface RangeWeaponDefinition extends WeaponDefinition {
    caliber: string;
    magazineSize: number;
    fireRate: number; // shots per second or delay ms
    reloadSpeed: number; // in ms
}

export abstract class BaseRangeWeapon extends BaseWeapon {
    protected rangeDef: RangeWeaponDefinition;

    constructor(definition: RangeWeaponDefinition) {
        super(definition);
        this.rangeDef = definition;
    }

    public getCaliber(): string {
        return this.rangeDef.caliber;
    }

    public getMagazineSize(): number {
        return this.rangeDef.magazineSize;
    }

    public getFireRate(): number {
        return this.rangeDef.fireRate;
    }

    public getReloadSpeed(): number {
        return this.rangeDef.reloadSpeed;
    }
}
