import Phaser from 'phaser';
import { BodyType, CharacterDefinition } from '../../types/character';

export interface CharacterVisualOptions {
    scene: Phaser.Scene;
    x: number;
    y: number;
    definition: CharacterDefinition;
}

export class CharacterVisual extends Phaser.GameObjects.Container {
    private bodySprite: Phaser.GameObjects.Sprite;
    private headSprite: Phaser.GameObjects.Sprite;
    private hairSprite: Phaser.GameObjects.Sprite;
    private definition: CharacterDefinition;
    private direction: 'north' | 'south' | 'east' | 'west' = 'south';

    constructor(options: CharacterVisualOptions) {
        super(options.scene, options.x, options.y);
        this.definition = options.definition;
        
        const scene = options.scene;

        // Create sprites
        this.bodySprite = scene.add.sprite(0, 0, '');
        this.headSprite = scene.add.sprite(0, 0, '');
        this.hairSprite = scene.add.sprite(0, 0, '');

        // Add to container (Order matters: Body -> Head -> Hair)
        this.add([this.bodySprite, this.headSprite, this.hairSprite]);

        this.updateVisuals();
    }

    public updateDefinition(definition: CharacterDefinition) {
        this.definition = definition;
        this.updateVisuals();
    }

    public setDirection(direction: 'north' | 'south' | 'east' | 'west') {
        if (this.direction !== direction) {
            this.direction = direction;
            this.updateVisuals();
        }
    }

    private updateVisuals() {
        const dirSuffix = this.direction === 'west' ? 'east' : this.direction;
        const isFlipX = this.direction === 'west';
        
        // Opacity check for North
        // const alpha = this.direction === 'north' ? 0.8 : 1;
        // this.setAlpha(alpha);
        this.setAlpha(1);

        // Texture Keys
        const bodyKey = `body_${this.definition.bodyType}_${dirSuffix}`;
        const headKey = `head_${this.definition.gender}_${this.definition.faceType}_${dirSuffix}`;
        const hairKey = `hair_${this.definition.hairType}_${dirSuffix}`;

        // Set Textures
        this.setTextureSafe(this.bodySprite, bodyKey);
        this.setTextureSafe(this.headSprite, headKey);
        
        if (this.scene.textures.exists(hairKey)) {
            this.hairSprite.setVisible(true);
            this.hairSprite.setTexture(hairKey);
        } else {
            this.hairSprite.setVisible(false);
        }

        // Tints
        const skinTint = Phaser.Display.Color.HexStringToColor(this.definition.skinColor).color;
        const hairTint = Phaser.Display.Color.HexStringToColor(this.definition.hairColor).color;

        this.bodySprite.setTint(skinTint);
        this.headSprite.setTint(skinTint);
        this.hairSprite.setTint(hairTint);

        // Flip X for West
        this.bodySprite.setFlipX(isFlipX);
        this.headSprite.setFlipX(isFlipX);
        this.hairSprite.setFlipX(isFlipX);

        // Adjust positions based on body type
        // Note: Using logic from CharacterCreator
        let headY = -32;
        let hairY = -42;

        if (this.definition.bodyType === BodyType.Hulk) {
            headY = -37;
            hairY = -47;
        }

        this.headSprite.y = headY;
        this.hairSprite.y = hairY;
        
        // Sorting Order for North direction
        // When facing north (back to camera), hair should usually cover head, and head covers body.
        // This is the same as South.
        // However, if there are specific layering issues, we might need to re-sort.
        // For now, assuming standard Body < Head < Hair works for all.
    }

    private setTextureSafe(sprite: Phaser.GameObjects.Sprite, key: string) {
        if (this.scene.textures.exists(key)) {
            sprite.setTexture(key);
        }
    }
}
