import Phaser from 'phaser';
import { MainMenu } from './scenes/MainMenu';
import { Game } from './scenes/Game';

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'app',
    backgroundColor: '#000000',
    scene: [MainMenu, Game],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

new Phaser.Game(config);
