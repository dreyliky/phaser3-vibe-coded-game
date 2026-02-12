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
        HUMANLIKE_BASE_PATH: 'assets/sprites/things/pawn/Humanlike'
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

export const DEPTHS = {
    // Terrain Layers (Base layers, negative values to be below everything)
    TERRAIN: {
        BASE: -3000000, // General Terrain Base
        SAND: -3000100,
        SOIL: -3000095,
        SOIL_RICH: -3000094,
        MUD: -3000093,
        ROCK: -3000090,
        SMOOTH_STONE: -3000089,
        ANCIENT_CONCRETE: -3000085,
        BROKEN_ASPHALT: -3000084,
        TILE_STONE: -3000083,
        WOOD_FLOOR: -3000082,
    },
    
    // Shadows
    SHADOW: {
        OFFSET: -1, // Relative to object
        SAFE_LAYER: -2900000, // Above terrain, below objects (assuming objects > -2M)
    },

    // Objects are usually sorted by Y (Dynamic)
    // Board/Ground Objects
    BOARD: {
        GRID: -2500000, // If we ever need a grid on the ground
    },

    // Overlay / Effect Layers (Positive values above objects)
    LIGHTING: {
        BASE: 4000000,
        FLASHLIGHT: 4000000 + 1,
        LIGHT_RT: 4000000 + 2,
    },
    FOG_OF_WAR: {
        BASE: 5000000,
    },
    
    // UI Layers (Highest)
    UI: {
        BASE: 10000000,
        BACKDROP: 10000000 - 10,
        HUD_BAR: 10000000 + 10,
        HUD_WINDOW: 10000000 + 20,
        POPUP: 10001000,
        TOOLTIP: 10003000,
        DRAG_ITEM: 10005000,
        CURSOR: 10010000,
    },
    
    // Editor Preview Layers
    EDITOR: {
        PREVIEW_PLANT: 20,
        PREVIEW_OBJECT: 30,
        PREVIEW_DEFAULT: 15,
        PREVIEW_IMAGE: 10000000, // Same as UI BASE
    },

    // Combat Indicators
    COMBAT: {
        RELOAD_INDICATOR: 200, // Relative to Player Container
    },

    // Debug / Editor Layers (Very high)
    DEBUG: {
        TEXT: 2000, // Relative to something? Or absolute? The usage in structure-generator was 2000.
        GRID: Number.MAX_VALUE - 100,
        HIGHLIGHT: Number.MAX_VALUE - 95,
        TOOL: Number.MAX_VALUE - 90,
    }
} as const;
