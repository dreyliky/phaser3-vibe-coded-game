import Phaser from 'phaser';

export class TextureGenerator {
    static createSquareTexture(scene: Phaser.Scene, key: string, color: number, size: number = 32) {
        if (scene.textures.exists(key)) return;

        const graphics = scene.make.graphics({ x: 0, y: 0 });
        graphics.fillStyle(color, 1);
        graphics.fillRect(0, 0, size, size);
        graphics.lineStyle(2, 0x000000);
        graphics.strokeRect(0, 0, size, size);
        
        graphics.generateTexture(key, size, size);
    }
}
