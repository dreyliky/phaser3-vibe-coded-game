import Phaser from 'phaser';

export class Game extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    create() {
        const { width, height } = this.scale;
        
        const text = this.add.text(width * 0.5, height * 0.5, 'Hello World', {
            fontSize: '64px',
            color: '#ffffff',
            fontFamily: 'Arial'
        });
        
        text.setOrigin(0.5);
    }
}
