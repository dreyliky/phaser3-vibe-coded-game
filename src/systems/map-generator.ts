import Phaser from 'phaser';
import { VegetationGenerator } from './vegetation-generator';

export class MapGenerator {
    private scene: Phaser.Scene;
    private vegetationGenerator: VegetationGenerator;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.vegetationGenerator = new VegetationGenerator(scene);
    }

    public generateMap(width: number, height: number) {
        // Future map generation logic (terrain, structures) goes here
        
        // Generate vegetation
        // Starting with a reasonable amount to cover the 4000x4000 map
        this.vegetationGenerator.generateVegetation(width, height, 400);
    }
    
    public getVegetation() {
        return this.vegetationGenerator.getPlantsGroup();
    }
}
