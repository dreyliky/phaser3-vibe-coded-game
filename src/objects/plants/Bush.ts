import Phaser from 'phaser';
import { BasePlant, BasePlantOptions } from './base-plant';

export class Bush extends BasePlant {
    constructor(options: BasePlantOptions) {
        super(options);
        
        // Bushes are decorative and have no collision
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.enable = false; 
    }
}
