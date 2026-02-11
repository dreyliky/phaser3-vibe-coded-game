import Phaser from 'phaser';

export interface BasePlantOptions {
    scene: Phaser.Scene;
    x: number;
    y: number;
    texture: string;
    frame?: string | number;
    scale?: number;
}

export class BasePlant extends Phaser.Physics.Arcade.Sprite {
    constructor(options: BasePlantOptions) {
        super(options.scene, options.x, options.y, options.texture, options.frame);
        const scene = options.scene;
        scene.add.existing(this);
        scene.physics.add.existing(this, true); // Static body
        
        if (options.scale !== undefined) {
            this.setScale(options.scale);
        }
        
        // Default depth sorting based on the bottom of the sprite
        this.setDepth(this.y + (this.height * 0.5));
    }
}
