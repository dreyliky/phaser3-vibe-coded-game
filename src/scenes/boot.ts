import Phaser from 'phaser';
import { BodyType, FaceType, Gender, HairType } from '../types/character';
import { ASSETS, SPRITE_KEYS } from '../config/constants';
import { TextureGenerator } from '../utils/texture-generator';

export class Boot extends Phaser.Scene {
    constructor() {
        super('Boot');
    }

    preload() {
        // Generate Ammo Textures
        TextureGenerator.createSquareTexture({ scene: this, key: SPRITE_KEYS.AMMO.LIGHT, color: 0x00ff00, size: 16 });
        TextureGenerator.createSquareTexture({ scene: this, key: SPRITE_KEYS.AMMO.STANDARD, color: 0xffff00, size: 16 });
        TextureGenerator.createSquareTexture({ scene: this, key: SPRITE_KEYS.AMMO.HEAVY, color: 0xff0000, size: 16 });
        TextureGenerator.createSquareTexture({ scene: this, key: SPRITE_KEYS.AMMO.BUCKSHOT, color: 0xffaa00, size: 16 });

        // Generate Weapon Textures
        TextureGenerator.createCircleTexture({ scene: this, key: SPRITE_KEYS.WEAPONS.HANDS, color: 0xffffff, radius: 8 }); // White circle for hands

        // Generate Pixel Texture
        TextureGenerator.createSquareTexture({ scene: this, key: SPRITE_KEYS.UI.PIXEL, color: 0xffffff, size: 1 });


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
        this.load.image(SPRITE_KEYS.WEAPONS.ASSAULT_RIFLE, ASSETS.SPRITES.WEAPONS.ASSAULT_RIFLE);
        this.load.image(SPRITE_KEYS.WEAPONS.AUTOPISTOL, ASSETS.SPRITES.WEAPONS.AUTOPISTOL);
        this.load.image(SPRITE_KEYS.WEAPONS.SHOTGUN, ASSETS.SPRITES.WEAPONS.SHOTGUN);

        // Load Projectiles
        this.load.image(SPRITE_KEYS.PROJECTILES.HEAVY, ASSETS.SPRITES.PROJECTILES.HEAVY);
        this.load.image(SPRITE_KEYS.PROJECTILES.STANDARD, ASSETS.SPRITES.PROJECTILES.STANDARD);
        this.load.image(SPRITE_KEYS.PROJECTILES.BUCKSHOT, ASSETS.SPRITES.PROJECTILES.BUCKSHOT);
        this.load.image(SPRITE_KEYS.PROJECTILES.LIGHT, ASSETS.SPRITES.PROJECTILES.LIGHT);

        // Load Cursors
        this.load.image(SPRITE_KEYS.UI.CURSOR.NONE, ASSETS.SPRITES.UI.CURSOR.NONE);
        this.load.image(SPRITE_KEYS.UI.CURSOR.HAND, ASSETS.SPRITES.UI.CURSOR.HAND);
        this.load.image(SPRITE_KEYS.UI.CURSOR.SWORD, ASSETS.SPRITES.UI.CURSOR.SWORD);
        this.load.image(SPRITE_KEYS.UI.CURSOR.TARGET, ASSETS.SPRITES.UI.CURSOR.TARGET);
        
        // Load Environment
        this.load.image(SPRITE_KEYS.TERRAIN.SAND, ASSETS.SPRITES.TERRAIN.SURFACES.SAND);
        this.load.image(SPRITE_KEYS.TERRAIN.CAVE, ASSETS.SPRITES.TERRAIN.SURFACES.ROUGH_HEWN_ROCK);
        this.load.image(SPRITE_KEYS.TERRAIN.SOIL, ASSETS.SPRITES.TERRAIN.SURFACES.SOIL);
        this.load.image(SPRITE_KEYS.TERRAIN.ANCIENT_CONCRETE, ASSETS.SPRITES.TERRAIN.SURFACES.ANCIENT_CONCRETE);
        this.load.image(SPRITE_KEYS.TERRAIN.BROKEN_ASPHALT, ASSETS.SPRITES.TERRAIN.SURFACES.BROKEN_ASPHALT);
        this.load.image(SPRITE_KEYS.TERRAIN.MUD, ASSETS.SPRITES.TERRAIN.SURFACES.MUD);
        this.load.image(SPRITE_KEYS.TERRAIN.SMOOTH_STONE, ASSETS.SPRITES.TERRAIN.SURFACES.SMOOTH_STONE);
        this.load.image(SPRITE_KEYS.TERRAIN.SOIL_RICH, ASSETS.SPRITES.TERRAIN.SURFACES.SOIL_RICH);
        this.load.image(SPRITE_KEYS.TERRAIN.TILE_STONE, ASSETS.SPRITES.TERRAIN.SURFACES.TILE_STONE);
        this.load.image(SPRITE_KEYS.TERRAIN.WOOD, ASSETS.SPRITES.TERRAIN.SURFACES.WOOD_FLOOR);

        // Load Plants - Bushes/Cacti
        this.load.image(SPRITE_KEYS.PLANTS.AGAVE, ASSETS.SPRITES.PLANTS.AGAVE);
        this.load.image(SPRITE_KEYS.PLANTS.PINCUSHION_CACTUS, ASSETS.SPRITES.PLANTS.PINCUSHION_CACTUS);
        this.load.image(SPRITE_KEYS.PLANTS.SAGUARO_CACTUS, ASSETS.SPRITES.PLANTS.SAGUARO_CACTUS);
        this.load.image(SPRITE_KEYS.PLANTS.SAGUARO_CACTUS_LEAFLESS, ASSETS.SPRITES.PLANTS.SAGUARO_CACTUS_LEAFLESS);
        this.load.image(SPRITE_KEYS.PLANTS.ALOCASIA_A, ASSETS.SPRITES.PLANTS.ALOCASIA_A);
        this.load.image(SPRITE_KEYS.PLANTS.BERRY_BUSH_A, ASSETS.SPRITES.PLANTS.BERRY_BUSH_A);
        this.load.image(SPRITE_KEYS.PLANTS.BUSH_A, ASSETS.SPRITES.PLANTS.BUSH_A);
        this.load.image(SPRITE_KEYS.PLANTS.GRASS_A, ASSETS.SPRITES.PLANTS.GRASS_A);
        this.load.image(SPRITE_KEYS.PLANTS.GRASS_B, ASSETS.SPRITES.PLANTS.GRASS_B);

        // Load Plants - Trees
        this.load.image(SPRITE_KEYS.PLANTS.TREE_BAMBOO, ASSETS.SPRITES.PLANTS.TREE_BAMBOO);
        this.load.image(SPRITE_KEYS.PLANTS.TREE_CECROPIA, ASSETS.SPRITES.PLANTS.TREE_CECROPIA);
        this.load.image(SPRITE_KEYS.PLANTS.TREE_PALM, ASSETS.SPRITES.PLANTS.TREE_PALM);
        this.load.image(SPRITE_KEYS.PLANTS.TREE_TEAK, ASSETS.SPRITES.PLANTS.TREE_TEAK);
        this.load.image(SPRITE_KEYS.PLANTS.TREE_WILLOW, ASSETS.SPRITES.PLANTS.TREE_WILLOW);
        this.load.image(SPRITE_KEYS.PLANTS.TREE_BIRCH_A, ASSETS.SPRITES.PLANTS.TREE_BIRCH_A);
        this.load.image(SPRITE_KEYS.PLANTS.TREE_OAK_IMMATURE, ASSETS.SPRITES.PLANTS.TREE_OAK_IMMATURE);

        // Load Walls
        this.load.spritesheet(SPRITE_KEYS.WALLS.ROCK, ASSETS.SPRITES.BUILDINGS.LINKED.ROCK_ATLAS, { frameWidth: 80, frameHeight: 80 });
        this.load.spritesheet(SPRITE_KEYS.WALLS.BRICKS, ASSETS.SPRITES.BUILDINGS.LINKED.BRICKS_ATLAS, { frameWidth: 80, frameHeight: 80 });
        this.load.spritesheet(SPRITE_KEYS.WALLS.PLANKS, ASSETS.SPRITES.BUILDINGS.LINKED.PLANKS_ATLAS, { frameWidth: 80, frameHeight: 80 });
        this.load.spritesheet(SPRITE_KEYS.WALLS.SMOOTH, ASSETS.SPRITES.BUILDINGS.LINKED.SMOOTH_ATLAS, { frameWidth: 80, frameHeight: 80 });
    }

    create() {
        this.input.setDefaultCursor('none');
        // Go to Main Menu
        this.scene.start('MainMenu');
    }
}
