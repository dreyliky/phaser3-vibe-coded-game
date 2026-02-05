import Phaser from 'phaser';
import { Player } from '../objects';
import { BodyType, CharacterDefinition, FaceType, Gender, HairType } from '../types/character';
import { HAIR_COLORS, SKIN_COLORS } from '../config/constants';
import { AssaultRifle, Pistol, Shotgun, LightAmmo, StandardAmmo, HeavyAmmo, BuckshotAmmo } from '../objects/items';
import { inventorySystem } from '../systems/inventory-system';
import { ItemInteractionSystem } from '../systems/item-interaction-system';

export class Game extends Phaser.Scene {
    private player!: Player;
    private characterDefinition!: CharacterDefinition;
    private itemInteractionSystem!: ItemInteractionSystem;
    private background!: Phaser.GameObjects.TileSprite;

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
        
        // Background
        this.background = this.add.tileSprite(0, 0, width, height, 'background_sand')
            .setOrigin(0)
            .setScrollFactor(0)
            .setDepth(-100);

        // Launch HUD
        this.scene.launch('HUD');

        // Create Player
        this.player = new Player(this, width * 0.5, height * 0.5, this.characterDefinition);
        this.player.setDepth(100); // Explicitly set depth to ensure it's above everything

        // Initialize Item Interaction System
        this.itemInteractionSystem = new ItemInteractionSystem(this, this.player);

        // Spawn test items
        this.itemInteractionSystem.spawnItem(new AssaultRifle(), 300, 300);
        this.itemInteractionSystem.spawnItem(new Pistol(), 400, 300);
        this.itemInteractionSystem.spawnItem(new Shotgun(), 500, 300);
        this.itemInteractionSystem.spawnItem(new StandardAmmo(), 350, 400, 60);
        this.itemInteractionSystem.spawnItem(new LightAmmo(), 450, 400, 100);
        this.itemInteractionSystem.spawnItem(new BuckshotAmmo(), 550, 400, 40);

        // Input for interaction
        if (this.input.keyboard) {
            this.input.keyboard.on('keydown-E', () => this.itemInteractionSystem.tryPickupItem());

            // Drop Weapon (G)
            this.input.keyboard.on('keydown-G', () => {
                const hudScene = this.scene.get('HUD') as any;
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
        const hudScene = this.scene.get('HUD') as any;
        if (hudScene) {
            hudScene.events.on('weapon-equipped', (item: any) => {
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

        if (this.background) {
            this.background.tilePositionX = this.cameras.main.scrollX;
            this.background.tilePositionY = this.cameras.main.scrollY;
        }
    }
}

