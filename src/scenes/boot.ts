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
        TextureGenerator.createSquareTexture({ scene: this, key: 'ammo_light', color: 0x00ff00, size: 16 });
        TextureGenerator.createSquareTexture({ scene: this, key: 'ammo_standard', color: 0xffff00, size: 16 });
        TextureGenerator.createSquareTexture({ scene: this, key: 'ammo_heavy', color: 0xff0000, size: 16 });
        TextureGenerator.createSquareTexture({ scene: this, key: 'ammo_buckshot', color: 0xffaa00, size: 16 });

        // Generate Weapon Textures
        TextureGenerator.createCircleTexture({ scene: this, key: 'weapon_hands', color: 0xffffff, radius: 8 }); // White circle for hands


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
        this.load.image('weapon_assault_rifle', ASSETS.SPRITES.WEAPONS.ASSAULT_RIFLE);
        this.load.image('weapon_pistol', ASSETS.SPRITES.WEAPONS.AUTOPISTOL);
        this.load.image('weapon_shotgun', ASSETS.SPRITES.WEAPONS.SHOTGUN);

        // Load Projectiles
        this.load.image('projectile_heavy', ASSETS.SPRITES.PROJECTILES.HEAVY);
        this.load.image('projectile_standard', ASSETS.SPRITES.PROJECTILES.STANDARD);
        this.load.image('projectile_buckshot', ASSETS.SPRITES.PROJECTILES.BUCKSHOT);
        this.load.image('projectile_light', ASSETS.SPRITES.PROJECTILES.LIGHT);

        // Load Cursors
        this.load.image('cursor_none', ASSETS.SPRITES.UI.CURSOR.NONE);
        this.load.image('cursor_hand', ASSETS.SPRITES.UI.CURSOR.HAND);
        this.load.image('cursor_sword', ASSETS.SPRITES.UI.CURSOR.SWORD);
        this.load.image('cursor_target', ASSETS.SPRITES.UI.CURSOR.TARGET);
        
        // Load Environment
        this.load.image('background_sand', ASSETS.SPRITES.TERRAIN.SURFACES.SAND);
        this.load.image('floor_cave', ASSETS.SPRITES.TERRAIN.SURFACES.ROUGH_HEWN_ROCK);
        this.load.image('floor_soil', ASSETS.SPRITES.TERRAIN.SURFACES.SOIL);
        this.load.image('floor_ancient_concrete', ASSETS.SPRITES.TERRAIN.SURFACES.ANCIENT_CONCRETE);
        this.load.image('floor_broken_asphalt', ASSETS.SPRITES.TERRAIN.SURFACES.BROKEN_ASPHALT);
        this.load.image('floor_mud', ASSETS.SPRITES.TERRAIN.SURFACES.MUD);
        this.load.image('floor_smooth_stone', ASSETS.SPRITES.TERRAIN.SURFACES.SMOOTH_STONE);
        this.load.image('floor_soil_rich', ASSETS.SPRITES.TERRAIN.SURFACES.SOIL_RICH);
        this.load.image('floor_tile_stone', ASSETS.SPRITES.TERRAIN.SURFACES.TILE_STONE);
        this.load.image('floor_wood', ASSETS.SPRITES.TERRAIN.SURFACES.WOOD_FLOOR);

        // Load Plants - Bushes/Cacti
        this.load.image('plant_agave', ASSETS.SPRITES.PLANTS.AGAVE);
        this.load.image('plant_pincushion_cactus', ASSETS.SPRITES.PLANTS.PINCUSHION_CACTUS);
        this.load.image('plant_saguaro_cactus', ASSETS.SPRITES.PLANTS.SAGUARO_CACTUS);
        this.load.image('plant_saguaro_cactus_leafless', ASSETS.SPRITES.PLANTS.SAGUARO_CACTUS_LEAFLESS);
        this.load.image('plant_alocasia_a', ASSETS.SPRITES.PLANTS.ALOCASIA_A);
        this.load.image('plant_berry_bush_a', ASSETS.SPRITES.PLANTS.BERRY_BUSH_A);
        this.load.image('plant_bush_a', ASSETS.SPRITES.PLANTS.BUSH_A);
        this.load.image('plant_grass_a', ASSETS.SPRITES.PLANTS.GRASS_A);
        this.load.image('plant_grass_b', ASSETS.SPRITES.PLANTS.GRASS_B);

        // Load Plants - Trees
        this.load.image('plant_tree_bamboo', ASSETS.SPRITES.PLANTS.TREE_BAMBOO);
        this.load.image('plant_tree_cecropia', ASSETS.SPRITES.PLANTS.TREE_CECROPIA);
        this.load.image('plant_tree_palm', ASSETS.SPRITES.PLANTS.TREE_PALM);
        this.load.image('plant_tree_teak', ASSETS.SPRITES.PLANTS.TREE_TEAK);
        this.load.image('plant_tree_willow', ASSETS.SPRITES.PLANTS.TREE_WILLOW);
        this.load.image('plant_tree_birch_a', ASSETS.SPRITES.PLANTS.TREE_BIRCH_A);
        this.load.image('plant_tree_oak_immature', ASSETS.SPRITES.PLANTS.TREE_OAK_IMMATURE);

        // Load Walls
        this.load.spritesheet('wall_rock', ASSETS.SPRITES.BUILDINGS.LINKED.ROCK_ATLAS, { frameWidth: 80, frameHeight: 80 });
        this.load.spritesheet('wall_bricks', ASSETS.SPRITES.BUILDINGS.LINKED.BRICKS_ATLAS, { frameWidth: 80, frameHeight: 80 });
        this.load.spritesheet('wall_planks', ASSETS.SPRITES.BUILDINGS.LINKED.PLANKS_ATLAS, { frameWidth: 80, frameHeight: 80 });
        this.load.spritesheet('wall_smooth', ASSETS.SPRITES.BUILDINGS.LINKED.SMOOTH_ATLAS, { frameWidth: 80, frameHeight: 80 });
    }

    create() {
        this.input.setDefaultCursor('none');
        // Go to Main Menu
        this.scene.start('MainMenu');
    }
}
