export interface EditorObjectConfig {
    key: string;
    type: 'object' | 'wall' | 'plant' | 'tile'; // Changed types
    subtype?: 'weapon' | 'ammo' | 'misc'; // For 'object' type
    name: string;
    texture: string; // The texture key to use for icon/preview
    frame?: string | number;
    color?: number; // Fallback if no texture
}

export const EDITOR_OBJECTS: EditorObjectConfig[] = [
    // --- TILES (Surfaces) ---
    { key: 'terrain_none', type: 'tile', name: 'Nothing (Eraser)', texture: 'pixel', color: 0x000000 },
    { key: 'terrain_soil', type: 'tile', name: 'Soil', texture: 'floor_soil', color: 0x8b4513 }, 
    { key: 'terrain_soil_rich', type: 'tile', name: 'Rich Soil', texture: 'floor_soil_rich', color: 0x5d4037 },
    { key: 'terrain_mud', type: 'tile', name: 'Mud', texture: 'floor_mud', color: 0x3e2723 },
    { key: 'terrain_rock', type: 'tile', name: 'Rock Floor', texture: 'floor_cave', color: 0x808080 },
    { key: 'terrain_smooth_stone', type: 'tile', name: 'Smooth Stone', texture: 'floor_smooth_stone', color: 0x757575 },
    { key: 'terrain_ancient_concrete', type: 'tile', name: 'Ancient Concrete', texture: 'floor_ancient_concrete', color: 0x616161 },
    { key: 'terrain_broken_asphalt', type: 'tile', name: 'Broken Asphalt', texture: 'floor_broken_asphalt', color: 0x424242 },
    { key: 'terrain_tile_stone', type: 'tile', name: 'Tile Stone', texture: 'floor_tile_stone', color: 0x9e9e9e },
    { key: 'terrain_wood_floor', type: 'tile', name: 'Wood Floor', texture: 'floor_wood', color: 0x8d6e63 },
    { key: 'terrain_sand', type: 'tile', name: 'Sand', texture: 'background_sand', color: 0xc2b280 },

    // --- WALLS ---
    { key: 'wall_none', type: 'wall', name: 'Nothing (Eraser)', texture: 'pixel', color: 0x000000 },
    { key: 'wall_rock', type: 'wall', name: 'Limestone Rock Wall', texture: 'wall_rock', frame: 12 },
    { key: 'wall_bricks', type: 'wall', name: 'Limestone Brick Wall', texture: 'wall_bricks', frame: 12 },
    { key: 'wall_smooth', type: 'wall', name: 'Limestone Smooth Wall', texture: 'wall_smooth', frame: 12 },
    { key: 'wall_planks', type: 'wall', name: 'Wood Plank Wall', texture: 'wall_planks', frame: 12 },

    // --- PLANTS ---
    { key: 'plant_tree_bamboo', type: 'plant', name: 'Bamboo', texture: 'plant_tree_bamboo' },
    { key: 'plant_tree_cecropia', type: 'plant', name: 'Cecropia', texture: 'plant_tree_cecropia' },
    { key: 'plant_tree_palm', type: 'plant', name: 'Palm', texture: 'plant_tree_palm' },
    { key: 'plant_tree_teak', type: 'plant', name: 'Teak', texture: 'plant_tree_teak' },
    { key: 'plant_tree_willow', type: 'plant', name: 'Willow', texture: 'plant_tree_willow' },
    { key: 'plant_tree_birch_a', type: 'plant', name: 'Birch', texture: 'plant_tree_birch_a' },
    { key: 'plant_tree_oak_immature', type: 'plant', name: 'Oak (Immature)', texture: 'plant_tree_oak_immature' },
    { key: 'plant_alocasia_a', type: 'plant', name: 'Alocasia', texture: 'plant_alocasia_a' },
    { key: 'plant_berry_bush_a', type: 'plant', name: 'Berry Bush', texture: 'plant_berry_bush_a' },
    { key: 'plant_bush_a', type: 'plant', name: 'Bush', texture: 'plant_bush_a' },
    { key: 'plant_grass_a', type: 'plant', name: 'Grass A', texture: 'plant_grass_a' },
    { key: 'plant_grass_b', type: 'plant', name: 'Grass B', texture: 'plant_grass_b' },
    { key: 'plant_agave', type: 'plant', name: 'Agave', texture: 'plant_agave' },
    { key: 'plant_pincushion_cactus', type: 'plant', name: 'Pincushion', texture: 'plant_pincushion_cactus' },
    { key: 'plant_saguaro_cactus', type: 'plant', name: 'Saguaro', texture: 'plant_saguaro_cactus' },
    { key: 'plant_saguaro_cactus_leafless', type: 'plant', name: 'Saguaro (Dry)', texture: 'plant_saguaro_cactus_leafless' },

    // --- OBJECTS (Weapons) ---
    { key: 'weapon_assault_rifle', type: 'object', subtype: 'weapon', name: 'Assault Rifle', texture: 'weapon_assault_rifle' },
    { key: 'weapon_pistol', type: 'object', subtype: 'weapon', name: 'Pistol', texture: 'weapon_pistol' },
    { key: 'weapon_shotgun', type: 'object', subtype: 'weapon', name: 'Shotgun', texture: 'weapon_shotgun' },
    
    // --- OBJECTS (Ammo) ---
    { key: 'ammo_light', type: 'object', subtype: 'ammo', name: 'Light Ammo', texture: 'ammo_light' },
    { key: 'ammo_standard', type: 'object', subtype: 'ammo', name: 'Standard Ammo', texture: 'ammo_standard' },
    { key: 'ammo_heavy', type: 'object', subtype: 'ammo', name: 'Heavy Ammo', texture: 'ammo_heavy' },
    { key: 'ammo_buckshot', type: 'object', subtype: 'ammo', name: 'Buckshot', texture: 'ammo_buckshot' },

    // --- OBJECTS (Misc) ---
    { key: 'spawn_point', type: 'object', subtype: 'misc', name: 'Player Spawn', texture: 'head_Male_Average_Normal_south' } 
];
