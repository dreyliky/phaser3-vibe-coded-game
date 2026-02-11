export enum BiomeType {
    FOREST = 'FOREST',
    DESERT = 'DESERT',
    SWAMP = 'SWAMP',
    CAVE = 'CAVE'
}

export type MapObjectType = 'object' | 'wall' | 'plant' | 'tile';

export interface MapObject {
    type: MapObjectType;
    key: string; // e.g., 'weapon_assault_rifle', 'wall_rock', 'tree', 'terrain_soil'
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
