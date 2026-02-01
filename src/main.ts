import Phaser from 'phaser';

class HelloWorldScene extends Phaser.Scene {
    constructor() {
        super('HelloWorldScene');
    }

    create() {
        const { width, height } = this.scale;
        
        // Add text "Hello World" centered on the screen
        const text = this.add.text(width * 0.5, height * 0.5, 'Hello World', {
            fontSize: '64px',
            color: '#ffffff',
            fontFamily: 'Arial'
        });
        
        text.setOrigin(0.5);
    }
}

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'app',
    backgroundColor: '#000000',
    scene: [HelloWorldScene],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

new Phaser.Game(config);
