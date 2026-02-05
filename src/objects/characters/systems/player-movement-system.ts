import Phaser from 'phaser';

export class PlayerMovementSystem {
    private scene: Phaser.Scene;
    private body: Phaser.Physics.Arcade.Body;
    private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    private wasd: {
        up: Phaser.Input.Keyboard.Key;
        down: Phaser.Input.Keyboard.Key;
        left: Phaser.Input.Keyboard.Key;
        right: Phaser.Input.Keyboard.Key;
    };
    private speed: number = 200;

    constructor(scene: Phaser.Scene, body: Phaser.Physics.Arcade.Body) {
        this.scene = scene;
        this.body = body;

        if (scene.input.keyboard) {
            this.cursors = scene.input.keyboard.createCursorKeys();
            this.wasd = scene.input.keyboard.addKeys({
                up: Phaser.Input.Keyboard.KeyCodes.W,
                down: Phaser.Input.Keyboard.KeyCodes.S,
                left: Phaser.Input.Keyboard.KeyCodes.A,
                right: Phaser.Input.Keyboard.KeyCodes.D
            }) as any;
        } else {
            // Fallback or error handling if keyboard is not available
            this.cursors = {} as any;
            this.wasd = {} as any;
        }
    }

    public update() {
        this.handleMovement();
    }

    private handleMovement() {
        this.body.setVelocity(0);

        let velocityX = 0;
        let velocityY = 0;

        if (this.cursors.left?.isDown || this.wasd.left?.isDown) {
            velocityX = -this.speed;
        } else if (this.cursors.right?.isDown || this.wasd.right?.isDown) {
            velocityX = this.speed;
        }

        if (this.cursors.up?.isDown || this.wasd.up?.isDown) {
            velocityY = -this.speed;
        } else if (this.cursors.down?.isDown || this.wasd.down?.isDown) {
            velocityY = this.speed;
        }

        // Normalize velocity for diagonal movement
        if (velocityX !== 0 && velocityY !== 0) {
            velocityX *= 0.707; // 1 / sqrt(2)
            velocityY *= 0.707;
        }

        this.body.setVelocity(velocityX, velocityY);
    }
}
