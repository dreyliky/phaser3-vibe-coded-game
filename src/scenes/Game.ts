import Phaser from 'phaser';
import { Player } from '../objects';
import { BodyType, CharacterDefinition, FaceType, Gender, HairType } from '../types/character';
import { HAIR_COLORS, SKIN_COLORS } from '../config/constants';
import { AssaultRifle, Pistol, Shotgun, LightAmmo, StandardAmmo, HeavyAmmo, BuckshotAmmo } from '../objects/items';
import { EDITOR_OBJECTS } from '../config/editor-objects';
import { Hands } from '../objects/items/weapons/hands';
import { BaseRangeWeapon } from '../objects/items/weapons/base-range-weapon';
import { BaseMeleeWeapon } from '../objects/items/weapons/base-melee-weapon';
import { inventorySystem, InventoryItem, ItemInteractionSystem, TimeSystem, LightingSystem, ShadowSystem } from '../systems';
import { cursorSystem } from '../systems/cursor-system';
import { ChunkSystem } from '../systems/chunk-system';
import { DEBUG_SETTINGS } from '../config/constants';
import { HUD } from './hud';
import { MapService } from '../services/map-service';
import { BaseRockWall, BaseBrickWall, BasePlankWall, BaseSmoothWall } from '../objects/walls/wall-types';
import { Tree, Bush } from '../objects/plants';
import { TerrainSystem, TerrainType } from '../systems/terrain-system';
import { Damageable } from '../types/damageable';
import { FogOfWarSystem } from '../systems/fog-of-war';
import { MapObjectKey } from '../types/map';

export class Game extends Phaser.Scene {
    public player!: Player;
    private characterDefinition!: CharacterDefinition;
    public itemInteractionSystem!: ItemInteractionSystem;
    private chunkSystem!: ChunkSystem;
    public fogOfWarSystem!: FogOfWarSystem;
    private timeSystem!: TimeSystem;
    private lightingSystem!: LightingSystem;
    private shadowSystem!: ShadowSystem;
    private mapId?: string;
    
    public wallsGroup!: Phaser.GameObjects.Group | Phaser.Physics.Arcade.StaticGroup;
    public plantsGroup!: Phaser.GameObjects.Group | Phaser.Physics.Arcade.StaticGroup;
    
    private bulletsGroup!: Phaser.GameObjects.Group;
    private treeHitboxesGroup!: Phaser.GameObjects.Group;

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
        // Reset Cursor System state to prevent stuck hover states from previous scenes
        cursorSystem.reset();

        const { width, height } = this.scale;
        
        this.scale.on('resize', this.handleResize, this);

        // Physics Groups
        this.bulletsGroup = this.physics.add.group({
            classType: Phaser.Physics.Arcade.Sprite,
            maxSize: 100
        });

        this.treeHitboxesGroup = this.physics.add.group({
            classType: Phaser.Physics.Arcade.Sprite,
            immovable: true
        });

        this.wallsGroup = this.physics.add.staticGroup();
        this.plantsGroup = this.physics.add.staticGroup();

        // Launch HUD
        this.scene.launch('HUD');

        // Create Player (temporarily at center, will move if spawn point exists)
        this.player = new Player({
            scene: this,
            x: width * 0.5,
            y: height * 0.5,
            definition: this.characterDefinition,
            bulletsGroup: this.bulletsGroup
        });

        // Initialize Item Interaction System
        this.itemInteractionSystem = new ItemInteractionSystem(this, this.player);

        if (this.mapId) {
            this.loadCustomMap(this.mapId);
        } else {
            // Infinite map bounds
            // Set a very large world bound to allow exploration in all directions (including negative)
            const worldSize = 4000000; // 4 million pixels should be enough for a while
            const halfSize = worldSize / 2;
            this.physics.world.setBounds(-halfSize, -halfSize, worldSize, worldSize);
            // We don't set camera bounds to allow infinite scrolling
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
        
        // Bullet Collisions
        this.physics.add.overlap(this.bulletsGroup, this.wallsGroup, this.handleBulletWallCollision, undefined, this);
        this.physics.add.overlap(this.bulletsGroup, this.treeHitboxesGroup, this.handleBulletTreeCollision, undefined, this);

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
                // Update cursor based on weapon type
                if (item.item instanceof Hands) {
                    // User requested tool_sword_a for hands/melee
                    cursorSystem.setWeaponType('melee');
                } else if (item.item instanceof BaseMeleeWeapon) {
                    cursorSystem.setWeaponType('melee');
                } else if (item.item instanceof BaseRangeWeapon) {
                    cursorSystem.setWeaponType('ranged');
                } else {
                    cursorSystem.setWeaponType('none');
                }
            });
            hudScene.events.on('weapon-unequipped', () => {
                this.player.unequipWeapon();
                cursorSystem.setWeaponType('none');
            });
        }

        // Sync initial weapon state
        const initialQuickItem = inventorySystem.getItemAt('quick', 0);
        if (initialQuickItem) {
            this.player.equipWeapon(initialQuickItem);
            
            // Sync cursor immediately
            if (initialQuickItem.item instanceof Hands) {
                cursorSystem.setWeaponType('melee');
            } else if (initialQuickItem.item instanceof BaseMeleeWeapon) {
                cursorSystem.setWeaponType('melee');
            } else if (initialQuickItem.item instanceof BaseRangeWeapon) {
                cursorSystem.setWeaponType('ranged');
            } else {
                cursorSystem.setWeaponType('none');
            }
        }

        // Initialize Fog of War
        this.fogOfWarSystem = new FogOfWarSystem(this, this.player, this.wallsGroup, this.treeHitboxesGroup);

        // Initialize Time, Lighting, and Shadow Systems
        this.timeSystem = new TimeSystem(this);
        this.lightingSystem = new LightingSystem(this, this.player, this.timeSystem, this.wallsGroup, this.treeHitboxesGroup);
        // Pass item interaction system group to shadow system
        this.shadowSystem = new ShadowSystem(this, this.timeSystem, this.lightingSystem, this.itemInteractionSystem.worldItemsGroup);

        // Initialize Chunk System if no custom map
        if (!this.mapId) {
             this.chunkSystem = new ChunkSystem(
                this,
                Date.now(), // Random seed
                this.wallsGroup,
                this.plantsGroup,
                this.treeHitboxesGroup,
                this.shadowSystem
            );
            
            // Spawn test items
            this.itemInteractionSystem.spawnItem({ item: new AssaultRifle(), x: 300, y: 300 });
            this.itemInteractionSystem.spawnItem({ item: new Pistol(), x: 400, y: 300 });
            this.itemInteractionSystem.spawnItem({ item: new Shotgun(), x: 500, y: 300 });
            
            this.itemInteractionSystem.spawnItem({ item: new StandardAmmo(), x: 350, y: 400, quantity: 60 });
            this.itemInteractionSystem.spawnItem({ item: new LightAmmo(), x: 450, y: 400, quantity: 100 });
            this.itemInteractionSystem.spawnItem({ item: new BuckshotAmmo(), x: 550, y: 400, quantity: 40 });
        }

        // Register initial shadows
        this.registerShadows();
    }
    
    update(_time: number, delta: number) {
        if (!this.player) return;

        // Safety check for physics loop
        if (this.physics.world.isPaused) {
            console.warn('Physics World is PAUSED! Attempting to resume...');
            this.physics.world.resume();
        }

        this.player.update();
        this.timeSystem.update(delta);
        this.lightingSystem.update();
        this.shadowSystem.update();
        this.itemInteractionSystem.update();
        if (this.chunkSystem) {
            this.chunkSystem.update(this.player);
        }
        if (this.fogOfWarSystem) {
            try {
                this.fogOfWarSystem.update();
            } catch (e) {
                console.error('FogOfWarSystem update failed:', e);
            }
        }
    }

    private registerShadows() {
        // Player
        this.shadowSystem.registerObject(this.player, 'Player');

        // Walls
        if (this.wallsGroup) {
            this.wallsGroup.getChildren().forEach(wall => {
                this.shadowSystem.registerObject(wall, 'Wall');
            });
        }

        // Plants
        if (this.plantsGroup) {
            this.plantsGroup.getChildren().forEach(plant => {
                if (plant instanceof Tree) {
                    this.shadowSystem.registerObject(plant, 'Tree');
                } else if (plant instanceof Bush) {
                    this.shadowSystem.registerObject(plant, 'Bush');
                }
            });
        }
        
        // Items
        if (this.itemInteractionSystem && this.itemInteractionSystem.worldItemsGroup) {
            this.itemInteractionSystem.worldItemsGroup.getChildren().forEach(item => {
                this.shadowSystem.registerObject(item, 'Item');
            });
        }
    }

    private handleBulletWallCollision(obj1: any, obj2: any) {
        // Identify bullet and wall using group membership for robustness
        const isObj1Bullet = this.bulletsGroup.contains(obj1);
        const isObj2Bullet = this.bulletsGroup.contains(obj2);

        // Safety checks
        if (!isObj1Bullet && !isObj2Bullet) return;
        if (isObj1Bullet && isObj2Bullet) return;

        const bullet = (isObj1Bullet ? obj1 : obj2) as Phaser.Physics.Arcade.Sprite;
        const wall = (isObj1Bullet ? obj2 : obj1) as unknown as Damageable;

        // Ensure bullet is active (not already destroyed in this frame)
        if (!bullet.active) return;

        // Destroy bullet immediately
        bullet.destroy();

        // Damage wall
        if (wall && typeof wall.takeDamage === 'function') {
             const damage = (bullet as any).damage || 10;
             wall.takeDamage(damage);
        }
    }

    private handleBulletTreeCollision(obj1: any, obj2: any) {
        const isObj1Bullet = this.bulletsGroup.contains(obj1);
        const isObj2Bullet = this.bulletsGroup.contains(obj2);

        if (!isObj1Bullet && !isObj2Bullet) return;

        const bullet = (isObj1Bullet ? obj1 : obj2) as Phaser.Physics.Arcade.Sprite;
        const hitbox = (isObj1Bullet ? obj2 : obj1) as Phaser.Physics.Arcade.Sprite;
        
        if (!bullet.active) return;
        if (!hitbox.active) return;

        bullet.destroy();

        // Check if hitbox has parentTree
        if ('parentTree' in hitbox) {
            const tree = (hitbox as any).parentTree as Tree;
            if (tree && tree.active && typeof tree.takeDamage === 'function') {
                const damage = (bullet as any).damage || 10;
                tree.takeDamage(damage);
            }
        }
    }

    private loadCustomMap(id: string) {
        const map = MapService.getMap(id);
        if (!map) {
            console.error('Map not found');
            return;
        }

        this.physics.world.setBounds(0, 0, map.width, map.height);
        this.cameras.main.setBounds(0, 0, map.width, map.height);

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
                    // Note: We need to pass the texture key, but our obj.key is now an Enum.
                    // We need to map Enum back to texture string if the class needs it.
                    // However, Tree/Bush classes might handle texture internally or we might need a mapper.
                    // Let's check Tree/Bush implementation. Assuming they use the key for texture.
                    // Since they extend Sprite/Image, they need a texture string.
                    // We need a helper to get texture from MapObjectKey for Plants if the class doesn't handle it.
                    
                    // Actually, let's look at how we were passing texture before: "texture: obj.key".
                    // Now obj.key is a number. We need the string texture key.
                    // I should probably add a helper to get texture from MapObjectKey or update Plant classes to accept MapObjectKey.
                    // For now, I'll use a simple mapping here or rely on the class to handle it?
                    // No, `new PlantClass({ ... texture: ... })` expects a string usually.
                    
                    // Let's create a helper method to get texture from key.
                    const texture = this.getTextureFromKey(obj.key);
                    const plant = new PlantClass({ scene: this, x: obj.x, y: obj.y, texture: texture });
                    this.plantsGroup.add(plant);
                }
            }
            // Items (Weapons/Ammo)
            else if (obj.type === 'object' && (obj.key >= 300 && obj.key < 500)) {
                const ItemClass = this.getItemClass(obj.key);
                if (ItemClass) {
                    this.itemInteractionSystem.spawnItem({ item: new ItemClass(), x: obj.x, y: obj.y });
                }
            }
            // Spawn Point
            else if (obj.type === 'object' && obj.key === MapObjectKey.SPAWN_POINT) {
                this.player.setPosition(obj.x, obj.y);
            }
        });

        terrainSystem.render();
    }

    private getTerrainType(key: MapObjectKey): TerrainType | null {
        switch (key) {
            case MapObjectKey.TERRAIN_SOIL: return TerrainType.SOIL;
            case MapObjectKey.TERRAIN_SOIL_RICH: return TerrainType.SOIL_RICH;
            case MapObjectKey.TERRAIN_MUD: return TerrainType.MUD;
            case MapObjectKey.TERRAIN_ROCK: return TerrainType.ROCK;
            case MapObjectKey.TERRAIN_SMOOTH_STONE: return TerrainType.SMOOTH_STONE;
            case MapObjectKey.TERRAIN_ANCIENT_CONCRETE: return TerrainType.ANCIENT_CONCRETE;
            case MapObjectKey.TERRAIN_BROKEN_ASPHALT: return TerrainType.BROKEN_ASPHALT;
            case MapObjectKey.TERRAIN_TILE_STONE: return TerrainType.TILE_STONE;
            case MapObjectKey.TERRAIN_WOOD_FLOOR: return TerrainType.WOOD_FLOOR;
            case MapObjectKey.TERRAIN_SAND: return TerrainType.SAND;
            default: return null;
        }
    }

    private getWallClass(key: MapObjectKey): any {
        switch (key) {
            case MapObjectKey.WALL_ROCK: return BaseRockWall;
            case MapObjectKey.WALL_BRICKS: return BaseBrickWall;
            case MapObjectKey.WALL_PLANKS: return BasePlankWall;
            case MapObjectKey.WALL_SMOOTH: return BaseSmoothWall;
            default: return null;
        }
    }

    private getPlantClass(key: MapObjectKey): any {
        if (key >= MapObjectKey.PLANT_TREE_BAMBOO && key <= MapObjectKey.PLANT_TREE_OAK_IMMATURE) {
            return Tree;
        }
        if (key >= MapObjectKey.PLANT_ALOCASIA_A && key <= MapObjectKey.PLANT_SAGUARO_CACTUS_LEAFLESS) {
            return Bush;
        }
        return null;
    }

    private getItemClass(key: MapObjectKey): any {
        switch (key) {
            case MapObjectKey.WEAPON_ASSAULT_RIFLE: return AssaultRifle;
            case MapObjectKey.WEAPON_AUTOPISTOL: return Pistol;
            case MapObjectKey.WEAPON_SHOTGUN: return Shotgun;
            case MapObjectKey.AMMO_LIGHT: return LightAmmo;
            case MapObjectKey.AMMO_STANDARD: return StandardAmmo;
            case MapObjectKey.AMMO_HEAVY: return HeavyAmmo;
            case MapObjectKey.AMMO_BUCKSHOT: return BuckshotAmmo;
            default: return null;
        }
    }

    private getTextureFromKey(key: MapObjectKey): string {
        const config = EDITOR_OBJECTS.find(obj => obj.key === key);
        return config ? config.texture : '';
    }

    handleResize(_gameSize: Phaser.Structs.Size) {
        // No-op
    }
}
