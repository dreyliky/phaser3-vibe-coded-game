import { GameMap } from '../types/map';

const STORAGE_KEY = 'phaser_game_maps';

export class MapService {
    static getMaps(): GameMap[] {
        const data = localStorage.getItem(STORAGE_KEY);
        if (!data) return [];
        try {
            return JSON.parse(data);
        } catch (e) {
            console.error('Failed to parse maps from localStorage', e);
            return [];
        }
    }

    static getMap(id: string): GameMap | undefined {
        const maps = this.getMaps();
        return maps.find(m => m.id === id);
    }

    static saveMap(map: GameMap): void {
        const maps = this.getMaps();
        const existingIndex = maps.findIndex(m => m.id === map.id);
        
        if (existingIndex >= 0) {
            maps[existingIndex] = { ...map, updatedAt: Date.now() };
        } else {
            maps.push({ ...map, createdAt: Date.now(), updatedAt: Date.now() });
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(maps));
    }

    static deleteMap(id: string): void {
        const maps = this.getMaps();
        const newMaps = maps.filter(m => m.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newMaps));
    }

    static createNewMap(name: string, width: number = 4000, height: number = 4000): GameMap {
        return {
            id: crypto.randomUUID(),
            name,
            width,
            height,
            objects: [],
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
    }
}
