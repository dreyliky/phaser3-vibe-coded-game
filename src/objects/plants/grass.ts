import Phaser from 'phaser';
import { BasePlant, BasePlantOptions } from './base-plant';

export class Grass extends BasePlant {
    constructor(options: BasePlantOptions) {
        super(options);
        
        // Grass is purely decorative and has no collision
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.enable = false; 
    }
}
