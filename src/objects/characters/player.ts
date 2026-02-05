import Phaser from 'phaser';
import { CharacterDefinition } from '../../types/character';
import { CharacterVisual } from './character-visual';
import { InventoryItem } from '../../systems';
import { PlayerCombatSystem } from './systems/player-combat-system';
import { PlayerMovementSystem } from './systems/player-movement-system';

export class Player extends Phaser.GameObjects.Container {
    private visual: CharacterVisual;
    private movementSystem: PlayerMovementSystem;
    private combatSystem: PlayerCombatSystem;
    
    constructor(scene: Phaser.Scene, x: number, y: number, definition: CharacterDefinition) {
        super(scene, x, y);

        // Visual
        this.visual = new CharacterVisual(scene, 0, 0, definition);
        this.add(this.visual);

        // Physics
        scene.physics.add.existing(this);
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setSize(40, 30); 
        body.setOffset(-20, 6); // Moved down by 6px (was 0)
        body.setCollideWorldBounds(true);

        // Systems
        const skinColorInt = parseInt(definition.skinColor.replace('#', '0x'), 16);
        this.combatSystem = new PlayerCombatSystem(scene, this, skinColorInt);
        this.movementSystem = new PlayerMovementSystem(scene, body);

        // Add to scene
        scene.add.existing(this);
    }

    update() {
        this.movementSystem.update();
        this.combatSystem.update();
        this.handleVisualRotation();
        // Sort by bottom of the player (feet)
        this.setDepth(this.y + 30);
    }

    public equipWeapon(item: InventoryItem) {
        this.combatSystem.equipWeapon(item);
    }

    public unequipWeapon() {
        this.combatSystem.unequipWeapon();
    }

    public getAmmoInfo() {
        return this.combatSystem.getAmmoInfo();
    }

    private handleVisualRotation() {
        // Calculate angle to mouse pointer
        const pointer = this.scene.input.activePointer;
        const worldPoint = pointer.positionToCamera(this.scene.cameras.main) as Phaser.Math.Vector2;
        
        const angle = Phaser.Math.Angle.Between(this.x, this.y, worldPoint.x, worldPoint.y);
        const deg = Phaser.Math.RadToDeg(angle);

        // Determine direction based on angle
        // East: -45 to 45
        // South: 45 to 135
        // West: 135 to 180 OR -180 to -135
        // North: -135 to -45

        let direction: 'north' | 'south' | 'east' | 'west' = 'south';

        if (deg >= -45 && deg < 45) {
            direction = 'east';
        } else if (deg >= 45 && deg < 135) {
            direction = 'south';
        } else if (deg >= -135 && deg < -45) {
            direction = 'north';
        } else {
            direction = 'west';
        }

        this.visual.setDirection(direction);
        this.combatSystem.setDirection(direction);
    }
}
