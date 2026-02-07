import Phaser from 'phaser';
import { Player } from '../objects';
import { BodyType, CharacterDefinition, FaceType, Gender, HairType } from '../types/character';
import { HAIR_COLORS, SKIN_COLORS } from '../config/constants';
import { AssaultRifle, Pistol, Shotgun, LightAmmo, StandardAmmo, HeavyAmmo, BuckshotAmmo } from '../objects/items';
import { inventorySystem, InventoryItem, ItemInteractionSystem, MapGenerator } from '../systems';
import { DEBUG_SETTINGS } from '../config/constants';
import { HUD } from './hud';

export class Game extends Phaser.Scene {
    public player!: Player;
    private characterDefinition!: CharacterDefinition;
    public itemInteractionSystem!: ItemInteractionSystem;
    // private background!: Phaser.GameObjects.TileSprite; // Removed
    private mapGenerator!: MapGenerator;

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
        
        // Handle Resize
        this.scale.on('resize', this.handleResize, this);

        // Set world bounds (Large map)
        const mapWidth = 4000;
        const mapHeight = 4000;
        this.physics.world.setBounds(0, 0, mapWidth, mapHeight);

        // Background is now handled by MapGenerator (as tiles)

        // Launch HUD
        this.scene.launch('HUD');

        // Map Generation
        this.mapGenerator = new MapGenerator(this);
        this.mapGenerator.generateMap(mapWidth, mapHeight);

        // Create Player
        this.player = new Player(this, width * 0.5, height * 0.5, this.characterDefinition);
        // Depth is handled in Player.update() for Y-sorting
        
        // Camera setup
        this.cameras.main.setBounds(0, 0, mapWidth, mapHeight);
        this.cameras.main.startFollow(this.player, true); // No lerp for pixel perfect follow
        this.cameras.main.setZoom(1);
        this.cameras.main.setRoundPixels(true);

        // Initialize Item Interaction System
        this.itemInteractionSystem = new ItemInteractionSystem(this, this.player);

        // Apply Debug Settings
        if (DEBUG_SETTINGS.SHOW_COLLIDERS) {
            this.physics.world.createDebugGraphic();
            this.physics.world.drawDebug = true;
        }

        // Colliders
        this.physics.add.collider(this.player, this.mapGenerator.getVegetation());
        this.physics.add.collider(this.player, this.mapGenerator.getWalls());

        // Spawn test items
        this.itemInteractionSystem.spawnItem(new AssaultRifle(), 300, 300);
        this.itemInteractionSystem.spawnItem(new Pistol(), 400, 300);
        this.itemInteractionSystem.spawnItem(new Shotgun(), 500, 300);
        
        // Extra weapons
        this.itemInteractionSystem.spawnItem(new AssaultRifle(), 320, 350);
        this.itemInteractionSystem.spawnItem(new Pistol(), 420, 350);
        this.itemInteractionSystem.spawnItem(new Shotgun(), 520, 350);

        this.itemInteractionSystem.spawnItem(new StandardAmmo(), 350, 400, 60);
        this.itemInteractionSystem.spawnItem(new LightAmmo(), 450, 400, 100);
        this.itemInteractionSystem.spawnItem(new BuckshotAmmo(), 550, 400, 40);

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

        // Sync initial weapon state (ensure Hands or default slot 0 is equipped)
        // We do this after listeners are set up, but we can also force it directly.
        const initialQuickItem = inventorySystem.getItemAt('quick', 0);
        if (initialQuickItem) {
            this.player.equipWeapon(initialQuickItem);
        }
    }

    update() {
        this.player.update();
        this.itemInteractionSystem.update();
    }

    handleResize(gameSize: Phaser.Structs.Size) {
        // const { width, height } = gameSize;
        // Background is tile-based now, no need to resize a TileSprite
    }
}
