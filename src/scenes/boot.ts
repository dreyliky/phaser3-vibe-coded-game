import Phaser from 'phaser';
import { BodyType, FaceType, Gender, HairType } from '../types/character';
import { ASSETS } from '../config/constants';
import { TextureGenerator } from '../utils/texture-generator';

export class Boot extends Phaser.Scene {
    constructor() {
        super('Boot');
    }

    preload() {
        // Generate Ammo Textures
        TextureGenerator.createSquareTexture(this, 'ammo_light', 0x00ff00, 16);
        TextureGenerator.createSquareTexture(this, 'ammo_standard', 0xffff00, 16);
        TextureGenerator.createSquareTexture(this, 'ammo_heavy', 0xff0000, 16);
        TextureGenerator.createSquareTexture(this, 'ammo_buckshot', 0xffaa00, 16);

        // Generate Weapon Textures
        TextureGenerator.createCircleTexture(this, 'weapon_hands', 0xffffff, 8); // White circle for hands


        const basePath = ASSETS.SPRITES.HUMANLIKE_BASE_PATH;
        const directions = ['south', 'north', 'east'];

        // Load Bodies
        Object.values(BodyType).forEach(type => {
            directions.forEach(dir => {
                const key = `body_${type}_${dir}`;
                const path = `${basePath}/Bodies/Naked_${type}_${dir}.png`;
                this.load.image(key, path);
            });
        });

        // Load Heads
        Object.values(Gender).forEach(gender => {
            Object.values(FaceType).forEach(face => {
                directions.forEach(dir => {
                    // Skip invalid combinations if necessary, but Phaser handles missing files gracefully (mostly)
                    // Construct filename: e.g., Male_Average_Normal_south.png
                    // FaceType is like "Average_Normal"
                    
                    const filename = `${gender}_${face}_${dir}.png`;
                    const key = `head_${gender}_${face}_${dir}`;
                    const path = `${basePath}/Heads/${gender}/${filename}`;
                    
                    this.load.image(key, path);
                });
            });
        });

        // Load Hairs
        Object.values(HairType).forEach(hair => {
            directions.forEach(dir => {
                const key = `hair_${hair}_${dir}`;
                const path = `${basePath}/Hairs/${hair}_${dir}.png`;
                this.load.image(key, path);
            });
        });

        // Load Weapons
        this.load.image('weapon_assault_rifle', 'assets/sprites/things/item/equipment/WeaponRanged/AssaultRifle.png');
        this.load.image('weapon_pistol', 'assets/sprites/things/item/equipment/WeaponRanged/Autopistol.png');
        this.load.image('weapon_shotgun', 'assets/sprites/things/item/equipment/WeaponRanged/Shotgun.png');

        // Load Projectiles
        this.load.image('projectile_heavy', 'assets/sprites/things/projectile/Bullet_Big.png');
        this.load.image('projectile_standard', 'assets/sprites/things/projectile/Bullet_Medium.png');
        this.load.image('projectile_buckshot', 'assets/sprites/things/projectile/Bullet_Shotgun.png');
        this.load.image('projectile_light', 'assets/sprites/things/projectile/Bullet_Small.png');
        
        // Load Environment
        this.load.image('background_sand', 'assets/sprites/things/projectile/Sand.png');

        // Load Plants - Bushes/Cacti
        const plantPath = 'assets/sprites/things/plant';
        this.load.image('plant_agave', `${plantPath}/Agave.png`);
        this.load.image('plant_pincushion_cactus', `${plantPath}/PincushionCactus.png`);
        this.load.image('plant_saguaro_cactus', `${plantPath}/SaguaroCactus.png`);
        this.load.image('plant_saguaro_cactus_leafless', `${plantPath}/SaguaroCactus_Leafless.png`);

        // Load Plants - Trees
        this.load.image('plant_tree_bamboo', `${plantPath}/TreeBamboo.png`);
        this.load.image('plant_tree_cecropia', `${plantPath}/TreeCecropia.png`);
        this.load.image('plant_tree_palm', `${plantPath}/TreePalm.png`);
        this.load.image('plant_tree_teak', `${plantPath}/TreeTeak.png`);
        this.load.image('plant_tree_willow', `${plantPath}/TreeWillow.png`);

        // Load Walls
        const wallPath = 'assets/sprites/things/buildings/linked';
        this.load.spritesheet('wall_rock', `${wallPath}/Rock_Atlas.png`, { frameWidth: 80, frameHeight: 80 });
        this.load.spritesheet('wall_bricks', `${wallPath}/Wall_Atlas_Bricks.png`, { frameWidth: 80, frameHeight: 80 });
        this.load.spritesheet('wall_planks', `${wallPath}/Wall_Atlas_Planks.png`, { frameWidth: 80, frameHeight: 80 });
        this.load.spritesheet('wall_smooth', `${wallPath}/Wall_Atlas_Smooth.png`, { frameWidth: 80, frameHeight: 80 });
    }

    create() {
        // Go to Wall Test Scene
        this.scene.start('WallTestScene');
    }
}
