import { SPRITE_KEYS } from './constants';
import { MapObjectKey } from '../types/map';

export interface EditorObjectConfig {
    key: MapObjectKey;
    type: 'object' | 'wall' | 'plant' | 'tile'; // Changed types
    subtype?: 'weapon' | 'ammo' | 'misc'; // For 'object' type
    name: string;
    texture: string; // The texture key to use for icon/preview
    frame?: string | number;
    color?: number; // Fallback if no texture
}

export const EDITOR_OBJECTS: EditorObjectConfig[] = [
    // --- TILES (Surfaces) ---
    { key: MapObjectKey.TERRAIN_NONE, type: 'tile', name: 'Nothing (Eraser)', texture: SPRITE_KEYS.UI.PIXEL, color: 0x000000 },
    { key: MapObjectKey.TERRAIN_SOIL, type: 'tile', name: 'Soil', texture: SPRITE_KEYS.TERRAIN.SOIL, color: 0x8b4513 }, 
    { key: MapObjectKey.TERRAIN_SOIL_RICH, type: 'tile', name: 'Rich Soil', texture: SPRITE_KEYS.TERRAIN.SOIL_RICH, color: 0x5d4037 },
    { key: MapObjectKey.TERRAIN_MUD, type: 'tile', name: 'Mud', texture: SPRITE_KEYS.TERRAIN.MUD, color: 0x3e2723 },
    { key: MapObjectKey.TERRAIN_ROCK, type: 'tile', name: 'Rock Floor', texture: SPRITE_KEYS.TERRAIN.CAVE, color: 0x808080 },
    { key: MapObjectKey.TERRAIN_SMOOTH_STONE, type: 'tile', name: 'Smooth Stone', texture: SPRITE_KEYS.TERRAIN.SMOOTH_STONE, color: 0x757575 },
    { key: MapObjectKey.TERRAIN_ANCIENT_CONCRETE, type: 'tile', name: 'Ancient Concrete', texture: SPRITE_KEYS.TERRAIN.ANCIENT_CONCRETE, color: 0x616161 },
    { key: MapObjectKey.TERRAIN_BROKEN_ASPHALT, type: 'tile', name: 'Broken Asphalt', texture: SPRITE_KEYS.TERRAIN.BROKEN_ASPHALT, color: 0x424242 },
    { key: MapObjectKey.TERRAIN_TILE_STONE, type: 'tile', name: 'Tile Stone', texture: SPRITE_KEYS.TERRAIN.TILE_STONE, color: 0x9e9e9e },
    { key: MapObjectKey.TERRAIN_WOOD_FLOOR, type: 'tile', name: 'Wood Floor', texture: SPRITE_KEYS.TERRAIN.WOOD, color: 0x8d6e63 },
    { key: MapObjectKey.TERRAIN_SAND, type: 'tile', name: 'Sand', texture: SPRITE_KEYS.TERRAIN.SAND, color: 0xc2b280 },

    // --- WALLS ---
    { key: MapObjectKey.WALL_NONE, type: 'wall', name: 'Nothing (Eraser)', texture: SPRITE_KEYS.UI.PIXEL, color: 0x000000 },
    { key: MapObjectKey.WALL_ROCK, type: 'wall', name: 'Limestone Rock Wall', texture: SPRITE_KEYS.WALLS.ROCK, frame: 12 },
    { key: MapObjectKey.WALL_BRICKS, type: 'wall', name: 'Limestone Brick Wall', texture: SPRITE_KEYS.WALLS.BRICKS, frame: 12 },
    { key: MapObjectKey.WALL_SMOOTH, type: 'wall', name: 'Limestone Smooth Wall', texture: SPRITE_KEYS.WALLS.SMOOTH, frame: 12 },
    { key: MapObjectKey.WALL_PLANKS, type: 'wall', name: 'Wood Plank Wall', texture: SPRITE_KEYS.WALLS.PLANKS, frame: 12 },

    // --- PLANTS ---
    { key: MapObjectKey.PLANT_NONE, type: 'plant', name: 'Nothing (Eraser)', texture: SPRITE_KEYS.UI.PIXEL, color: 0x000000 },
    { key: MapObjectKey.PLANT_TREE_BAMBOO, type: 'plant', name: 'Bamboo', texture: SPRITE_KEYS.PLANTS.TREE_BAMBOO },
    { key: MapObjectKey.PLANT_TREE_CECROPIA, type: 'plant', name: 'Cecropia', texture: SPRITE_KEYS.PLANTS.TREE_CECROPIA },
    { key: MapObjectKey.PLANT_TREE_PALM, type: 'plant', name: 'Palm', texture: SPRITE_KEYS.PLANTS.TREE_PALM },
    { key: MapObjectKey.PLANT_TREE_TEAK, type: 'plant', name: 'Teak', texture: SPRITE_KEYS.PLANTS.TREE_TEAK },
    { key: MapObjectKey.PLANT_TREE_WILLOW, type: 'plant', name: 'Willow', texture: SPRITE_KEYS.PLANTS.TREE_WILLOW },
    { key: MapObjectKey.PLANT_TREE_BIRCH_A, type: 'plant', name: 'Birch', texture: SPRITE_KEYS.PLANTS.TREE_BIRCH_A },
    { key: MapObjectKey.PLANT_TREE_OAK_IMMATURE, type: 'plant', name: 'Oak (Immature)', texture: SPRITE_KEYS.PLANTS.TREE_OAK_IMMATURE },
    { key: MapObjectKey.PLANT_ALOCASIA_A, type: 'plant', name: 'Alocasia', texture: SPRITE_KEYS.PLANTS.ALOCASIA_A },
    { key: MapObjectKey.PLANT_BERRY_BUSH_A, type: 'plant', name: 'Berry Bush', texture: SPRITE_KEYS.PLANTS.BERRY_BUSH_A },
    { key: MapObjectKey.PLANT_BUSH_A, type: 'plant', name: 'Bush', texture: SPRITE_KEYS.PLANTS.BUSH_A },
    { key: MapObjectKey.PLANT_GRASS_A, type: 'plant', name: 'Grass A', texture: SPRITE_KEYS.PLANTS.GRASS_A },
    { key: MapObjectKey.PLANT_GRASS_B, type: 'plant', name: 'Grass B', texture: SPRITE_KEYS.PLANTS.GRASS_B },
    { key: MapObjectKey.PLANT_AGAVE, type: 'plant', name: 'Agave', texture: SPRITE_KEYS.PLANTS.AGAVE },
    { key: MapObjectKey.PLANT_PINCUSHION_CACTUS, type: 'plant', name: 'Pincushion', texture: SPRITE_KEYS.PLANTS.PINCUSHION_CACTUS },
    { key: MapObjectKey.PLANT_SAGUARO_CACTUS, type: 'plant', name: 'Saguaro', texture: SPRITE_KEYS.PLANTS.SAGUARO_CACTUS },
    { key: MapObjectKey.PLANT_SAGUARO_CACTUS_LEAFLESS, type: 'plant', name: 'Saguaro (Dry)', texture: SPRITE_KEYS.PLANTS.SAGUARO_CACTUS_LEAFLESS },

    // --- OBJECTS (Weapons) ---
    { key: MapObjectKey.OBJECT_NONE, type: 'object', subtype: 'misc', name: 'Nothing (Eraser)', texture: SPRITE_KEYS.UI.PIXEL, color: 0x000000 },
    { key: MapObjectKey.WEAPON_ASSAULT_RIFLE, type: 'object', subtype: 'weapon', name: 'Assault Rifle', texture: SPRITE_KEYS.WEAPONS.ASSAULT_RIFLE },
    { key: MapObjectKey.WEAPON_AUTOPISTOL, type: 'object', subtype: 'weapon', name: 'Pistol', texture: SPRITE_KEYS.WEAPONS.AUTOPISTOL },
    { key: MapObjectKey.WEAPON_SHOTGUN, type: 'object', subtype: 'weapon', name: 'Shotgun', texture: SPRITE_KEYS.WEAPONS.SHOTGUN },
    
    // --- OBJECTS (Ammo) ---
    { key: MapObjectKey.AMMO_LIGHT, type: 'object', subtype: 'ammo', name: 'Light Ammo', texture: SPRITE_KEYS.AMMO.LIGHT },
    { key: MapObjectKey.AMMO_STANDARD, type: 'object', subtype: 'ammo', name: 'Standard Ammo', texture: SPRITE_KEYS.AMMO.STANDARD },
    { key: MapObjectKey.AMMO_HEAVY, type: 'object', subtype: 'ammo', name: 'Heavy Ammo', texture: SPRITE_KEYS.AMMO.HEAVY },
    { key: MapObjectKey.AMMO_BUCKSHOT, type: 'object', subtype: 'ammo', name: 'Buckshot', texture: SPRITE_KEYS.AMMO.BUCKSHOT },

    // --- OBJECTS (Misc) ---
    { key: MapObjectKey.SPAWN_POINT, type: 'object', subtype: 'misc', name: 'Player Spawn', texture: SPRITE_KEYS.ICONS.PLAYER_SPAWN } 
];
