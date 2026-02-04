import Phaser from 'phaser';
import { Player } from '../objects';
import { BodyType, CharacterDefinition, FaceType, Gender, HairType } from '../types/character';
import { HAIR_COLORS, SKIN_COLORS } from '../config/constants';
import { WorldItem, AssaultRifle, Pistol, Shotgun, LightAmmo, StandardAmmo, HeavyAmmo, BuckshotAmmo } from '../objects/items';
import { inventorySystem } from '../systems/inventory-system';

export class Game extends Phaser.Scene {
    private player!: Player;
    private characterDefinition!: CharacterDefinition;
    private worldItems: Phaser.Physics.Arcade.Group;

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
        
        // Launch HUD
        this.scene.launch('HUD');

        // Create Player
        this.player = new Player(this, width * 0.5, height * 0.5, this.characterDefinition);

        // World Items Group
        this.worldItems = this.physics.add.group();

        // Spawn test items
        this.spawnItem(new AssaultRifle(), 300, 300);
        this.spawnItem(new Pistol(), 400, 300);
        this.spawnItem(new Shotgun(), 500, 300);
        this.spawnItem(new StandardAmmo(), 350, 400);
        this.spawnItem(new LightAmmo(), 450, 400);
        this.spawnItem(new BuckshotAmmo(), 550, 400);

        // Add some instructions
        this.add.text(10, 10, 'WASD to move\nMouse to aim\nE to pick up\nI for inventory\n1-2 for weapons', {
            fontSize: '16px',
            color: '#ffffff'
        }).setScrollFactor(0);

        // Input for interaction
        if (this.input.keyboard) {
            this.input.keyboard.on('keydown-E', () => this.tryPickupItem());
        }

        // Listen for HUD events (weapon equip/unequip)
        const hudScene = this.scene.get('HUD');
        hudScene.events.on('weapon-equipped', (item: any) => {
            this.player.equipWeapon(item);
        });
        hudScene.events.on('weapon-unequipped', () => {
            this.player.unequipWeapon();
        });
    }

    update() {
        this.player.update();
    }

    public spawnPlayerDrop(item: any, quantity: number, extraData?: any) {
        // Drop near player
        const angle = Math.random() * Math.PI * 2;
        const dist = 50;
        const x = this.player.x + Math.cos(angle) * dist;
        const y = this.player.y + Math.sin(angle) * dist;
        
        this.spawnItem(item, x, y, quantity, extraData);
    }

    private spawnItem(item: any, x: number, y: number, quantity: number = 1, extraData?: any) {
        const worldItem = new WorldItem(this, x, y, item, quantity, extraData);
        this.worldItems.add(worldItem);
    }

    private tryPickupItem() {
        // Find nearest item
        let nearestItem: WorldItem | null = null;
        let minDist = 100; // Pickup range

        this.worldItems.getChildren().forEach((child) => {
            const item = child as WorldItem;
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, item.x, item.y);
            if (dist < minDist) {
                minDist = dist;
                nearestItem = item;
            }
        });

        if (nearestItem) {
            const worldItem = nearestItem as WorldItem;
            const added = inventorySystem.addItem(worldItem.getItem(), worldItem.getQuantity(), worldItem.getExtraData());
            if (added) {
                worldItem.destroy();
            }
        }
    }
}
