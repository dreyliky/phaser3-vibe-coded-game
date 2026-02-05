import Phaser from 'phaser';

export class BasePlant extends Phaser.Physics.Arcade.Sprite {
    constructor(scene: Phaser.Scene, x: number, y: number, texture: string, frame?: string | number) {
        super(scene, x, y, texture, frame);
        scene.add.existing(this);
        scene.physics.add.existing(this, true); // Static body
        
        // Default depth sorting based on the bottom of the sprite
        this.setDepth(this.y + (this.height * 0.5));
    }
}
