import Phaser from 'phaser';
import { BodyType, CharacterDefinition, FaceType, Gender, HairType, HAIR_COLORS, SKIN_COLORS } from '../types/character';
import { TextSelector, ColorSelector } from '../objects/ui';

export class CharacterCreator extends Phaser.Scene {
    private character: CharacterDefinition;
    
    // Sprites
    private bodySprite!: Phaser.GameObjects.Sprite;
    private headSprite!: Phaser.GameObjects.Sprite;
    private hairSprite!: Phaser.GameObjects.Sprite;
    private container!: Phaser.GameObjects.Container;

    constructor() {
        super('CharacterCreator');
        this.character = {
            gender: Gender.Male,
            bodyType: BodyType.Male,
            faceType: FaceType.Average_Normal,
            hairType: HairType.Mohawk,
            skinColor: SKIN_COLORS[0],
            hairColor: HAIR_COLORS[2]
        };
    }

    create() {
        const { width, height } = this.scale;

        // Background
        this.add.rectangle(0, 0, width, height, 0x222222).setOrigin(0);

        // Character Container (Center)
        this.container = this.add.container(width * 0.5, height * 0.4);
        
        // Sprites (Order matters: Body -> Head -> Hair)
        this.bodySprite = this.add.sprite(0, 0, 'body_Male_south');
        this.headSprite = this.add.sprite(0, -42, 'head_Male_Average_Normal_south');
        this.hairSprite = this.add.sprite(0, -52, 'hair_Mohawk_south');

        this.container.add([this.bodySprite, this.headSprite, this.hairSprite]);

        // Controls
        const startY = height * 0.65;
        const gapY = 40;

        new TextSelector(this, width * 0.5, startY, 'Gender', Object.values(Gender), 
            this.character.gender, 
            (val) => { this.character.gender = val as Gender; this.updateCharacter(); });

        new TextSelector(this, width * 0.5, startY + gapY, 'Body', Object.values(BodyType), 
            this.character.bodyType, 
            (val) => { this.character.bodyType = val as BodyType; this.updateCharacter(); });

        new TextSelector(this, width * 0.5, startY + gapY * 2, 'Face', Object.values(FaceType), 
            this.character.faceType, 
            (val) => { this.character.faceType = val as FaceType; this.updateCharacter(); });

        new TextSelector(this, width * 0.5, startY + gapY * 3, 'Hair', Object.values(HairType), 
            this.character.hairType, 
            (val) => { this.character.hairType = val as HairType; this.updateCharacter(); });

        // Colors
        new ColorSelector(this, width * 0.3, startY + gapY * 4.5, 'Skin', SKIN_COLORS, 
            this.character.skinColor,
            (val) => { this.character.skinColor = val; this.updateCharacter(); });

        new ColorSelector(this, width * 0.7, startY + gapY * 4.5, 'Hair Color', HAIR_COLORS, 
            this.character.hairColor,
            (val) => { this.character.hairColor = val; this.updateCharacter(); });

        // Generate Output Button
        const btn = this.add.text(width * 0.5, height - 50, 'Generate Output', {
            fontSize: '24px',
            color: '#00ff00',
            backgroundColor: '#333333',
            padding: { x: 20, y: 10 }
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.generateOutput())
        .on('pointerover', () => btn.setStyle({ fill: '#ffff00' }))
        .on('pointerout', () => btn.setStyle({ fill: '#00ff00' }));

        // Back Button
        this.add.text(50, 50, '< Back', { fontSize: '20px', color: '#ffffff' })
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.scene.start('MainMenu'));

        this.updateCharacter();
    }

    private updateCharacter() {
        // Texture Updates
        const bodyKey = `body_${this.character.bodyType}_south`;
        const headKey = `head_${this.character.gender}_${this.character.faceType}_south`;
        const hairKey = `hair_${this.character.hairType}_south`;

        // Check if textures exist (fallback to prevent crash)
        if (this.textures.exists(bodyKey)) this.bodySprite.setTexture(bodyKey);
        if (this.textures.exists(headKey)) this.headSprite.setTexture(headKey);
        
        if (this.textures.exists(hairKey)) {
            this.hairSprite.setVisible(true);
            this.hairSprite.setTexture(hairKey);
        } else {
            this.hairSprite.setVisible(false);
        }

        // Tints
        const skinTint = Phaser.Display.Color.HexStringToColor(this.character.skinColor).color;
        const hairTint = Phaser.Display.Color.HexStringToColor(this.character.hairColor).color;

        this.bodySprite.setTint(skinTint);
        this.headSprite.setTint(skinTint);
        this.hairSprite.setTint(hairTint);

        // Adjust positions based on body type (simple adjustment)
        if (this.character.bodyType === BodyType.Hulk) {
            this.headSprite.y = -37;
            this.hairSprite.y = -47;
        } else {
            this.headSprite.y = -32;
            this.hairSprite.y = -42;
        }
    }

    private generateOutput() {
        console.log('--- Character Definition ---');
        console.log(JSON.stringify(this.character, null, 2));
        console.log('---------------------------');
        alert('Character definition logged to console!');
    }
}
