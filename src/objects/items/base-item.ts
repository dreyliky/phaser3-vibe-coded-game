import Phaser from 'phaser';
import { ItemExtraData } from '../../types/item-extra-data';

export interface ItemDefinition {
    id: string;
    name: string;
    description: string;
    texture: string;
    maxStack: number;
}

export abstract class BaseItem {
    protected definition: ItemDefinition;

    constructor(definition: ItemDefinition) {
        this.definition = definition;
    }

    public getDefinition(): ItemDefinition {
        return this.definition;
    }

    public getId(): string {
        return this.definition.id;
    }

    public getName(): string {
        return this.definition.name;
    }

    public getMaxStack(): number {
        return this.definition.maxStack;
    }

    public getTexture(): string {
        return this.definition.texture;
    }
}

export class WorldItem extends Phaser.GameObjects.Container {
    private item: BaseItem;
    private quantity: number;
    private extraData: ItemExtraData | undefined;
    private sprite: Phaser.GameObjects.Sprite;
    private highlight: Phaser.GameObjects.Graphics;

    constructor(scene: Phaser.Scene, x: number, y: number, item: BaseItem, quantity: number = 1, extraData?: ItemExtraData) {
        super(scene, x, y);
        this.item = item;
        this.quantity = quantity;
        this.extraData = extraData;

        // Highlight (Gradient shadow/glow)
        this.highlight = scene.add.graphics();
        this.createGradientHighlight(0x00ff00);
        this.highlight.setVisible(false);
        this.add(this.highlight);

        // Sprite
        this.sprite = scene.add.sprite(0, 0, item.getTexture());
        
        // Determine scale
        // Reduce size for weapons by 30% from 0.5 -> 0.35
        // We can check if maxStack is 1 as a heuristic for equipment/weapons vs stackable items
        // Or check ID pattern or implement type check.
        // Assuming maxStack 1 = equipment/weapon for now as per current definitions.
        // Or better: check if it's NOT ammo. Ammo has maxStack > 1.
        let scale = 0.5;
        if (item.getMaxStack() === 1) {
             scale = 0.35;
        }
        this.sprite.setScale(scale); 
        this.add(this.sprite);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setAngle(Phaser.Math.Between(0, 360));
        
        // Add some bounce/drag if needed
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setDrag(100);
        body.setAngularDrag(100);
        // Adjust body size for the scaled down sprite
        body.setSize(20, 20);
        body.setOffset(-10, -10);
        
        this.setInteractive(new Phaser.Geom.Rectangle(-16, -16, 32, 32), Phaser.Geom.Rectangle.Contains);

        // Tooltip
        this.on('pointerover', (pointer: Phaser.Input.Pointer) => {
            let name = this.item.getName();
            if (this.quantity > 1) {
                name += ` (${this.quantity})`;
            }
            this.scene.events.emit('tooltip-show', name, pointer.x, pointer.y);
        });

        this.on('pointerout', () => {
            this.scene.events.emit('tooltip-hide');
        });

        // Optional: Display quantity if > 1
        // REMOVED per user request: "Прибери текст з надписом про кількість айтемів в стаку, коли айтем лежить на підлозі"
        /*
        if (this.quantity > 1) {
            const qtyText = scene.add.text(10, 10, this.quantity.toString(), {
                fontSize: '10px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 2
            }).setOrigin(1, 1);
            this.add(qtyText);
        }
        */
    }

    public setHighlight(active: boolean, color: number = 0x00ff00) {
        if (active) {
            this.createGradientHighlight(color);
            this.highlight.setVisible(true);
        } else {
            this.highlight.setVisible(false);
        }
    }

    private createGradientHighlight(color: number) {
        this.highlight.clear();
        // Simulate linear gradient from center (100%) to edge (0%)
        const radius = 24;
        const steps = 10;
        for (let i = 0; i < steps; i++) {
            const alpha = 1 - (i / steps); // 1.0 to 0.0
            const r = radius * (1 - i / steps);
            this.highlight.fillStyle(color, alpha * 0.2); // Base alpha factor to avoid too intense center
            // Actually, to simulate gradient correctly with circles, we draw from outside in or inside out?
            // If we draw multiple circles on top, alphas add up.
            // Better approach: draw largest circle with low alpha? No.
            // Correct way with primitive shapes:
            // Draw many circles.
            // But standard way:
            // Center alpha 1, Edge alpha 0.
            // We can just use steps.
            // Let's stick to previous implementation but adjust alpha logic as requested: "Center 100% opacity, Edge 0% opacity".
            // Since we fill circles, if we fill a circle with alpha 0.1, it's uniform.
            // We need a texture really, but graphics is requested.
            // Let's try drawing rings instead of filled circles to avoid overdraw.
        }
        
        // Simpler approximation with rings
        for (let i = 0; i < steps; i++) {
            const ratio = i / steps;
            const alpha = (1 - ratio) * 0.5; // 1 at center (i=0), 0 at edge. Reduced opacity by x2 (0.5 factor)
            const r = radius * ratio;
            const nextR = radius * ((i + 1) / steps);
            const thickness = nextR - r;
            
            this.highlight.lineStyle(thickness, color, alpha);
            this.highlight.strokeCircle(0, 0, r + thickness/2);
        }
    }

    public getItem(): BaseItem {
        return this.item;
    }

    public getQuantity(): number {
        return this.quantity;
    }

    public getExtraData(): ItemExtraData | undefined {
        return this.extraData;
    }

    public getScale(): number {
        return this.sprite.scaleX;
    }
}
