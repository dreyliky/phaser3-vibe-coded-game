import Phaser from 'phaser';
import { BodyType, CharacterDefinition, FaceType, Gender, HairType } from '../types/character';
import { HAIR_COLORS, SKIN_COLORS, DEPTHS } from '../config/constants';
import { TextSelector, ColorSelector, CharacterVisual } from '../objects';
import { Button } from '../objects/ui/button';
import { cursorSystem } from '../systems/cursor-system';

export class CharacterCreator extends Phaser.Scene {
    private character: CharacterDefinition;
    
    // Visual
    private characterVisual!: CharacterVisual;

    // Cursor
    private cursor!: Phaser.GameObjects.Sprite;
    private onCursorChanged!: (key: string) => void;
    private cursorOffset = { x: 0, y: 0 };

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

        // Initialize Cursor
        this.input.setDefaultCursor('none');
        this.cursor = this.add.sprite(0, 0, 'cursor_none')
            .setDepth(DEPTHS.UI.CURSOR)
            .setScale(0.5)
            .setOrigin(0, 0);

        this.onCursorChanged = (key: string) => {
             if (!this.cursor || !this.cursor.scene) return;
            this.cursor.setTexture(key);
            if (key === 'cursor_target') {
                this.cursor.setOrigin(0.5, 0.5);
                this.cursorOffset = { x: 0, y: 0 };
            } else {
                this.cursor.setOrigin(0, 0);
                this.cursorOffset = { x: -9, y: -6 };
            }
        };

        cursorSystem.on('cursor-changed', this.onCursorChanged);
        cursorSystem.setUIWindowOpen(false); 
        cursorSystem.setWeaponType('none');
        this.onCursorChanged(cursorSystem.getCurrentCursorKey());

        this.events.on('shutdown', () => {
             if (this.onCursorChanged) {
                 cursorSystem.off('cursor-changed', this.onCursorChanged);
             }
        });

        // Background
        this.add.rectangle(0, 0, width, height, 0x222222).setOrigin(0);

        // Character Visual
        this.characterVisual = new CharacterVisual({
            scene: this,
            x: width * 0.5,
            y: height * 0.4,
            definition: this.character
        });
        this.add.existing(this.characterVisual);

        // Controls
        const startY = height * 0.65;
        const gapY = 40;

        this.genderSelector = new TextSelector({
            scene: this,
            x: width * 0.5,
            y: startY,
            label: 'Gender',
            options: Object.values(Gender),
            initialValue: this.character.gender,
            onChange: (val) => { 
                this.character.gender = val as Gender; 
                this.onGenderChange();
                this.updateCharacter(); 
            }
        });

        this.bodySelector = new TextSelector({
            scene: this,
            x: width * 0.5,
            y: startY + gapY,
            label: 'Body',
            options: this.getAvailableBodyTypes(),
            initialValue: this.character.bodyType,
            onChange: (val) => { 
                this.character.bodyType = val as BodyType; 
                this.onBodyTypeChange();
                this.updateCharacter(); 
            }
        });

        new TextSelector({
            scene: this,
            x: width * 0.5,
            y: startY + gapY * 2,
            label: 'Hair',
            options: Object.values(HairType),
            initialValue: this.character.hairType,
            onChange: (val) => { this.character.hairType = val as HairType; this.updateCharacter(); }
        });

        // Colors
        new ColorSelector({
            scene: this,
            x: width * 0.3,
            y: startY + gapY * 3.5,
            label: 'Skin',
            colors: SKIN_COLORS,
            initialValue: this.character.skinColor,
            onChange: (val) => { this.character.skinColor = val; this.updateCharacter(); }
        });

        new ColorSelector({
            scene: this,
            x: width * 0.7,
            y: startY + gapY * 3.5,
            label: 'Hair Color',
            colors: HAIR_COLORS,
            initialValue: this.character.hairColor,
            onChange: (val) => { this.character.hairColor = val; this.updateCharacter(); }
        });

        // Play Button
        new Button({
            scene: this,
            x: width * 0.5,
            y: height - 50,
            text: 'Play',
            onClick: () => this.startGame(),
            style: {
                fontSize: '24px',
                textColor: '#00ff00',
                backgroundColor: 0x333333,
                textColorOver: '#ffff00',
                padding: { x: 20, y: 10 }
            }
        });

        // Back Button
        new Button({
            scene: this,
            x: 90,
            y: 60,
            text: '< Back',
            onClick: () => this.scene.start('MainMenu'),
            style: {
                fontSize: '20px',
                backgroundColor: 0x000000,
                padding: { x: 10, y: 5 },
                backgroundAlpha: 0 // Optional: make it transparent if desired, but 0x000000 is fine
            }
        });
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

    update() {
        if (this.cursor) {
            const pointer = this.input.activePointer;
            this.cursor.setPosition(pointer.x + this.cursorOffset.x, pointer.y + this.cursorOffset.y);
        }
    }
}
