import Phaser from 'phaser';
import PhaserRaycaster from 'phaser-raycaster';
import { Boot, CharacterCreator, Game, HUD, MainMenu, WallTestScene, MapEditor, MapSelectionScene, MapEditorOverlay } from '../scenes';

export const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: 'app',
    backgroundColor: '#000000',
    scene: [Boot, MainMenu, CharacterCreator, Game, HUD, WallTestScene, MapEditor, MapSelectionScene, MapEditorOverlay],
    plugins: {
        scene: [
            {
                key: 'PhaserRaycaster',
                plugin: PhaserRaycaster,
                mapping: 'raycasterPlugin'
            }
        ]
    },
    scale: {
        mode: Phaser.Scale.RESIZE,
        width: window.innerWidth,
        height: window.innerHeight,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { x: 0, y: 0 },
            debug: false,
            fps: 120
        }
    },
    render: {
        pixelArt: false,
        antialias: true,
        roundPixels: true
    },
    fps: {
        target: 120,
        forceSetTimeOut: false
    }
};
