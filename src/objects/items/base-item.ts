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

export class WorldItem extends Phaser.Physics.Arcade.Sprite {
    private item: BaseItem;
    private quantity: number;
    private extraData: any;

    constructor(scene: Phaser.Scene, x: number, y: number, item: BaseItem, quantity: number = 1, extraData?: any) {
        super(scene, x, y, item.getTexture());
        this.item = item;
        this.quantity = quantity;
        this.extraData = extraData;

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setAngle(Phaser.Math.Between(0, 360));
        
        // Add some bounce/drag if needed
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setDrag(100);
        body.setAngularDrag(100);
        
        this.setInteractive();

        // Optional: Display quantity if > 1
        if (this.quantity > 1) {
            // This is a sprite, adding text child isn't direct for Sprite (it's not a Container).
            // But we can just rely on picking it up to see quantity.
            // Or convert WorldItem to Container?
            // For now, let's keep it simple.
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
