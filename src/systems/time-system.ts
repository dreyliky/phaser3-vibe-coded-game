import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/constants';

export class TimeSystem {
    private totalGameSeconds: number = 0; // Total accumulated "game seconds"
    
    // Config
    
    constructor(_scene: Phaser.Scene) {
        // Start at 12:00 PM
        this.totalGameSeconds = 12 * 3600;
    }

    public update(delta: number) {
        // delta is in ms
        const realSeconds = delta / 1000;
        
        // 1 game hour = REAL_SECONDS_PER_GAME_HOUR
        // 3600 game seconds = REAL_SECONDS_PER_GAME_HOUR
        // Game Speed Multiplier = 3600 / REAL_SECONDS_PER_GAME_HOUR
        // e.g. 10 real sec = 1 hour (3600 game sec) => 360x speed
        
        const gameSecondsPerRealSecond = 3600 / GAME_CONFIG.REAL_SECONDS_PER_GAME_HOUR;
        this.totalGameSeconds += realSeconds * gameSecondsPerRealSecond;
    }

    public getGameTime() {
        const totalSeconds = this.totalGameSeconds;
        const daySeconds = totalSeconds % (24 * 3600);
        const hours = Math.floor(daySeconds / 3600);
        const minutes = Math.floor((daySeconds % 3600) / 60);
        
        return { hours, minutes, totalSeconds };
    }

    // Returns a value from 0 (Midnight) to 1 (Next Midnight)
    public getDayProgress(): number {
        return (this.totalGameSeconds % (24 * 3600)) / (24 * 3600);
    }
    
    public getSunPosition(): { x: number, y: number, intensity: number } {
        // Simple sun movement: East to West? Or circular?
        // Let's assume Top-Down view, sun moves in an arc "above" the world.
        // Actually for 2D shadows, usually we assume sun moves from East (Right) to West (Left) or similar.
        // Let's map time 0..24 to an angle.
        // 6:00 = Sunrise (Left/East), 12:00 = Noon (Top/South), 18:00 = Sunset (Right/West)
        // Wait, standard map: N=Up, S=Down, E=Right, W=Left.
        // Sun rises in East (Right) -> Noon (Up/South?? No, usually Noon is overhead, shadows short).
        // Let's simulate a light source moving in a circle around the center.
        // 6 AM: Sun at (1, 0) [Right], Shadows point Left.
        // 12 PM: Sun at (0, -1) [Top], Shadows point Down. (Or Sun at Z-height, shadows small).
        // 18 PM: Sun at (-1, 0) [Left], Shadows point Right.
        // 0 AM: Sun at (0, 1) [Bottom], Night.
        
        // Let's simplify:
        // Angle 0 = 6 AM (Right)
        // Angle -90 = 12 PM (Top)
        // Angle -180 = 18 PM (Left)
        // Angle -270 = 0 AM (Bottom)
        
        const dayProgress = this.getDayProgress(); // 0..1 (0 = 00:00, 0.25 = 06:00, 0.5 = 12:00)
        
        // 06:00 is 0.25. We want angle 0 at 0.25.
        // 12:00 is 0.50. We want angle -PI/2 at 0.50.
        // Angle = (Progress - 0.25) * 2PI ?
        // (0.25 - 0.25) * 2PI = 0. Correct.
        // (0.50 - 0.25) * 2PI = 0.25 * 2PI = 0.5PI (90 deg). We want -90? Or just consistent rotation.
        // Let's just say Sun rotates clockwise or counter-clockwise.
        // Let's make it mimic real sun: Rises East (Right), Sets West (Left).
        // So at 6AM (0.25), Sun is Right (1,0). Shadows point Left (-1, 0).
        // At 12PM (0.50), Sun is Top (0, -1). Shadows point Down (0, 1).
        // At 18PM (0.75), Sun is Left (-1, 0). Shadows point Right (1, 0).
        
        // Angle calculation:
        // We want 0 rads at 0.25.
        // We want -PI/2 at 0.5.
        // We want -PI at 0.75.
        // Delta = -PI/2 per 0.25 progress.
        // Slope = -2PI.
        // Angle = (Progress - 0.25) * -2PI.
        
        const angle = (dayProgress - 0.25) * Math.PI * 2;
        
        // Intensity: 1 at Noon, 0 at Sunrise/Sunset.
        // Noon = 0.5. Sunrise = 0.25. Sunset = 0.75.
        // We can use a sine wave.
        // Sin(Progress * 2PI - PI/2) -> -1 at 0, 0 at 0.25, 1 at 0.5, 0 at 0.75.
        // Map -1..1 to Intensity logic.
        // Actually we want brightness.
        // 0..0.25 (Night -> Sunrise): Dark to Light
        // 0.25..0.75 (Day): Light
        // 0.75..1 (Sunset -> Night): Light to Dark
        
        const rawIntensity = -Math.cos(dayProgress * Math.PI * 2); 
        // 0.0 -> -1 (Dark)
        // 0.25 -> 0 (Twilight)
        // 0.5 -> 1 (Bright)
        // 0.75 -> 0 (Twilight)
        // 1.0 -> -1 (Dark)
        
        // Clamp intensity for game logic (0 to 1)
        const intensity = Math.max(0, rawIntensity);
        
        return {
            x: Math.cos(angle),
            y: Math.sin(angle),
            intensity: intensity
        };
    }
}
