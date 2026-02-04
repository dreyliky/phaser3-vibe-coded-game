import { BaseAmmo } from './base-ammo';

export class LightAmmo extends BaseAmmo {
    constructor() {
        super({
            id: 'ammo_light',
            name: 'Light Ammo',
            description: 'Small caliber ammunition for light weapons.',
            texture: 'ammo_light',
            maxStack: 100,
            damage: 10,
            caliber: 'light'
        });
    }
}

export class StandardAmmo extends BaseAmmo {
    constructor() {
        super({
            id: 'ammo_standard',
            name: 'Standard Ammo',
            description: 'Standard caliber ammunition for assault rifles.',
            texture: 'ammo_standard',
            maxStack: 60,
            damage: 20,
            caliber: 'standard'
        });
    }
}

export class HeavyAmmo extends BaseAmmo {
    constructor() {
        super({
            id: 'ammo_heavy',
            name: 'Heavy Ammo',
            description: 'Large caliber ammunition for sniper rifles and heavy weapons.',
            texture: 'ammo_heavy',
            maxStack: 20,
            damage: 40,
            caliber: 'heavy'
        });
    }
}

export class BuckshotAmmo extends BaseAmmo {
    constructor() {
        super({
            id: 'ammo_buckshot',
            name: 'Buckshot',
            description: 'Shells for shotguns.',
            texture: 'ammo_buckshot',
            maxStack: 40,
            damage: 8, // Per pellet
            caliber: 'buckshot'
        });
    }
}
