import Phaser from 'phaser';
import { BasePlant } from './base-plant';

export class Tree extends BasePlant {
    constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
        super(scene, x, y, texture);
        
        const width = this.width;
        const height = this.height;
        
        // Tree collider: small box at the bottom (trunk)
        // Reduced height as requested
        const colliderWidth = width * 0.2; 
        const colliderHeight = height * 0.05; // Reduced from 0.1 to 0.05
        
        this.setBodySize(colliderWidth, colliderHeight);
        
        // Offset to position the collider at the bottom center
        // Adjusted to be lower on the trunk (closer to roots)
        const yOffset = height - colliderHeight - 10; 
        
        this.setOffset((width - colliderWidth) / 2, yOffset);
    }
}
