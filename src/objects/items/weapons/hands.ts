import { BaseMeleeWeapon } from './base-melee-weapon';
import { SPRITE_KEYS } from '../../../config/constants';

export class Hands extends BaseMeleeWeapon {
    constructor() {
        super({
            id: SPRITE_KEYS.WEAPONS.HANDS,
            name: 'Hands',
            description: 'Your bare hands.',
            texture: SPRITE_KEYS.WEAPONS.HANDS, // We will generate this texture
            maxStack: 1,
            damage: 5
        });
    }
}
