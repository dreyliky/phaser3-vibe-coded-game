import Phaser from 'phaser';
import { BaseLinkedWall } from './base-linked-wall';
import { WallMaterial } from '../../config/wall-data';
import { SPRITE_KEYS } from '../../config/constants';

// --- Base Styles (Texture-based) ---

export interface WallTypeOptions {
    scene: Phaser.Scene;
    x: number;
    y: number;
    material?: WallMaterial;
}

export class BaseRockWall extends BaseLinkedWall {
    constructor(options: WallTypeOptions) {
        super({
            scene: options.scene,
            x: options.x,
            y: options.y,
            texture: SPRITE_KEYS.WALLS.ROCK,
            material: options.material
        });
    }
}

export class BaseBrickWall extends BaseLinkedWall {
    constructor(options: WallTypeOptions) {
        super({
            scene: options.scene,
            x: options.x,
            y: options.y,
            texture: SPRITE_KEYS.WALLS.BRICKS,
            material: options.material
        });
    }
}

export class BasePlankWall extends BaseLinkedWall {
    constructor(options: WallTypeOptions) {
        super({
            scene: options.scene,
            x: options.x,
            y: options.y,
            texture: SPRITE_KEYS.WALLS.PLANKS,
            material: options.material
        });
    }
}

export class BaseSmoothWall extends BaseLinkedWall {
    constructor(options: WallTypeOptions) {
        super({
            scene: options.scene,
            x: options.x,
            y: options.y,
            texture: SPRITE_KEYS.WALLS.SMOOTH,
            material: options.material
        });
    }
}
