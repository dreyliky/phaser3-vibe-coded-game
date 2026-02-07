import Phaser from 'phaser';

export class BaseWall extends Phaser.Physics.Arcade.Sprite {
    constructor(scene: Phaser.Scene, x: number, y: number, texture: string, frame?: string | number) {
        super(scene, x, y, texture, frame);
        scene.add.existing(this);
        scene.physics.add.existing(this, true); // Static body
        
        // Walls are solid
        this.setImmovable(true);
    }
}
