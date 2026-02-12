import { BaseRangeWeapon } from './base-range-weapon';
import { SPRITE_KEYS } from '../../../config/constants';

export class AssaultRifle extends BaseRangeWeapon {
    constructor() {
        super({
            id: SPRITE_KEYS.WEAPONS.ASSAULT_RIFLE,
            name: 'Assault Rifle',
            description: 'Automatic rifle.',
            texture: SPRITE_KEYS.WEAPONS.ASSAULT_RIFLE,
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
            id: SPRITE_KEYS.WEAPONS.AUTOPISTOL,
            name: 'Pistol',
            description: 'Semi-automatic pistol.',
            texture: SPRITE_KEYS.WEAPONS.AUTOPISTOL,
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
            id: SPRITE_KEYS.WEAPONS.SHOTGUN,
            name: 'Pump Shotgun',
            description: 'Pump-action shotgun.',
            texture: SPRITE_KEYS.WEAPONS.SHOTGUN,
            maxStack: 1,
            damage: 8, // Per pellet
            caliber: 'buckshot',
            magazineSize: 5,
            fireRate: 800,
            reloadSpeed: 3000
        });
    }
}
