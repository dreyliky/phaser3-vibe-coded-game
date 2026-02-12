export const SKIN_COLORS = [
    '#f5d0ba', // Light
    '#e8b08d', // Medium
    '#d68d60', // Tan
    '#a36a46', // Dark
    '#5c3a24'  // Very Dark
];

export const HAIR_COLORS = [
    '#ffffff', // White
    '#ffff00', // Blonde
    '#995500', // Brown
    '#000000', // Black
    '#ff0000', // Red
    '#00ff00', // Green
    '#0000ff'  // Blue
];

export const ASSETS = {
    SPRITES: {
        HUMANLIKE_BASE_PATH: 'assets/sprites/things/pawn/Humanlike',
        WEAPONS: {
            RANGED: 'assets/sprites/things/item/equipment/WeaponRanged',
            ASSAULT_RIFLE: 'assets/sprites/things/item/equipment/WeaponRanged/AssaultRifle.png',
            AUTOPISTOL: 'assets/sprites/things/item/equipment/WeaponRanged/Autopistol.png',
            SHOTGUN: 'assets/sprites/things/item/equipment/WeaponRanged/Shotgun.png',
        },
        PROJECTILES: {
            BASE_PATH: 'assets/sprites/things/projectile',
            HEAVY: 'assets/sprites/things/projectile/Bullet_Big.png',
            STANDARD: 'assets/sprites/things/projectile/Bullet_Medium.png',
            BUCKSHOT: 'assets/sprites/things/projectile/Bullet_Shotgun.png',
            LIGHT: 'assets/sprites/things/projectile/Bullet_Small.png',
        },
        UI: {
            CURSOR: {
                BASE_PATH: 'assets/sprites/ui/cursor',
                NONE: 'assets/sprites/ui/cursor/cursor_none.png',
                HAND: 'assets/sprites/ui/cursor/hand_small_point.png',
                SWORD: 'assets/sprites/ui/cursor/tool_sword_a.png',
                TARGET: 'assets/sprites/ui/cursor/target_a.png',
            }
        },
        TERRAIN: {
            SURFACES: {
                BASE_PATH: 'assets/sprites/terrain/surfaces',
                SAND: 'assets/sprites/terrain/surfaces/Sand.png',
                ROUGH_HEWN_ROCK: 'assets/sprites/terrain/surfaces/RoughHewnRock.png',
                SOIL: 'assets/sprites/terrain/surfaces/Soil.png',
                ANCIENT_CONCRETE: 'assets/sprites/terrain/surfaces/AncientConcrete.png',
                BROKEN_ASPHALT: 'assets/sprites/terrain/surfaces/BrokenAsphalt.png',
                MUD: 'assets/sprites/terrain/surfaces/Mud.png',
                SMOOTH_STONE: 'assets/sprites/terrain/surfaces/SmoothStone.png',
                SOIL_RICH: 'assets/sprites/terrain/surfaces/SoilRich.png',
                TILE_STONE: 'assets/sprites/terrain/surfaces/TileStone.png',
                WOOD_FLOOR: 'assets/sprites/terrain/surfaces/WoodFloor.png',
            }
        },
        PLANTS: {
            BASE_PATH: 'assets/sprites/things/plant',
            AGAVE: 'assets/sprites/things/plant/Agave.png',
            PINCUSHION_CACTUS: 'assets/sprites/things/plant/PincushionCactus.png',
            SAGUARO_CACTUS: 'assets/sprites/things/plant/SaguaroCactus.png',
            SAGUARO_CACTUS_LEAFLESS: 'assets/sprites/things/plant/SaguaroCactus_Leafless.png',
            ALOCASIA_A: 'assets/sprites/things/plant/AlocasiaA.png',
            BERRY_BUSH_A: 'assets/sprites/things/plant/BerryBushA.png',
            BUSH_A: 'assets/sprites/things/plant/BushA.png',
            GRASS_A: 'assets/sprites/things/plant/GrassA.png',
            GRASS_B: 'assets/sprites/things/plant/GrassB.png',
            TREE_BAMBOO: 'assets/sprites/things/plant/TreeBamboo.png',
            TREE_CECROPIA: 'assets/sprites/things/plant/TreeCecropia.png',
            TREE_PALM: 'assets/sprites/things/plant/TreePalm.png',
            TREE_TEAK: 'assets/sprites/things/plant/TreeTeak.png',
            TREE_WILLOW: 'assets/sprites/things/plant/TreeWillow.png',
            TREE_BIRCH_A: 'assets/sprites/things/plant/TreeBirchA.png',
            TREE_OAK_IMMATURE: 'assets/sprites/things/plant/TreeOakImmature.png',
        },
        BUILDINGS: {
            LINKED: {
                BASE_PATH: 'assets/sprites/things/buildings/linked',
                ROCK_ATLAS: 'assets/sprites/things/buildings/linked/Rock_Atlas.png',
                BRICKS_ATLAS: 'assets/sprites/things/buildings/linked/Wall_Atlas_Bricks.png',
                PLANKS_ATLAS: 'assets/sprites/things/buildings/linked/Wall_Atlas_Planks.png',
                SMOOTH_ATLAS: 'assets/sprites/things/buildings/linked/Wall_Atlas_Smooth.png',
            }
        }
    }
};

export const DEBUG_SETTINGS = {
    SHOW_COLLIDERS: false, // Set to true to see physics bodies
    SHOW_FPS: true,        // Set to true to see FPS counter
    SHOW_WALL_DEBUG: false  // Set to true to see wall mask/frame info
};

export const GAME_CONFIG = {
    TILE_SIZE: 80,
    REAL_SECONDS_PER_GAME_HOUR: 60
};

// Z-Index Bases
// The game uses an "infinite" map where objects are sorted by Y coordinate.
// Since the map can be very large (e.g. 4,000,000 px), we need large gaps between layers.
// Objects (Characters, Walls, Items) use depth = y (Range: ~ -2,000,000 to +2,000,000)
const BASES = {
    TERRAIN: -3_000_000,
    SHADOW: -2_900_000,
    BOARD: -2_500_000,
    GAME_OBJECTS: 0, // Dynamic range around this
    LIGHTING: 4_000_000,
    FOG: 5_000_000,
    UI: 10_000_000,
    DEBUG: 100_000_000
};

export const DEPTHS = {
    // Terrain Layers (Base layers, negative values to be below everything)
    TERRAIN: {
        BASE: BASES.TERRAIN, // General Terrain Base
        SAND: BASES.TERRAIN - 100,
        SOIL: BASES.TERRAIN - 95,
        SOIL_RICH: BASES.TERRAIN - 94,
        MUD: BASES.TERRAIN - 93,
        ROCK: BASES.TERRAIN - 90,
        SMOOTH_STONE: BASES.TERRAIN - 89,
        ANCIENT_CONCRETE: BASES.TERRAIN - 85,
        BROKEN_ASPHALT: BASES.TERRAIN - 84,
        TILE_STONE: BASES.TERRAIN - 83,
        WOOD_FLOOR: BASES.TERRAIN - 82,
    },
    
    // Shadows
    SHADOW: {
        OFFSET: -1, // Relative to object
        SAFE_LAYER: BASES.SHADOW, // Above terrain, below objects
    },

    // Board/Ground Objects
    BOARD: {
        GRID: BASES.BOARD, // If we ever need a grid on the ground
    },

    // Overlay / Effect Layers (Positive values above objects)
    LIGHTING: {
        BASE: BASES.LIGHTING,
        FLASHLIGHT: BASES.LIGHTING + 1,
        LIGHT_RT: BASES.LIGHTING + 2,
    },
    FOG_OF_WAR: {
        BASE: BASES.FOG,
    },
    
    // UI Layers (Highest)
    UI: {
        BASE: BASES.UI,
        BACKDROP: BASES.UI - 10,
        HUD_BAR: BASES.UI + 10,
        HUD_WINDOW: BASES.UI + 20,
        POPUP: BASES.UI + 1_000,
        TOOLTIP: BASES.UI + 3_000,
        DRAG_ITEM: BASES.UI + 5_000,
        CURSOR: BASES.UI + 10_000,
    },
    
    // Editor Preview Layers
    EDITOR: {
        PREVIEW_PLANT: 20,
        PREVIEW_OBJECT: 30,
        PREVIEW_DEFAULT: 15,
        PREVIEW_IMAGE: BASES.UI, // Same as UI BASE
    },

    // Combat Indicators
    COMBAT: {
        RELOAD_INDICATOR: 200, // Relative to Player Container
    },

    // Debug / Editor Layers (Very high, but safe integer)
    DEBUG: {
        TEXT: 20_000_000, // 20M
        GRID: BASES.DEBUG, // 100M
        HIGHLIGHT: BASES.DEBUG + 5,
        TOOL: BASES.DEBUG + 10,
    }
} as const;
