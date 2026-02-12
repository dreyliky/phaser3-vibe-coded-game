import Phaser from 'phaser';
import { TimeSystem } from './time-system';
import { LightingSystem } from './lighting-system';
import { DEPTHS } from '../config/constants';

export class ShadowSystem {
    private scene: Phaser.Scene;
    private timeSystem: TimeSystem;
    private lightingSystem: LightingSystem | undefined;
    private shadowGroup: Phaser.GameObjects.Group;
    private worldItemsGroup?: Phaser.GameObjects.Group | Phaser.Physics.Arcade.Group;
    
    // Map objects to their shadows
    private shadowMap: Map<Phaser.GameObjects.GameObject, Phaser.GameObjects.Image> = new Map();
    
    // Config for shadow lengths (scale factors)
    // Adjusted for better visibility
    private readonly SHADOW_LENGTHS = {
        'Wall': 2.6 / 2,
        'Tree': 1.95 / 2,
        'Player': 1.04 / 2,
        'Bush': 0.65 / 2,
        'Item': 0.39 / 2
    };

    constructor(scene: Phaser.Scene, timeSystem: TimeSystem, lightingSystem?: LightingSystem, worldItemsGroup?: Phaser.GameObjects.Group | Phaser.Physics.Arcade.Group) {
        this.scene = scene;
        this.timeSystem = timeSystem;
        this.lightingSystem = lightingSystem;
        this.worldItemsGroup = worldItemsGroup;
        this.shadowGroup = this.scene.add.group();
        // this.shadowGroup.setDepth(1); // Removed: Shadows set their own depth relative to parents
        
        this.createShadowTexture();
    }

    private createShadowTexture() {
        if (this.scene.textures.exists('shadow_blob')) return;
        
        const size = 64;
        const texture = this.scene.textures.createCanvas('shadow_blob', size, size);
        if (texture) {
            const context = texture.getContext();
            const gradient = context.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
            gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            
            context.fillStyle = gradient;
            context.fillRect(0, 0, size, size);
            texture.refresh();
        }
    }

    public registerObject(obj: Phaser.GameObjects.GameObject, type: 'Wall' | 'Tree' | 'Player' | 'Bush' | 'Item') {
        if (this.shadowMap.has(obj)) return;
        
        // Grass has no shadow
        if (obj.constructor.name === 'Grass') {
            return;
        }

        // Added TileSprite support
        const isSprite = obj instanceof Phaser.GameObjects.Sprite || obj instanceof Phaser.GameObjects.Image;
        const isTileSprite = obj instanceof Phaser.GameObjects.TileSprite;
        const isContainer = obj instanceof Phaser.GameObjects.Container;

        if (!isSprite && !isContainer && !isTileSprite) {
            return; // Can only attach shadows to visual objects
        }
        
        let shadow: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite;
        
        if (isSprite) {
            const sprite = obj as Phaser.GameObjects.Sprite | Phaser.GameObjects.Image;
            shadow = this.scene.add.image(sprite.x, sprite.y, sprite.texture.key, sprite.frame ? sprite.frame.name : undefined);
            shadow.setTint(0x000000);
            shadow.setAlpha(0.5);
            shadow.setDepth((sprite.depth || 0) + DEPTHS.SHADOW.OFFSET); 
            shadow.setOrigin(0.5, 1); // Pivot at bottom center
        } else {
            // Container OR TileSprite -> Use generic blob
            // For TileSprite, using the texture key would result in the full texture, not the tiled area.
            // So we use the blob and will scale it to match dimensions.
            if (!this.scene.textures.exists('shadow_blob')) {
                this.createShadowTexture();
            }
            shadow = this.scene.add.image(obj.x, obj.y, 'shadow_blob');
            shadow.setTint(0x000000);
            shadow.setAlpha(0.5);
            shadow.setDepth((obj.depth || 0) + DEPTHS.SHADOW.OFFSET);
            shadow.setOrigin(0.5, 1); // Pivot at bottom center
        }

        // Store metadata
        shadow.setData('type', type);
        shadow.setData('parent', obj);
        
        this.shadowGroup.add(shadow);
        this.shadowMap.set(obj, shadow);
    }
    
    public update() {
        // Register new items
        if (this.worldItemsGroup) {
            this.worldItemsGroup.getChildren().forEach(item => {
                if (item.active && !this.shadowMap.has(item)) {
                    this.registerObject(item, 'Item');
                }
            });
        }

        const { x: sunX, y: sunY } = this.timeSystem.getSunPosition();
        
        const sunAngle = Math.atan2(sunY, sunX);
        const sunShadowAngle = sunAngle + Math.PI; // Opposite direction
        
        // Sun Height proxy:
        // Top (-90) is Midnight (if Sun from Bottom is Noon).
        // Bottom (90) is Noon.
        // So we want Height = 1 at 90 deg.
        const sunHeight = Math.sin(sunAngle);  
        
        let activeShadowAngle = sunShadowAngle;
        let activeShadowScale = 0;
        let activeAlpha = 0.5;

        // Day/Night Logic
        if (sunHeight < 0) {
            // Night time
            
            // Check Flashlight
            if (this.lightingSystem && this.lightingSystem.isFlashlightActive) {
                // Flashlight is active during night
                // We will handle shadows per-object below relative to flashlight
                // So here we set defaults that will be overridden or used as base
                activeAlpha = 0; // Default invisible unless illuminated
            } else {
                this.shadowGroup.setAlpha(0);
                return;
            }
        } else {
             // Day time
             activeShadowScale = Math.max(0.5, (1 - sunHeight) * 3); // Lower sun = longer shadow
             activeAlpha = 0.5;
        }
        
        // Prepare Flashlight Data once per frame
        let isFlashlightOn = false;
        let flashlightAngle = 0;
        let player: Phaser.GameObjects.Sprite | Phaser.GameObjects.Container | undefined;
        
        if (this.lightingSystem && this.lightingSystem.isFlashlightActive) {
            isFlashlightOn = true;
            // Use Screen Space angle from LightingSystem (it uses getFlashlightAngle which uses screen space now)
            // Wait, getFlashlightAngle in LightingSystem returns angle based on screen coords.
            // But here we need World Space angle because our objects are in World Space.
            // Screen Angle == World Angle for top-down 2D without rotation.
            flashlightAngle = this.lightingSystem.getFlashlightAngle();
            player = this.lightingSystem.playerEntity;
        }

        this.shadowMap.forEach((shadow, parentObj) => {
            // Cast to Transform & Image/Container to access properties
            const parent = parentObj as Phaser.GameObjects.Container | Phaser.GameObjects.Sprite | Phaser.GameObjects.Image | Phaser.GameObjects.TileSprite;
            
            // Check if parent is dead/destroyed
            if (!parent.active) {
                shadow.destroy();
                this.shadowMap.delete(parent);
                return;
            }

            // Sync position & Dimensions
            // Use physics body if available for accurate "feet" position and width
            let parentBottomX = parent.x;
            let parentBottomY = parent.y;
            let parentWidth = 64; // Default
            let parentHeight = 64; // Default

            if (parent.body instanceof Phaser.Physics.Arcade.Body) {
                // Body position is top-left
                parentBottomX = parent.body.center.x;
                parentBottomY = parent.body.bottom;
                parentWidth = parent.body.width;
                parentHeight = parent.body.height;
            } else if (parent instanceof Phaser.GameObjects.Sprite || parent instanceof Phaser.GameObjects.Image || parent instanceof Phaser.GameObjects.TileSprite) {
                 // Fallback for non-physics sprites
                 const sprite = parent as Phaser.GameObjects.Sprite; // Cast to access displayHeight
                 if (sprite.originY === 0.5) {
                    parentBottomY += sprite.displayHeight / 2;
                 } else if (sprite.originY === 0) {
                    parentBottomY += sprite.displayHeight;
                 }
                 parentWidth = sprite.displayWidth;
                 parentHeight = sprite.displayHeight;
            }
            
            if (parent instanceof Phaser.GameObjects.Sprite || parent instanceof Phaser.GameObjects.Image) {
                 const sprite = parent as Phaser.GameObjects.Sprite;
                 shadow.setDepth((sprite.depth || 0) - 1);
            } else {
                 shadow.setDepth((parent.depth || 0) - 1);
            }
            // Force shadow to be above terrain but below objects
            // Terrain max is -82. Player/Objects > 0.
            // Safe zone: -70.
            shadow.setDepth(DEPTHS.SHADOW.SAFE_LAYER);
            
            shadow.setPosition(parentBottomX, parentBottomY);
            
            // Calculate final shadow properties
            let currentAngle = activeShadowAngle;
            let currentScale = activeShadowScale;
            let currentAlpha = activeAlpha;

            // Flashlight Logic
            if (isFlashlightOn && player) {
                // Calculate vector from player to object
                const objCenterX = parentBottomX;
                const objCenterY = parentBottomY - parentHeight / 2;
                
                const dx = objCenterX - player.x;
                const dy = objCenterY - player.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                const angleToObj = Math.atan2(dy, dx);
                
                // Normalize angles to -PI..PI
                let angleDiff = angleToObj - flashlightAngle;
                while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
                
                const coneHalfWidth = Math.PI / 4 / 2 + 0.2; // slightly forgiving
                const radius = 300;
                
                const isIlluminated = Math.abs(angleDiff) < coneHalfWidth && dist < radius && dist > 10;

                if (sunHeight < 0) {
                    // NIGHT TIME: Only show shadow if illuminated
                    if (isIlluminated) {
                         currentAlpha = 0.6;
                         currentAngle = angleToObj; // Shadow points away from light source (Player) -> Object -> Shadow
                         currentScale = 1.0; 
                    } else {
                        currentAlpha = 0;
                    }
                } else {
                    // DAY TIME: Hide shadow if illuminated (washed out)
                    if (isIlluminated) {
                        // Fade out the sun shadow
                        currentAlpha = 0; 
                    }
                }
            }

            shadow.setRotation(currentAngle + Math.PI/2); 
            // Apply gradient alpha: Top (Head) -> 0, Bottom (Feet) -> currentAlpha
            shadow.setAlpha(0, 0, currentAlpha, currentAlpha);
            
            // Length
            const type = shadow.getData('type') as keyof typeof this.SHADOW_LENGTHS;
            const typeMultiplier = this.SHADOW_LENGTHS[type] || 1;
            
            // Length should be proportional to object height, but scaled by the "sun factor"
            // If we assume length multiplier is "how many times the height", then:
            const targetShadowLength = parentHeight * currentScale * typeMultiplier;
            
            // Apply transform
            // X Scale: Match parent width. 
            // shadow_blob is 64px wide.
            // If shadow is from texture (Sprite), it matches sprite texture size. 
            // But we want it to match sprite DISPLAY size.
            
            const shadowTexture = shadow.texture;
            const shadowSourceWidth = shadowTexture.source[0].width;
            const shadowSourceHeight = shadowTexture.source[0].height;

            const scaleX = (parentWidth / shadowSourceWidth) * 0.7;
            
            // Y Scale: Stretch to target length
            const scaleY = targetShadowLength / shadowSourceHeight;

            shadow.setScale(scaleX, scaleY); 
            
            // Ensure shadow is visible (depth)
            // Debug: if shadow invisible, maybe z-index?
            // shadow.setDepth(100); 
        });
    }
}
