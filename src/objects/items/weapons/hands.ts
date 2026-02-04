import { BaseMeleeWeapon } from './base-melee-weapon';

export class Hands extends BaseMeleeWeapon {
    constructor() {
        super({
            id: 'weapon_hands',
            name: 'Hands',
            description: 'Your bare hands.',
            texture: 'weapon_hands', // We will generate this texture
            maxStack: 1,
            damage: 5
        });
    }
}
