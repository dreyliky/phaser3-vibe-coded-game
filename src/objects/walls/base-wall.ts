import Phaser from 'phaser';

export interface BaseWallOptions {
    scene: Phaser.Scene;
    x: number;
    y: number;
    texture: string;
    frame?: string | number;
}

export class BaseWall extends Phaser.Physics.Arcade.Sprite {
    constructor(options: BaseWallOptions) {
        super(options.scene, options.x, options.y, options.texture, options.frame);
        const scene = options.scene;
        scene.add.existing(this);
        scene.physics.add.existing(this, true); // Static body
        
        // Walls are solid
        this.setImmovable(true);
    }
}
