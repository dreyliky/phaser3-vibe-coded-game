import Phaser from 'phaser';
import { BaseLinkedWall } from './base-linked-wall';
import { WallMaterial } from '../../config/wall-data';

// --- Base Styles (Texture-based) ---

export class BaseRockWall extends BaseLinkedWall {
    constructor(scene: Phaser.Scene, x: number, y: number, material?: WallMaterial) {
        super(scene, x, y, 'wall_rock', material);
    }
}

export class BaseBrickWall extends BaseLinkedWall {
    constructor(scene: Phaser.Scene, x: number, y: number, material?: WallMaterial) {
        super(scene, x, y, 'wall_bricks', material);
    }
}

export class BasePlankWall extends BaseLinkedWall {
    constructor(scene: Phaser.Scene, x: number, y: number, material?: WallMaterial) {
        super(scene, x, y, 'wall_planks', material);
    }
}

export class BaseSmoothWall extends BaseLinkedWall {
    constructor(scene: Phaser.Scene, x: number, y: number, material?: WallMaterial) {
        super(scene, x, y, 'wall_smooth', material);
    }
}
