import Phaser from 'phaser';
import { Player } from '../objects';
import { BodyType, CharacterDefinition, FaceType, Gender, HairType } from '../types/character';
import { HAIR_COLORS, SKIN_COLORS } from '../config/constants';
import { AssaultRifle, Pistol, Shotgun, LightAmmo, StandardAmmo, HeavyAmmo, BuckshotAmmo } from '../objects/items';
import { inventorySystem, InventoryItem, ItemInteractionSystem, MapGenerator } from '../systems';
import { DEBUG_SETTINGS } from '../config/constants';
import { HUD } from './hud';
import { MapService } from '../services/map-service';
import { BaseRockWall, BaseBrickWall, BasePlankWall, BaseSmoothWall } from '../objects/walls/wall-types';
import { Tree, Bush } from '../objects/plants';
import { TerrainSystem, TerrainType } from '../systems/terrain-system';

export class Game extends Phaser.Scene {
    public player!: Player;
    private characterDefinition!: CharacterDefinition;
    public itemInteractionSystem!: ItemInteractionSystem;
    private mapGenerator!: MapGenerator;
    private mapId?: string;
    
    private wallsGroup!: Phaser.GameObjects.Group | Phaser.Physics.Arcade.StaticGroup;
    private plantsGroup!: Phaser.GameObjects.Group;

    constructor() {
        super('GameScene');
    }

    init(data: { character: CharacterDefinition, mapId?: string }) {
        this.characterDefinition = data.character || {
            gender: Gender.Male,
            bodyType: BodyType.Male,
            faceType: FaceType.Average_Normal,
            hairType: HairType.Mohawk,
            skinColor: SKIN_COLORS[0],
            hairColor: HAIR_COLORS[2]
        };
        this.mapId = data.mapId;
    }

    create() {
        const { width, height } = this.scale;
        
        this.scale.on('resize', this.handleResize, this);

        // Launch HUD
        this.scene.launch('HUD');

        // Create Player (temporarily at center, will move if spawn point exists)
        this.player = new Player({
            scene: this,
            x: width * 0.5,
            y: height * 0.5,
            definition: this.characterDefinition
        });

        // Initialize Item Interaction System
        this.itemInteractionSystem = new ItemInteractionSystem(this, this.player);

        if (this.mapId) {
            this.loadCustomMap(this.mapId);
        } else {
            this.generateProceduralMap();
        }
        
        // Camera setup
        this.cameras.main.startFollow(this.player, true); 
        this.cameras.main.setZoom(1);
        this.cameras.main.setRoundPixels(true);

        // Apply Debug Settings
        if (DEBUG_SETTINGS.SHOW_COLLIDERS) {
            this.physics.world.createDebugGraphic();
            this.physics.world.drawDebug = true;
        }

        // Colliders
        this.physics.add.collider(this.player, this.plantsGroup);
        this.physics.add.collider(this.player, this.wallsGroup);

        // Input for interaction
        if (this.input.keyboard) {
            this.input.keyboard.on('keydown-E', () => this.itemInteractionSystem.tryPickupItem());

            // Drop Weapon (G)
            this.input.keyboard.on('keydown-G', () => {
                const hudScene = this.scene.get('HUD') as HUD;
                if (hudScene && hudScene.quickBar) {
                    const selectedIndex = hudScene.quickBar.getSelectedIndex();
                    if (selectedIndex !== -1) {
                        const item = inventorySystem.dropItem('quick', selectedIndex);
                        if (item) {
                            this.itemInteractionSystem.spawnPlayerDrop(item.item, item.quantity, item.extraData);
                        }
                    }
                }
            });
        }

        // Listen for HUD events (weapon equip/unequip)
        const hudScene = this.scene.get('HUD') as HUD;
        if (hudScene) {
            hudScene.events.on('weapon-equipped', (item: InventoryItem) => {
                this.player.equipWeapon(item);
            });
            hudScene.events.on('weapon-unequipped', () => {
                this.player.unequipWeapon();
            });
        }

        // Sync initial weapon state
        const initialQuickItem = inventorySystem.getItemAt('quick', 0);
        if (initialQuickItem) {
            this.player.equipWeapon(initialQuickItem);
        }
    }

    private generateProceduralMap() {
        const mapWidth = 4000;
        const mapHeight = 4000;
        this.physics.world.setBounds(0, 0, mapWidth, mapHeight);
        this.cameras.main.setBounds(0, 0, mapWidth, mapHeight);

        this.mapGenerator = new MapGenerator(this);
        this.mapGenerator.generateMap(mapWidth, mapHeight);
        
        this.wallsGroup = this.mapGenerator.getWalls();
        this.plantsGroup = this.mapGenerator.getVegetation();

        // Spawn test items
        this.itemInteractionSystem.spawnItem({ item: new AssaultRifle(), x: 300, y: 300 });
        this.itemInteractionSystem.spawnItem({ item: new Pistol(), x: 400, y: 300 });
        this.itemInteractionSystem.spawnItem({ item: new Shotgun(), x: 500, y: 300 });
        
        this.itemInteractionSystem.spawnItem({ item: new StandardAmmo(), x: 350, y: 400, quantity: 60 });
        this.itemInteractionSystem.spawnItem({ item: new LightAmmo(), x: 450, y: 400, quantity: 100 });
        this.itemInteractionSystem.spawnItem({ item: new BuckshotAmmo(), x: 550, y: 400, quantity: 40 });
    }

    private loadCustomMap(id: string) {
        const map = MapService.getMap(id);
        if (!map) {
            console.error('Map not found, falling back to procedural');
            this.generateProceduralMap();
            return;
        }

        this.physics.world.setBounds(0, 0, map.width, map.height);
        this.cameras.main.setBounds(0, 0, map.width, map.height);

        // Groups
        this.wallsGroup = this.physics.add.staticGroup();
        this.plantsGroup = this.physics.add.staticGroup();

        // Terrain
        const tileSize = 80;
        const gridW = Math.ceil(map.width / tileSize);
        const gridH = Math.ceil(map.height / tileSize);
        const terrainSystem = new TerrainSystem({ scene: this, width: gridW, height: gridH, tileSize });

        map.objects.forEach(obj => {
            // Surfaces
            if (obj.type === 'tile') {
                const type = this.getTerrainType(obj.key);
                const gx = Math.floor(obj.x / tileSize);
                const gy = Math.floor(obj.y / tileSize);
                if (type) terrainSystem.setTerrain(gx, gy, type);
            }
            // Walls
            else if (obj.type === 'wall') {
                const WallClass = this.getWallClass(obj.key);
                if (WallClass) {
                    const wall = new WallClass({ scene: this, x: obj.x, y: obj.y });
                    this.wallsGroup.add(wall);
                }
            }
            // Plants
            else if (obj.type === 'plant') {
                const PlantClass = this.getPlantClass(obj.key);
                if (PlantClass) {
                    // Tree/Bush constructors accept BasePlantOptions { scene, x, y, texture }
                    const plant = new PlantClass({ scene: this, x: obj.x, y: obj.y, texture: obj.key });
                    this.plantsGroup.add(plant);
                }
            }
            // Items (new 'object' with subtype 'weapon'/'ammo')
            else if (obj.type === 'object' && (obj.key.startsWith('weapon_') || obj.key.startsWith('ammo_'))) {
                const ItemClass = this.getItemClass(obj.key);
                if (ItemClass) {
                    this.itemInteractionSystem.spawnItem({ item: new ItemClass(), x: obj.x, y: obj.y });
                }
            }
            // Spawn Point (new 'object' with subtype 'misc')
            else if (obj.type === 'object' && obj.key === 'spawn_point') {
                this.player.setPosition(obj.x, obj.y);
            }
        });

        terrainSystem.render();
    }

    private getTerrainType(key: string): TerrainType | null {
        switch (key) {
            case 'terrain_soil': return TerrainType.SOIL;
            case 'terrain_soil_rich': return TerrainType.SOIL_RICH;
            case 'terrain_mud': return TerrainType.MUD;
            case 'terrain_rock': return TerrainType.ROCK;
            case 'terrain_smooth_stone': return TerrainType.SMOOTH_STONE;
            case 'terrain_ancient_concrete': return TerrainType.ANCIENT_CONCRETE;
            case 'terrain_broken_asphalt': return TerrainType.BROKEN_ASPHALT;
            case 'terrain_tile_stone': return TerrainType.TILE_STONE;
            case 'terrain_wood_floor': return TerrainType.WOOD_FLOOR;
            case 'terrain_sand': return TerrainType.SAND;
            default: return null;
        }
    }

    private getWallClass(key: string): any {
        switch (key) {
            case 'wall_rock': return BaseRockWall;
            case 'wall_bricks': return BaseBrickWall;
            case 'wall_planks': return BasePlankWall;
            case 'wall_smooth': return BaseSmoothWall;
            default: return null;
        }
    }

    private getPlantClass(key: string): any {
        if (key.startsWith('plant_tree_')) return Tree;
        if (key.startsWith('plant_')) return Bush;
        
        switch (key) {
            case 'tree': return Tree;
            case 'bush': return Bush;
            default: return null;
        }
    }

    private getItemClass(key: string): any {
        switch (key) {
            case 'weapon_assault_rifle': return AssaultRifle;
            case 'weapon_pistol': return Pistol;
            case 'weapon_shotgun': return Shotgun;
            case 'ammo_light': return LightAmmo;
            case 'ammo_standard': return StandardAmmo;
            case 'ammo_heavy': return HeavyAmmo;
            case 'ammo_buckshot': return BuckshotAmmo;
            default: return null;
        }
    }

    update() {
        this.player.update();
        this.itemInteractionSystem.update();
    }

    handleResize(_gameSize: Phaser.Structs.Size) {
        // No-op
    }
}
