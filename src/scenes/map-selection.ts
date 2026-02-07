import Phaser from 'phaser';
import { Button } from '../objects/ui/button';
import { MapService } from '../services/map-service';
import { GameMap } from '../types/map';

export class MapSelectionScene extends Phaser.Scene {
    private mode: 'play' | 'edit' = 'play';
    private readonly LIST_START_Y = 120;
    private readonly ITEM_HEIGHT = 60;

    constructor() {
        super('MapSelectionScene');
    }

    init(data?: { mode?: 'play' | 'edit' }) {
        this.mode = data?.mode || 'play';
    }

    create() {
        this.cameras.main.setBackgroundColor(0x111111);

        this.createTitle();
        this.createBackButton();
        this.createMapList();
        this.createNewMapButton();
    }

    private createTitle() {
        const titleText = this.mode === 'play' ? 'Select Map to Play' : 'Select Map to Edit';
        this.add.text(this.cameras.main.centerX, 50, titleText, { 
            fontSize: '32px', 
            color: '#ffffff' 
        }).setOrigin(0.5);
    }

    private createBackButton() {
        new Button({
            scene: this,
            x: 50,
            y: 50,
            text: 'Back',
            style: { width: 80, height: 40 },
            onClick: () => this.scene.start('MainMenu')
        });
    }

    private createMapList() {
        const maps = MapService.getMaps();
        
        if (maps.length === 0) {
            this.add.text(this.cameras.main.centerX, this.LIST_START_Y, 'No maps found.', { color: '#888888' }).setOrigin(0.5);
            return;
        }

        maps.forEach((map, index) => {
            const y = this.LIST_START_Y + index * this.ITEM_HEIGHT;
            this.createMapListItem(map, y);
        });
    }

    private createMapListItem(map: GameMap, y: number) {
        // Map Button
        new Button({
            scene: this,
            x: this.cameras.main.centerX - 100,
            y: y,
            text: `${map.name} (${map.width}x${map.height})`,
            style: { width: 400, height: 50, fontSize: '18px' },
            onClick: () => this.selectMap(map.id)
        });

        // Delete button
        new Button({
            scene: this,
            x: this.cameras.main.centerX + 150,
            y: y,
            text: 'Del',
            style: { width: 50, height: 50, backgroundColor: 0x882222 },
            onClick: () => this.deleteMap(map)
        });
    }

    private deleteMap(map: GameMap) {
        if (window.confirm(`Delete map ${map.name}?`)) {
            MapService.deleteMap(map.id);
            this.scene.restart(this.scene.settings.data);
        }
    }

    private createNewMapButton() {
        if (this.mode !== 'edit') return;

        const maps = MapService.getMaps();
        const y = this.LIST_START_Y + maps.length * this.ITEM_HEIGHT + 40;

        new Button({
            scene: this,
            x: this.cameras.main.centerX,
            y: y,
            text: 'Create New Map',
            style: { width: 200, height: 50, backgroundColor: 0x228822 },
            onClick: () => this.scene.start('MapEditor', { mapId: null })
        });
    }

    private selectMap(id: string) {
        if (this.mode === 'play') {
            this.scene.start('GameScene', { mapId: id });
        } else {
            this.scene.start('MapEditor', { mapId: id });
        }
    }
}
