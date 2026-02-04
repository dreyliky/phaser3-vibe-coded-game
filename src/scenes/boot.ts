import Phaser from 'phaser';
import { BodyType, FaceType, Gender, HairType } from '../types/character';
import { ASSETS } from '../config/constants';

export class Boot extends Phaser.Scene {
    constructor() {
        super('Boot');
    }

    preload() {
        const basePath = ASSETS.SPRITES.HUMANLIKE_BASE_PATH;
        const directions = ['south', 'north', 'east'];

        // Load Bodies
        Object.values(BodyType).forEach(type => {
            directions.forEach(dir => {
                const key = `body_${type}_${dir}`;
                const path = `${basePath}/Bodies/Naked_${type}_${dir}.png`;
                this.load.image(key, path);
            });
        });

        // Load Heads
        Object.values(Gender).forEach(gender => {
            Object.values(FaceType).forEach(face => {
                directions.forEach(dir => {
                    // Skip invalid combinations if necessary, but Phaser handles missing files gracefully (mostly)
                    // Construct filename: e.g., Male_Average_Normal_south.png
                    // FaceType is like "Average_Normal"
                    
                    const filename = `${gender}_${face}_${dir}.png`;
                    const key = `head_${gender}_${face}_${dir}`;
                    const path = `${basePath}/Heads/${gender}/${filename}`;
                    
                    this.load.image(key, path);
                });
            });
        });

        // Load Hairs
        Object.values(HairType).forEach(hair => {
            directions.forEach(dir => {
                const key = `hair_${hair}_${dir}`;
                const path = `${basePath}/Hairs/${hair}_${dir}.png`;
                this.load.image(key, path);
            });
        });
    }

    create() {
        // Go to Main Menu
        this.scene.start('MainMenu');
    }
}
