import Phaser from 'phaser';
import { BaseLinkedWall } from './base-linked-wall';
import { WallMaterial } from '../../config/wall-data';

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
            texture: 'wall_rock',
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
            texture: 'wall_bricks',
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
            texture: 'wall_planks',
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
            texture: 'wall_smooth',
            material: options.material
        });
    }
}
