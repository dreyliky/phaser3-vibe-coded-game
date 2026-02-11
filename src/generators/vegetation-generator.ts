import Phaser from 'phaser';
import { Bush, Tree } from '../objects/plants';

export class VegetationGenerator {
    private scene: Phaser.Scene;
    private plants: Phaser.GameObjects.Group; // Using Group to hold references, bodies are managed individually or via group

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        // We can use a Group to organize them, but since we create custom classes with their own bodies,
        // we just need a collection to pass to the collider.
        // A standard Group works for this.
        this.plants = this.scene.add.group(); 
    }

    public generateVegetation(options: {
        mapWidth: number;
        mapHeight: number;
        count: number;
        collisionCheck?: (x: number, y: number) => boolean;
    }) {
        const { mapWidth, mapHeight, count, collisionCheck } = options;
        const treeTypes = [
            'plant_tree_bamboo', 'plant_tree_cecropia', 'plant_tree_palm', 
            'plant_tree_teak', 'plant_tree_willow'
        ];
        
        const bushTypes = [
            'plant_agave', 'plant_pincushion_cactus', 'plant_saguaro_cactus', 
            'plant_saguaro_cactus_leafless'
        ];

        const placedPositions: {x: number, y: number}[] = [];
        const minDistance = 64;

        for (let i = 0; i < count; i++) {
            let x = 0;
            let y = 0;
            let attempts = 0;
            let validPosition = false;

            // Try to find a valid position
            while (attempts < 20 && !validPosition) {
                x = Phaser.Math.Between(0, mapWidth);
                y = Phaser.Math.Between(0, mapHeight);
                
                validPosition = true;
                
                // Check distance to other plants
                for (const pos of placedPositions) {
                    if (Phaser.Math.Distance.Between(x, y, pos.x, pos.y) < minDistance) {
                        validPosition = false;
                        break;
                    }
                }

                // Check external collision (e.g. walls)
                if (validPosition && collisionCheck) {
                    if (collisionCheck(x, y)) {
                        validPosition = false;
                    }
                }

                attempts++;
            }

            if (validPosition) {
                placedPositions.push({x, y});
                
                const isTree = Math.random() > 0.4; // 60% trees, 40% bushes
                
                let plant;
                if (isTree) {
                    const type = Phaser.Utils.Array.GetRandom(treeTypes);
                    plant = new Tree({ scene: this.scene, x, y, texture: type });
                } else {
                    const type = Phaser.Utils.Array.GetRandom(bushTypes);
                    plant = new Bush({ scene: this.scene, x, y, texture: type });
                }
                
                this.plants.add(plant);
            }
        }
    }
    
    public getPlantsGroup() {
        return this.plants;
    }
}
