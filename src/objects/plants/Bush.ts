import Phaser from 'phaser';
import { BasePlant } from './BasePlant';

export class Bush extends BasePlant {
    constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
        super(scene, x, y, texture);
        
        // Bushes are decorative and have no collision
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.enable = false; 
    }
}
