import Phaser from 'phaser';

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
    private extraData: any;
    private sprite: Phaser.GameObjects.Sprite;
    private highlight: Phaser.GameObjects.Graphics;

    constructor(scene: Phaser.Scene, x: number, y: number, item: BaseItem, quantity: number = 1, extraData?: any) {
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
        this.sprite.setScale(0.5); // Reduce size by 2
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

        // Optional: Display quantity if > 1
        if (this.quantity > 1) {
            const qtyText = scene.add.text(10, 10, this.quantity.toString(), {
                fontSize: '10px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 2
            }).setOrigin(1, 1);
            this.add(qtyText);
        }
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
        // Simulate radial gradient with concentric circles
        const radius = 24;
        const steps = 10;
        for (let i = 0; i < steps; i++) {
            const alpha = 0.5 * (1 - i / steps);
            const r = radius * (1 - i / steps);
            this.highlight.fillStyle(color, alpha);
            this.highlight.fillCircle(0, 0, r);
        }
    }

    public getItem(): BaseItem {
        return this.item;
    }

    public getQuantity(): number {
        return this.quantity;
    }

    public getExtraData(): any {
        return this.extraData;
    }
}
