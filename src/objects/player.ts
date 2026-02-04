import Phaser from 'phaser';
import { CharacterDefinition } from '../types/character';
import { CharacterVisual } from './character-visual';

export class Player extends Phaser.GameObjects.Container {
    private visual: CharacterVisual;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private wasd!: {
        up: Phaser.Input.Keyboard.Key;
        down: Phaser.Input.Keyboard.Key;
        left: Phaser.Input.Keyboard.Key;
        right: Phaser.Input.Keyboard.Key;
    };
    private speed: number = 200;

    constructor(scene: Phaser.Scene, x: number, y: number, definition: CharacterDefinition) {
        super(scene, x, y);

        // Visual
        this.visual = new CharacterVisual(scene, 0, 0, definition);
        this.add(this.visual);

        // Physics
        scene.physics.add.existing(this);
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setSize(40, 60); // Approximate size, maybe adjustable
        body.setOffset(-20, -30); // Center the body
        body.setCollideWorldBounds(true);

        // Input
        if (scene.input.keyboard) {
            this.cursors = scene.input.keyboard.createCursorKeys();
            this.wasd = scene.input.keyboard.addKeys({
                up: Phaser.Input.Keyboard.KeyCodes.W,
                down: Phaser.Input.Keyboard.KeyCodes.S,
                left: Phaser.Input.Keyboard.KeyCodes.A,
                right: Phaser.Input.Keyboard.KeyCodes.D
            }) as any;
        }

        // Add to scene
        scene.add.existing(this);
    }

    update() {
        this.handleMovement();
        this.handleRotation();
    }

    private handleMovement() {
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setVelocity(0);

        let velocityX = 0;
        let velocityY = 0;

        if (this.cursors.left.isDown || this.wasd.left.isDown) {
            velocityX = -this.speed;
        } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
            velocityX = this.speed;
        }

        if (this.cursors.up.isDown || this.wasd.up.isDown) {
            velocityY = -this.speed;
        } else if (this.cursors.down.isDown || this.wasd.down.isDown) {
            velocityY = this.speed;
        }

        // Normalize velocity for diagonal movement
        if (velocityX !== 0 && velocityY !== 0) {
            velocityX *= 0.707; // 1 / sqrt(2)
            velocityY *= 0.707;
        }

        body.setVelocity(velocityX, velocityY);
    }

    private handleRotation() {
        // Calculate angle to mouse pointer
        const pointer = this.scene.input.activePointer;
        // Adjust pointer position for camera
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
    }
}
