import Phaser from 'phaser';
import { config } from './config/config';

const game = new Phaser.Game(config);

(window as any).game = game;

// Force disable system cursor globally
document.body.style.cursor = 'none';

window.addEventListener('focus', () => {
    document.body.style.cursor = 'none';
    if (game.canvas) {
        game.canvas.style.cursor = 'none';
    }
});

window.addEventListener('blur', () => {
    // Optional: show cursor when out of focus if desired, but user asked to disable it
    // keeping it none or letting browser handle it.
    // Usually browser shows it when out of context, but let's try to enforce 'none' if possible,
    // though browser usually overrides this when outside the window.
    // But when clicking back, 'focus' should trigger.
});

// Also ensure canvas has none
if (game.canvas) {
    game.canvas.style.cursor = 'none';
}
