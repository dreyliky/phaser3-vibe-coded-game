export interface WallMaterial {
    name: string;
    maxHealth: number;
    tint: number; // Hex color
}

export const WALL_MATERIALS: Record<string, WallMaterial> = {
    Limestone: {
        name: 'Limestone',
        maxHealth: 80,
        tint: 0xEBE5CE // Light Beige
    },
    Granite: {
        name: 'Granite',
        maxHealth: 200,
        tint: 0xB0A0A0 // Pinkish Grey
    },
    Stone: {
        name: 'Stone',
        maxHealth: 120,
        tint: 0x888888 // Grey
    },
    Sandstone: {
        name: 'Sandstone',
        maxHealth: 60,
        tint: 0xDEBD95 // Sand
    },
    Wood: {
        name: 'Wood',
        maxHealth: 40,
        tint: 0x855E42 // Dark Wood
    },
    Default: {
        name: 'Default',
        maxHealth: 100,
        tint: 0xFFFFFF // White (No tint)
    }
};
