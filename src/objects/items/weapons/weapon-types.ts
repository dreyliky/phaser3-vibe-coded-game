import { BaseRangeWeapon } from './base-range-weapon';

export class AssaultRifle extends BaseRangeWeapon {
    constructor() {
        super({
            id: 'weapon_assault_rifle',
            name: 'Assault Rifle',
            description: 'Automatic rifle.',
            texture: 'weapon_assault_rifle',
            maxStack: 1,
            damage: 15,
            caliber: 'standard',
            magazineSize: 30,
            fireRate: 100, // ms delay between shots
            reloadSpeed: 2000
        });
    }
}

export class Pistol extends BaseRangeWeapon {
    constructor() {
        super({
            id: 'weapon_pistol',
            name: 'Pistol',
            description: 'Semi-automatic pistol.',
            texture: 'weapon_pistol',
            maxStack: 1,
            damage: 10,
            caliber: 'light',
            magazineSize: 10,
            fireRate: 200,
            reloadSpeed: 1500
        });
    }
}

export class Shotgun extends BaseRangeWeapon {
    constructor() {
        super({
            id: 'weapon_shotgun',
            name: 'Pump Shotgun',
            description: 'Pump-action shotgun.',
            texture: 'weapon_shotgun',
            maxStack: 1,
            damage: 8, // Per pellet
            caliber: 'buckshot',
            magazineSize: 5,
            fireRate: 800,
            reloadSpeed: 3000
        });
    }
}
