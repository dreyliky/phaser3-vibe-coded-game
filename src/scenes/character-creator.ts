import Phaser from 'phaser';
import { BodyType, CharacterDefinition, FaceType, Gender, HairType } from '../types/character';
import { HAIR_COLORS, SKIN_COLORS } from '../config/constants';
import { TextSelector, ColorSelector, CharacterVisual } from '../objects';

export class CharacterCreator extends Phaser.Scene {
    private character: CharacterDefinition;
    
    // Visual
    private characterVisual!: CharacterVisual;

    // UI
    private genderSelector!: TextSelector;
    private bodySelector!: TextSelector;

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

        // Character Visual
        this.characterVisual = new CharacterVisual(this, width * 0.5, height * 0.4, this.character);
        this.add.existing(this.characterVisual);

        // Controls
        const startY = height * 0.65;
        const gapY = 40;

        this.genderSelector = new TextSelector(this, width * 0.5, startY, 'Gender', Object.values(Gender), 
            this.character.gender, 
            (val) => { 
                this.character.gender = val as Gender; 
                this.onGenderChange();
                this.updateCharacter(); 
            });

        this.bodySelector = new TextSelector(this, width * 0.5, startY + gapY, 'Body', this.getAvailableBodyTypes(), 
            this.character.bodyType, 
            (val) => { 
                this.character.bodyType = val as BodyType; 
                this.onBodyTypeChange();
                this.updateCharacter(); 
            });

        new TextSelector(this, width * 0.5, startY + gapY * 2, 'Hair', Object.values(HairType), 
            this.character.hairType, 
            (val) => { this.character.hairType = val as HairType; this.updateCharacter(); });

        // Colors
        new ColorSelector(this, width * 0.3, startY + gapY * 3.5, 'Skin', SKIN_COLORS, 
            this.character.skinColor,
            (val) => { this.character.skinColor = val; this.updateCharacter(); });

        new ColorSelector(this, width * 0.7, startY + gapY * 3.5, 'Hair Color', HAIR_COLORS, 
            this.character.hairColor,
            (val) => { this.character.hairColor = val; this.updateCharacter(); });

        // Play Button
        const btn = this.add.text(width * 0.5, height - 50, 'Play', {
            fontSize: '24px',
            color: '#00ff00',
            backgroundColor: '#333333',
            padding: { x: 20, y: 10 }
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.startGame())
        .on('pointerover', () => btn.setStyle({ fill: '#ffff00' }))
        .on('pointerout', () => btn.setStyle({ fill: '#00ff00' }));

        // Back Button
        this.add.text(50, 50, '< Back', { fontSize: '20px', color: '#ffffff' })
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.scene.start('MainMenu'));
    }

    private getAvailableBodyTypes(): string[] {
        const allTypes = Object.values(BodyType);
        if (this.character.gender === Gender.Male) {
            return allTypes.filter(t => t !== BodyType.Female);
        } else {
            return allTypes.filter(t => t !== BodyType.Male);
        }
    }

    private onGenderChange() {
        const availableTypes = this.getAvailableBodyTypes();
        
        if (!availableTypes.includes(this.character.bodyType)) {
            if (this.character.gender === Gender.Male) {
                this.character.bodyType = BodyType.Male;
            } else {
                this.character.bodyType = BodyType.Female;
            }
            this.onBodyTypeChange();
        }
        
        this.bodySelector.setOptions(availableTypes, this.character.bodyType);
    }

    private onBodyTypeChange() {
        switch (this.character.bodyType) {
            case BodyType.Fat:
                this.character.faceType = FaceType.Average_Wide;
                break;
            case BodyType.Female:
                this.character.faceType = FaceType.Average_Normal;
                if (this.character.gender !== Gender.Female) {
                    this.character.gender = Gender.Female;
                    this.genderSelector.setOptions(Object.values(Gender), Gender.Female);
                    this.onGenderChange();
                }
                break;
            case BodyType.Hulk:
                this.character.faceType = FaceType.Average_Normal;
                break;
            case BodyType.Male:
                this.character.faceType = FaceType.Average_Normal;
                if (this.character.gender !== Gender.Male) {
                    this.character.gender = Gender.Male;
                    this.genderSelector.setOptions(Object.values(Gender), Gender.Male);
                    this.onGenderChange();
                }
                break;
            case BodyType.Thin:
                this.character.faceType = FaceType.Narrow_Normal;
                break;
        }
    }

    private updateCharacter() {
        this.characterVisual.updateDefinition(this.character);
    }

    private startGame() {
        this.scene.start('GameScene', { character: this.character });
    }
}
