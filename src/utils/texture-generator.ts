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

    static createCircleTexture(scene: Phaser.Scene, key: string, color: number, radius: number = 10) {
        if (scene.textures.exists(key)) return;

        const size = radius * 2;
        const graphics = scene.make.graphics({ x: 0, y: 0 });
        graphics.fillStyle(color, 1);
        graphics.fillCircle(radius, radius, radius);
        graphics.lineStyle(1, 0x000000);
        graphics.strokeCircle(radius, radius, radius);

        graphics.generateTexture(key, size, size);
    }
}
