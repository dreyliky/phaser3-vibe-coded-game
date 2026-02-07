import Phaser from 'phaser';
import { BaseLinkedWall } from './base-linked-wall';

export class RockWall extends BaseLinkedWall {
    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, 'wall_rock');
    }
}

export class BrickWall extends BaseLinkedWall {
    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, 'wall_bricks');
    }
}

export class PlankWall extends BaseLinkedWall {
    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, 'wall_planks');
    }
}

export class SmoothWall extends BaseLinkedWall {
    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, 'wall_smooth');
    }
}
