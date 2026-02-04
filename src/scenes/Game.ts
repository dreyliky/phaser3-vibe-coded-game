import Phaser from 'phaser';
import { Player } from '../objects';
import { BodyType, CharacterDefinition, FaceType, Gender, HairType } from '../types/character';
import { HAIR_COLORS, SKIN_COLORS } from '../config/constants';

export class Game extends Phaser.Scene {
    private player!: Player;
    private characterDefinition!: CharacterDefinition;

    constructor() {
        super('GameScene');
    }

    init(data: { character: CharacterDefinition }) {
        this.characterDefinition = data.character || {
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
        
        // Create Player
        this.player = new Player(this, width * 0.5, height * 0.5, this.characterDefinition);

        // Add some instructions
        this.add.text(10, 10, 'WASD to move\nMouse to aim', {
            fontSize: '16px',
            color: '#ffffff'
        }).setScrollFactor(0);
    }

    update() {
        this.player.update();
    }
}
