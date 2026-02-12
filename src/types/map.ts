export enum BiomeType {
    FOREST = 'FOREST',
    DESERT = 'DESERT',
    SWAMP = 'SWAMP',
    CAVE = 'CAVE'
}

export type MapObjectType = 'object' | 'wall' | 'plant' | 'tile';

export enum MapObjectKey {
    // 0-99: Terrain
    TERRAIN_NONE = 0,
    TERRAIN_SOIL = 1,
    TERRAIN_SOIL_RICH = 2,
    TERRAIN_MUD = 3,
    TERRAIN_ROCK = 4,
    TERRAIN_SMOOTH_STONE = 5,
    TERRAIN_ANCIENT_CONCRETE = 6,
    TERRAIN_BROKEN_ASPHALT = 7,
    TERRAIN_TILE_STONE = 8,
    TERRAIN_WOOD_FLOOR = 9,
    TERRAIN_SAND = 10,

    // 100-199: Walls
    WALL_NONE = 100,
    WALL_ROCK = 101,
    WALL_BRICKS = 102,
    WALL_SMOOTH = 103,
    WALL_PLANKS = 104,

    // 200-299: Plants
    PLANT_TREE_BAMBOO = 201,
    PLANT_TREE_CECROPIA = 202,
    PLANT_TREE_PALM = 203,
    PLANT_TREE_TEAK = 204,
    PLANT_TREE_WILLOW = 205,
    PLANT_TREE_BIRCH_A = 206,
    PLANT_TREE_OAK_IMMATURE = 207,
    PLANT_ALOCASIA_A = 208,
    PLANT_BERRY_BUSH_A = 209,
    PLANT_BUSH_A = 210,
    PLANT_GRASS_A = 211,
    PLANT_GRASS_B = 212,
    PLANT_AGAVE = 213,
    PLANT_PINCUSHION_CACTUS = 214,
    PLANT_SAGUARO_CACTUS = 215,
    PLANT_SAGUARO_CACTUS_LEAFLESS = 216,

    // 300-399: Weapons
    WEAPON_ASSAULT_RIFLE = 301,
    WEAPON_AUTOPISTOL = 302,
    WEAPON_SHOTGUN = 303,

    // 400-499: Ammo
    AMMO_LIGHT = 401,
    AMMO_STANDARD = 402,
    AMMO_HEAVY = 403,
    AMMO_BUCKSHOT = 404,

    // 500+: Misc
    SPAWN_POINT = 501
}

export interface MapObject {
    type: MapObjectType;
    key: MapObjectKey; // Changed from string to MapObjectKey
    x: number;
    y: number;
    properties?: Record<string, any>;
}

export interface GameMap {
    id: string;
    name: string;
    width: number;
    height: number;
    objects: MapObject[];
    createdAt: number;
    updatedAt: number;
}
