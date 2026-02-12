import { BaseAmmo } from './base-ammo';
import { SPRITE_KEYS } from '../../../config/constants';

export class LightAmmo extends BaseAmmo {
    constructor() {
        super({
            id: SPRITE_KEYS.AMMO.LIGHT,
            name: 'Light Ammo',
            description: 'Small caliber ammunition for light weapons.',
            texture: SPRITE_KEYS.AMMO.LIGHT,
            maxStack: 100,
            damage: 10,
            caliber: 'light'
        });
    }
}

export class StandardAmmo extends BaseAmmo {
    constructor() {
        super({
            id: SPRITE_KEYS.AMMO.STANDARD,
            name: 'Standard Ammo',
            description: 'Standard caliber ammunition for assault rifles.',
            texture: SPRITE_KEYS.AMMO.STANDARD,
            maxStack: 60,
            damage: 20,
            caliber: 'standard'
        });
    }
}

export class HeavyAmmo extends BaseAmmo {
    constructor() {
        super({
            id: SPRITE_KEYS.AMMO.HEAVY,
            name: 'Heavy Ammo',
            description: 'Large caliber ammunition for sniper rifles and heavy weapons.',
            texture: SPRITE_KEYS.AMMO.HEAVY,
            maxStack: 20,
            damage: 40,
            caliber: 'heavy'
        });
    }
}

export class BuckshotAmmo extends BaseAmmo {
    constructor() {
        super({
            id: SPRITE_KEYS.AMMO.BUCKSHOT,
            name: 'Buckshot',
            description: 'Shells for shotguns.',
            texture: SPRITE_KEYS.AMMO.BUCKSHOT,
            maxStack: 40,
            damage: 8, // Per pellet
            caliber: 'buckshot'
        });
    }
}
