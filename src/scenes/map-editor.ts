import Phaser from 'phaser';
import { Button } from '../objects/ui/button';
import { GameMap, MapObjectType, MapObjectKey } from '../types/map';
import { MapService } from '../services/map-service';
import { EDITOR_OBJECTS, EditorObjectConfig } from '../config/editor-objects';
import { BaseLinkedWall } from '../objects/walls/base-linked-wall';
import { BaseRockWall, BaseBrickWall, BasePlankWall, BaseSmoothWall } from '../objects/walls/wall-types';
import { TerrainSystem, TerrainType } from '../systems/terrain-system';
import { Tooltip } from '../objects/ui/tooltip';
import { Dropdown } from '../objects/ui/dropdown';
import { cursorSystem } from '../systems/cursor-system';
import { DEPTHS } from '../config/constants';

type EditorTool = 'brush' | 'rectangle' | 'fill';
type ObjectSubtype = 'all' | 'weapon' | 'ammo' | 'misc';

export class MapEditor extends Phaser.Scene {
    private currentMap!: GameMap;
    private selectedObject: EditorObjectConfig | null = null;

    // Cursor
    // private cursor!: Phaser.GameObjects.Sprite;
    // private onCursorChanged!: (key: string) => void;
    // private cursorOffset = { x: 0, y: 0 };

    private uiContainer!: Phaser.GameObjects.Container;
    private mapObjectsGroup!: Phaser.GameObjects.Group;
    private previewImage: Phaser.GameObjects.Image | null = null;
    private gridGraphics!: Phaser.GameObjects.Graphics;
    private toolGraphics!: Phaser.GameObjects.Graphics;
    private highlightGraphics!: Phaser.GameObjects.Graphics; // For cell highlight
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private controls!: {
        w: Phaser.Input.Keyboard.Key;
        a: Phaser.Input.Keyboard.Key;
        s: Phaser.Input.Keyboard.Key;
        d: Phaser.Input.Keyboard.Key;
    };
    
    private terrainSystem!: TerrainSystem;
    private tooltip!: Tooltip;

    private readonly TILE_SIZE = 80;
    private readonly SIDEBAR_WIDTH = 300; 
    
    // UI State
    private activeTab: MapObjectType = 'tile'; 
    private activeSubtype: ObjectSubtype = 'all';
    private objectButtons: Button[] = []; // Store buttons directly
    private currentTool: EditorTool = 'brush';
    private dropdown!: Dropdown<ObjectSubtype>;
    
    // Tool State
    private isDrawing = false;
    private rectStart: { x: number, y: number } | null = null;
    
    // Highlight Animation
    private highlightTween!: Phaser.Tweens.Tween;

    private uiCamera!: Phaser.Cameras.Scene2D.Camera;

    constructor() {
        super('MapEditor');
    }
    
    init(data: { mapId: string | null }) {
        if (data?.mapId) {
            const map = MapService.getMap(data.mapId);
            if (map) {
                this.currentMap = map;
            } else {
                console.error('Map not found, creating new one');
                this.currentMap = MapService.createNewMap('New Map');
            }
        } else {
            this.currentMap = MapService.createNewMap('New Map');
        }
    }

    create() {
        // Initialize Cursor
        this.input.setDefaultCursor('none');
        // Launch overlay for cursor to avoid multi-camera issues
        this.scene.launch('MapEditorOverlay');
        this.scene.bringToTop('MapEditorOverlay');

        cursorSystem.setUIWindowOpen(false); 
        cursorSystem.setWeaponType('none');
        // Cursor sync handled by overlay

        this.events.on('shutdown', () => {
             this.scene.stop('MapEditorOverlay');
        });

        this.setupCamera();
        this.setupTerrain();
        this.setupGrid();
        this.setupObjects();
        this.setupInput();
        this.setupUI();
        this.setupCamerasIgnore();
        this.setupHighlight();
    }

    private setupCamera() {
        this.cameras.main.setBackgroundColor(0x000000);
        this.cameras.main.setBounds(0, 0, this.currentMap.width, this.currentMap.height);
        this.cameras.main.setViewport(this.SIDEBAR_WIDTH, 0, this.scale.width - this.SIDEBAR_WIDTH, this.scale.height);
        
        this.uiCamera = this.cameras.add(0, 0, this.SIDEBAR_WIDTH, this.scale.height);
        this.uiCamera.setScroll(0, 0);
        this.uiCamera.setBackgroundColor(0x111111);
    }

    private setupTerrain() {
        const gridW = Math.ceil(this.currentMap.width / this.TILE_SIZE);
        const gridH = Math.ceil(this.currentMap.height / this.TILE_SIZE);
        this.terrainSystem = new TerrainSystem({ 
            scene: this, 
            width: gridW, 
            height: gridH, 
            tileSize: this.TILE_SIZE 
        });
    }

    private setupGrid() {
        this.gridGraphics = this.add.graphics().setDepth(DEPTHS.DEBUG.GRID); 
        this.toolGraphics = this.add.graphics().setDepth(DEPTHS.DEBUG.TOOL);
        this.highlightGraphics = this.add.graphics().setDepth(DEPTHS.DEBUG.HIGHLIGHT); 
        this.drawGrid();
    }

    private setupObjects() {
        this.mapObjectsGroup = this.add.group();
        this.renderMapObjects();
    }

    private setupInput() {
        this.cursors = this.input.keyboard!.createCursorKeys();
        this.controls = this.input.keyboard!.addKeys({
            w: Phaser.Input.Keyboard.KeyCodes.W,
            a: Phaser.Input.Keyboard.KeyCodes.A,
            s: Phaser.Input.Keyboard.KeyCodes.S,
            d: Phaser.Input.Keyboard.KeyCodes.D
        }) as {
            w: Phaser.Input.Keyboard.Key;
            a: Phaser.Input.Keyboard.Key;
            s: Phaser.Input.Keyboard.Key;
            d: Phaser.Input.Keyboard.Key;
        };

        this.input.on('pointermove', this.onPointerMove, this);
        this.input.on('pointerdown', this.onPointerDown, this);
        this.input.on('pointerup', this.onPointerUp, this);
    }

    private setupCamerasIgnore() {
        this.cameras.main.ignore(this.uiContainer);
        
        this.uiCamera.ignore(this.mapObjectsGroup);
        this.uiCamera.ignore([
             this.gridGraphics, 
             this.toolGraphics, 
             this.highlightGraphics
        ]);
        if (this.previewImage) {
            this.uiCamera.ignore(this.previewImage);
        }
        this.uiCamera.ignore(this.terrainSystem.getContainer());
    }

    private setupHighlight() {
        this.highlightTween = this.tweens.addCounter({
            from: 0.2,
            to: 0.4,
            duration: 800,
            yoyo: true,
            repeat: -1
        });
    }

    private setupUI() {
        this.createUI();
        
        // Tooltip Manager
        this.tooltip = new Tooltip(this);
        this.tooltip.setScrollFactor(0);
        
        this.events.on('tooltip-show', (text: string, x: number, y: number) => {
            this.tooltip.show(text, x, y);
        });
        this.events.on('tooltip-hide', () => {
            this.tooltip.hide();
        });
        
        this.selectTab('tile');
    }

    update(_time: number, delta: number) {
        this.handleCameraMovement(delta);
        this.terrainSystem.update();
        
        // Cursor handled by MapEditorOverlay
        
        // Highlight active cell continuously
        const pointer = this.input.activePointer;
        if (pointer.x >= this.SIDEBAR_WIDTH) {
            this.highlightGraphics.clear();
            const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
            const gx = Math.floor(worldPoint.x / this.TILE_SIZE);
            const gy = Math.floor(worldPoint.y / this.TILE_SIZE);
            
            if (gx >= 0 && gx < this.currentMap.width / this.TILE_SIZE && 
                gy >= 0 && gy < this.currentMap.height / this.TILE_SIZE) {
                
                const x = gx * this.TILE_SIZE;
                const y = gy * this.TILE_SIZE;
                
                this.highlightGraphics.fillStyle(0xffff00, this.highlightTween.getValue() || 0.2); // Fallback for safety
                this.highlightGraphics.fillRect(x, y, this.TILE_SIZE, this.TILE_SIZE);
            }
        } else {
            this.highlightGraphics.clear();
        }
    }

    private drawGrid() {
        this.gridGraphics.clear();
        this.gridGraphics.lineStyle(1, 0xffff00, 0.3); // Yellow, 0.3 alpha

        // Draw vertical lines
        for (let x = 0; x <= this.currentMap.width; x += this.TILE_SIZE) {
            this.gridGraphics.lineBetween(x, 0, x, this.currentMap.height);
        }

        // Draw horizontal lines
        for (let y = 0; y <= this.currentMap.height; y += this.TILE_SIZE) {
            this.gridGraphics.lineBetween(0, y, this.currentMap.width, y);
        }
        
        // World Bounds
        this.gridGraphics.lineStyle(4, 0xff0000, 1);
        this.gridGraphics.strokeRect(0, 0, this.currentMap.width, this.currentMap.height);
    }

    private createUI() {
        this.uiContainer = this.add.container(0, 0).setScrollFactor(0).setDepth(DEPTHS.UI.BASE);

        const bg = this.add.rectangle(0, 0, this.SIDEBAR_WIDTH, this.cameras.main.height, 0x111111, 0.95).setOrigin(0, 0);
        this.uiContainer.add(bg);

        // Add visual divider
        const divider = this.add.rectangle(this.SIDEBAR_WIDTH, 0, 2, this.cameras.main.height, 0x444444).setOrigin(0, 0);
        this.uiContainer.add(divider);

        const title = this.add.text(10, 10, 'Map Editor', { fontSize: '24px', color: '#ffffff', fontStyle: 'bold' });
        this.uiContainer.add(title);

        const mapName = this.add.text(10, 40, `Map: ${this.currentMap.name}`, { fontSize: '14px', color: '#aaaaaa' });
        this.uiContainer.add(mapName);

        // Actions
        const actionBtnWidth = 60;
        const actionBtnGap = 10;
        const actionBtnTotalWidth = actionBtnWidth * 3 + actionBtnGap * 2;
        const actionBtnStartX = (this.SIDEBAR_WIDTH - actionBtnTotalWidth) / 2;

        this.uiContainer.add(new Button({
            scene: this, x: actionBtnStartX + actionBtnWidth/2, y: 70, text: 'Save',
            style: { width: actionBtnWidth, height: 30, fontSize: '14px', backgroundColor: 0x228822 },
            onClick: () => this.saveMap()
        }));
        this.uiContainer.add(new Button({
            scene: this, x: actionBtnStartX + actionBtnWidth + actionBtnGap + actionBtnWidth/2, y: 70, text: 'Load',
            style: { width: actionBtnWidth, height: 30, fontSize: '14px', backgroundColor: 0x888822 },
            onClick: () => this.openLoadDialog()
        }));
        this.uiContainer.add(new Button({
            scene: this, x: actionBtnStartX + (actionBtnWidth + actionBtnGap) * 2 + actionBtnWidth/2, y: 70, text: 'Exit',
            style: { width: actionBtnWidth, height: 30, fontSize: '14px', backgroundColor: 0x882222 },
            onClick: () => this.scene.start('MainMenu')
        }));

        // Tools
        const tools: { id: EditorTool, label: string }[] = [
            { id: 'brush', label: 'Brush' },
            { id: 'rectangle', label: 'Rect' },
            { id: 'fill', label: 'Fill' }
        ];

        const toolBtnWidth = 70;
        const toolBtnGap = 10;
        const toolBtnTotalWidth = toolBtnWidth * 3 + toolBtnGap * 2;
        const toolBtnStartX = (this.SIDEBAR_WIDTH - toolBtnTotalWidth) / 2;

        tools.forEach((tool, index) => {
            const btn = new Button({
                scene: this, x: toolBtnStartX + index * (toolBtnWidth + toolBtnGap) + toolBtnWidth/2, y: 120, text: tool.label,
                style: { width: toolBtnWidth, height: 30, fontSize: '14px' },
                onClick: () => this.selectTool(tool.id)
            });
            btn.setData('toolId', tool.id);
            this.uiContainer.add(btn);
        });
        
        this.selectTool('brush');

        // Tabs
        const tabs: { label: string, type: MapObjectType }[] = [
            { label: 'Tiles', type: 'tile' },
            { label: 'Walls', type: 'wall' },
            { label: 'Plants', type: 'plant' },
            { label: 'Objects', type: 'object' }
        ];

        const tabWidth = (this.SIDEBAR_WIDTH - 20) / 2 - 5;
        let tabY = 170;

        tabs.forEach((tab, index) => {
            const col = index % 2;
            const row = Math.floor(index / 2);
            const x = 10 + col * (tabWidth + 10) + tabWidth / 2;
            const y = tabY + row * 40;

            const btn = new Button({
                scene: this, x: x, y: y, text: tab.label,
                style: { width: tabWidth, height: 30, fontSize: '14px' },
                onClick: () => this.selectTab(tab.type)
            });
            btn.setData('tabType', tab.type);
            this.uiContainer.add(btn);
        });

        // Dropdown
        this.dropdown = new Dropdown({
            scene: this,
            x: (this.SIDEBAR_WIDTH - 200) / 2, // Center in sidebar
            y: 250,
            width: 200,
            options: [
                { label: 'All', value: 'all' },
                { label: 'Weapons', value: 'weapon' },
                { label: 'Ammo', value: 'ammo' },
                { label: 'Misc', value: 'misc' }
            ],
            onSelect: (value) => {
                this.activeSubtype = value;
                this.refreshObjectList();
            }
        });
        this.dropdown.setVisible(false);
        this.uiContainer.add(this.dropdown);
    }

    private selectTool(tool: EditorTool) {
        this.currentTool = tool;
        this.rectStart = null;
        this.toolGraphics.clear();
        
        this.uiContainer.each((child: any) => {
            if (child instanceof Button && child.getData('toolId')) {
                const id = child.getData('toolId');
                if (id === tool) {
                    child.setBackgroundColor(0x444488);
                } else {
                    child.setBackgroundColor(0x333333);
                }
            }
        });
    }

    private selectTab(type: MapObjectType) {
        this.activeTab = type;
        
        // Clear selection when switching tabs
        this.selectObject(null);

        // Show/Hide Dropdown
        if (type === 'object') {
            this.dropdown.setVisible(true);
        } else {
            this.dropdown.setVisible(false);
        }

        this.uiContainer.each((child: any) => {
            if (child instanceof Button && child.getData('tabType')) {
                const tabType = child.getData('tabType');
                if (tabType === type) {
                    child.setBackgroundColor(0x444488);
                } else {
                    child.setBackgroundColor(0x333333);
                }
            }
        });

        this.refreshObjectList();
    }

    private refreshObjectList() {
        this.objectButtons.forEach(c => c.destroy());
        this.objectButtons = [];

        let objects = EDITOR_OBJECTS.filter(obj => obj.type === this.activeTab);
        
        if (this.activeTab === 'object' && this.activeSubtype !== 'all') {
            objects = objects.filter(obj => obj.subtype === this.activeSubtype);
        }
        
        let startY = 300;
        if (this.activeTab === 'object') {
            startY = 350; 
            this.uiContainer.bringToTop(this.dropdown);
        }

        const cols = 4;
        const btnSize = 60;
        const gap = 10;
        const startX = 15 + btnSize/2; 

        objects.forEach((obj, index) => {
            const col = index % cols;
            const row = Math.floor(index / cols);
            
            const x = startX + col * (btnSize + gap);
            const y = startY + row * (btnSize + gap);

            const isSelected = this.selectedObject === obj;
            
            let icon: Phaser.GameObjects.Image;
            if (obj.texture === 'pixel') {
                icon = this.add.image(0, 0, 'pixel');
                icon.setTint(obj.color || 0xffffff);
            } else {
                icon = this.add.image(0, 0, obj.texture, obj.frame);
            }
            const maxIconSize = 40;
            const scale = Math.min(maxIconSize / icon.width, maxIconSize / icon.height);
            icon.setScale(scale);

            const btn = new Button({
                scene: this,
                x: x,
                y: y,
                text: '',
                style: { 
                    width: btnSize, 
                    height: btnSize, 
                    backgroundColor: isSelected ? 0x444488 : 0x333333,
                    tooltip: obj.name
                },
                icon: icon,
                onClick: () => {
                    // Toggle selection
                    if (this.selectedObject === obj) {
                        this.selectObject(null);
                    } else {
                        this.selectObject(obj);
                    }
                }
            });

            this.uiContainer.add(btn);
            this.objectButtons.push(btn);
        });
    }

    private selectObject(obj: EditorObjectConfig | null) {
        this.selectedObject = obj;
        this.refreshObjectList(); // Update UI highlights

        // Create Preview
        if (this.previewImage) {
            this.previewImage.destroy();
            this.previewImage = null;
        }
        
        if (obj) {
            if (obj.texture === 'pixel') {
                this.previewImage = this.add.image(0, 0, 'pixel');
                this.previewImage.setTint(obj.color || 0xffffff);
            } else {
                this.previewImage = this.add.image(0, 0, obj.texture, obj.frame);
            }
            
            this.previewImage.setDisplaySize(this.TILE_SIZE, this.TILE_SIZE);
            this.previewImage.setAlpha(0.6);
            this.previewImage.setDepth(DEPTHS.EDITOR.PREVIEW_IMAGE);

            if (this.uiCamera) {
                this.uiCamera.ignore(this.previewImage);
            }
        }
    }

    private onPointerMove(pointer: Phaser.Input.Pointer) {
        // Tool Preview & Dragging
        if (this.currentTool === 'rectangle' && this.rectStart) {
            this.toolGraphics.clear();
            this.toolGraphics.fillStyle(0x00ff00, 0.3);
            this.toolGraphics.lineStyle(2, 0x00ff00);
            
            const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
            
            const startX = Math.floor(this.rectStart.x / this.TILE_SIZE) * this.TILE_SIZE;
            const startY = Math.floor(this.rectStart.y / this.TILE_SIZE) * this.TILE_SIZE;
            const endX = Math.floor(worldPoint.x / this.TILE_SIZE) * this.TILE_SIZE;
            const endY = Math.floor(worldPoint.y / this.TILE_SIZE) * this.TILE_SIZE;

            const minX = Math.min(startX, endX);
            const minY = Math.min(startY, endY);
            const w = Math.abs(endX - startX) + this.TILE_SIZE;
            const h = Math.abs(endY - startY) + this.TILE_SIZE;
            
            this.toolGraphics.fillRect(minX, minY, w, h);
            this.toolGraphics.strokeRect(minX, minY, w, h);
        }

        if (this.previewImage && this.selectedObject) {
            if (pointer.x < this.SIDEBAR_WIDTH) {
                this.previewImage.setVisible(false);
            } else {
                this.previewImage.setVisible(true);
                const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
                const gx = Math.floor(worldPoint.x / this.TILE_SIZE);
                const gy = Math.floor(worldPoint.y / this.TILE_SIZE);
                const x = gx * this.TILE_SIZE + this.TILE_SIZE / 2;
                const y = gy * this.TILE_SIZE + this.TILE_SIZE / 2;
                this.previewImage.setPosition(x, y);
            }
        }

        if (this.currentTool === 'brush' && this.isDrawing && pointer.isDown) {
            const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
            const gx = Math.floor(worldPoint.x / this.TILE_SIZE);
            const gy = Math.floor(worldPoint.y / this.TILE_SIZE);
            const x = gx * this.TILE_SIZE + this.TILE_SIZE / 2;
            const y = gy * this.TILE_SIZE + this.TILE_SIZE / 2;
            this.placeObject(gx, gy, x, y);
        }
    }

    private onPointerDown(pointer: Phaser.Input.Pointer) {
        if (pointer.x < this.SIDEBAR_WIDTH) return;

        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        const gx = Math.floor(worldPoint.x / this.TILE_SIZE);
        const gy = Math.floor(worldPoint.y / this.TILE_SIZE);
        const x = gx * this.TILE_SIZE + this.TILE_SIZE / 2;
        const y = gy * this.TILE_SIZE + this.TILE_SIZE / 2;

        if (pointer.rightButtonDown()) {
            this.removeObject(gx, gy, x, y);
            return;
        }

        if (!pointer.leftButtonDown() || !this.selectedObject) return;

        if (this.currentTool === 'brush') {
            this.isDrawing = true;
            this.placeObject(gx, gy, x, y);
        } else if (this.currentTool === 'rectangle') {
            if (!this.rectStart) {
                this.rectStart = { x: worldPoint.x, y: worldPoint.y };
            } else {
                this.fillRectangle(this.rectStart, { x: worldPoint.x, y: worldPoint.y });
                this.rectStart = null;
                this.toolGraphics.clear();
            }
        } else if (this.currentTool === 'fill') {
            this.floodFill(gx, gy);
        }
    }

    private onPointerUp() {
        if (this.currentTool === 'brush') {
            this.isDrawing = false;
        }
    }

    private placeObject(gx: number, gy: number, x: number, y: number) {
        if (!this.selectedObject) return;
        if (x < 0 || x > this.currentMap.width || y < 0 || y > this.currentMap.height) return;

        // Eraser Handling
        if (this.selectedObject.key === MapObjectKey.TERRAIN_NONE) {
            this.eraseTile(gx, gy);
            return;
        }
        
        if (this.selectedObject.key === MapObjectKey.WALL_NONE) {
            this.eraseWall(gx, gy, x, y);
            return;
        }

        if (this.selectedObject.key === MapObjectKey.PLANT_NONE || this.selectedObject.key === MapObjectKey.OBJECT_NONE) {
            this.eraseEntity(gx, gy, x, y);
            return;
        }

        // Layer Logic
        if (this.selectedObject.type === 'tile') {
            this.placeTile(gx, gy, x, y);
        } else {
            this.placeEntity(gx, gy, x, y);
        }
    }

    private eraseTile(gx: number, gy: number) {
        this.terrainSystem.setTerrain(gx, gy, TerrainType.NONE);
        
        this.currentMap.objects = this.currentMap.objects.filter(o => 
            !(o.type === 'tile' && Math.floor(o.x / this.TILE_SIZE) === gx && Math.floor(o.y / this.TILE_SIZE) === gy)
        );
    }

    private eraseWall(gx: number, gy: number, x: number, y: number) {
        this.removeWallAt(gx, gy);
        const radius = this.TILE_SIZE / 2;
        const existingIndex = this.currentMap.objects.findIndex(o => 
            o.type === 'wall' && Math.abs(o.x - x) < radius && Math.abs(o.y - y) < radius
        );
        if (existingIndex !== -1) {
            this.currentMap.objects.splice(existingIndex, 1);
        }
    }

    private eraseEntity(gx: number, gy: number, x: number, y: number) {
        const radius = this.TILE_SIZE / 2;
        // Find any non-tile, non-wall object at this location
        const existingIndex = this.currentMap.objects.findIndex(o => 
            o.type !== 'tile' && o.type !== 'wall' &&
            Math.abs(o.x - x) < radius && Math.abs(o.y - y) < radius
        );
        
        if (existingIndex !== -1) {
            const existing = this.currentMap.objects[existingIndex];
            this.currentMap.objects.splice(existingIndex, 1);
            this.renderMapObjects();
        }
    }

    private placeTile(gx: number, gy: number, x: number, y: number) {
        const terrainType = this.getTerrainType(this.selectedObject!.key);
        if (terrainType) {
            this.terrainSystem.setTerrain(gx, gy, terrainType);
            
            // Remove existing tile at this pos
            this.currentMap.objects = this.currentMap.objects.filter(o => 
                !(o.type === 'tile' && Math.floor(o.x / this.TILE_SIZE) === gx && Math.floor(o.y / this.TILE_SIZE) === gy)
            );
            
            this.currentMap.objects.push({
                type: 'tile',
                key: this.selectedObject!.key,
                x: x,
                y: y
            });
        }
    }

    private placeEntity(gx: number, gy: number, x: number, y: number) {
        // Object Layer (Wall, Item, Plant, Misc)
        // Remove ANY existing object on Object Layer at this cell
        const radius = this.TILE_SIZE / 2;
        const existingIndex = this.currentMap.objects.findIndex(o => 
            o.type !== 'tile' && 
            Math.abs(o.x - x) < radius && Math.abs(o.y - y) < radius
        );
        
        if (existingIndex !== -1) {
            const existing = this.currentMap.objects[existingIndex];
            if (existing.type === 'wall') {
                this.removeWallAt(gx, gy);
            }
            this.currentMap.objects.splice(existingIndex, 1);
            
            if (existing.type !== 'wall') {
                 this.renderMapObjects();
            }
        }

        if (this.selectedObject!.type === 'wall') {
            this.createVisualWall(this.selectedObject!.key, x, y);
        } else {
            this.createVisualObject(this.selectedObject!, x, y);
        }

        this.currentMap.objects.push({
            type: this.selectedObject!.type,
            key: this.selectedObject!.key,
            x: x,
            y: y
        });
    }

    private removeObject(gx: number, gy: number, x: number, y: number) {
        const radius = this.TILE_SIZE / 2;
        const objectLayerIndex = this.currentMap.objects.findIndex(o => 
            o.type !== 'tile' && Math.abs(o.x - x) < radius && Math.abs(o.y - y) < radius
        );

        if (objectLayerIndex !== -1) {
            const obj = this.currentMap.objects[objectLayerIndex];
            if (obj.type === 'wall') this.removeWallAt(gx, gy);
            this.currentMap.objects.splice(objectLayerIndex, 1);
            this.renderMapObjects();
        } else {
            // Remove Surface (Set to NONE)
            this.terrainSystem.setTerrain(gx, gy, TerrainType.NONE);
            this.currentMap.objects = this.currentMap.objects.filter(o => 
                !(o.type === 'tile' && Math.floor(o.x / this.TILE_SIZE) === gx && Math.floor(o.y / this.TILE_SIZE) === gy)
            );
        }
    }

    private fillRectangle(start: { x: number, y: number }, end: { x: number, y: number }) {
        const startX = Math.floor(start.x / this.TILE_SIZE);
        const startY = Math.floor(start.y / this.TILE_SIZE);
        const endX = Math.floor(end.x / this.TILE_SIZE);
        const endY = Math.floor(end.y / this.TILE_SIZE);

        const minX = Math.min(startX, endX);
        const maxX = Math.max(startX, endX);
        const minY = Math.min(startY, endY);
        const maxY = Math.max(startY, endY);

        for (let gx = minX; gx <= maxX; gx++) {
            for (let gy = minY; gy <= maxY; gy++) {
                const x = gx * this.TILE_SIZE + this.TILE_SIZE / 2;
                const y = gy * this.TILE_SIZE + this.TILE_SIZE / 2;
                this.placeObject(gx, gy, x, y);
            }
        }
    }

    private floodFill(startGX: number, startGY: number) {
        if (!this.selectedObject) return;

        const isSurfaceMode = this.selectedObject.type === 'tile';
        const targetKey = this.getTargetKeyAt(startGX, startGY, isSurfaceMode);
        
        if (targetKey === this.selectedObject.key) return; 

        const gridW = Math.ceil(this.currentMap.width / this.TILE_SIZE);
        const gridH = Math.ceil(this.currentMap.height / this.TILE_SIZE);
        const objectGrid = this.buildObjectGrid(gridW, gridH, isSurfaceMode);

        const pixelsToFill = this.performBFS(startGX, startGY, targetKey, objectGrid, gridW, gridH, isSurfaceMode);
        
        if (pixelsToFill.length === 0) return;

        this.applyFloodFill(pixelsToFill, isSurfaceMode);
        this.renderMapObjects();
    }

    private getTargetKeyAt(gx: number, gy: number, isSurfaceMode: boolean): MapObjectKey | null {
        if (isSurfaceMode) {
            const existing = this.currentMap.objects.find(o => 
                o.type === 'tile' && Math.floor(o.x / this.TILE_SIZE) === gx && Math.floor(o.y / this.TILE_SIZE) === gy
            );
            return existing ? existing.key : MapObjectKey.TERRAIN_NONE; 
        } else {
             const existing = this.currentMap.objects.find(o => 
                o.type !== 'tile' && Math.floor(o.x / this.TILE_SIZE) === gx && Math.floor(o.y / this.TILE_SIZE) === gy
            );
            return existing ? existing.key : null;
        }
    }

    private buildObjectGrid(w: number, h: number, isSurfaceMode: boolean): (MapObjectKey | null)[][] {
        const grid = new Array(w).fill(null).map(() => new Array(h).fill(null));

        this.currentMap.objects.forEach(obj => {
            const gx = Math.floor(obj.x / this.TILE_SIZE);
            const gy = Math.floor(obj.y / this.TILE_SIZE);
            if (gx >= 0 && gx < w && gy >= 0 && gy < h) {
                if (isSurfaceMode && obj.type === 'tile') {
                    grid[gx][gy] = obj.key;
                } else if (!isSurfaceMode && obj.type !== 'tile') {
                    grid[gx][gy] = obj.key;
                }
            }
        });
        return grid;
    }

    private performBFS(startX: number, startY: number, targetKey: MapObjectKey | null, grid: (MapObjectKey | null)[][], w: number, h: number, isSurfaceMode: boolean) {
        const queue: { x: number, y: number }[] = [{ x: startX, y: startY }];
        const visited = new Set<string>();
        const result: { x: number, y: number, gx: number, gy: number }[] = [];
        
        const getKey = (x: number, y: number) => {
             if (x < 0 || x >= w || y < 0 || y >= h) return undefined;
             const val = grid[x][y];
             return val === null ? (isSurfaceMode ? MapObjectKey.TERRAIN_NONE : null) : val;
        };

        while (queue.length > 0) {
            const { x, y } = queue.pop()!;
            const key = `${x},${y}`;
            
            if (visited.has(key)) continue;
            visited.add(key);

            const currentKey = getKey(x, y);
            if (currentKey === undefined) continue;
            if (currentKey !== targetKey) continue;

            result.push({
                x: x * this.TILE_SIZE + this.TILE_SIZE / 2,
                y: y * this.TILE_SIZE + this.TILE_SIZE / 2,
                gx: x,
                gy: y
            });

            queue.push({ x: x + 1, y });
            queue.push({ x: x - 1, y });
            queue.push({ x, y: y + 1 });
            queue.push({ x, y: y - 1 });
        }
        return result;
    }

    private applyFloodFill(pixels: { x: number, y: number, gx: number, gy: number }[], isSurfaceMode: boolean) {
        const fillSet = new Set(pixels.map(p => `${p.gx},${p.gy}`));
        
        // Remove old objects in the fill area
        this.currentMap.objects = this.currentMap.objects.filter(obj => {
             const gx = Math.floor(obj.x / this.TILE_SIZE);
             const gy = Math.floor(obj.y / this.TILE_SIZE);
             const key = `${gx},${gy}`;
             
             if (!fillSet.has(key)) return true; 
             
             if (isSurfaceMode) {
                 return obj.type !== 'tile';
             } else {
                 return obj.type === 'tile';
             }
        });

        // Add new objects (if not erasing)
        const isEraser = this.selectedObject!.key === MapObjectKey.TERRAIN_NONE || this.selectedObject!.key === MapObjectKey.WALL_NONE;
        
        if (!isEraser) {
             pixels.forEach(p => {
                 this.currentMap.objects.push({
                     type: this.selectedObject!.type,
                     key: this.selectedObject!.key,
                     x: p.x,
                     y: p.y
                 });
             });
        }
    }

    private removeWallAt(gx: number, gy: number) {
        const wall = BaseLinkedWall.getWallAt(gx, gy);
        if (wall) {
            wall.destroy();
        }
    }

    private createVisualWall(key: MapObjectKey, x: number, y: number) {
        const wallClasses: Record<number, new (options: { scene: Phaser.Scene, x: number, y: number }) => BaseLinkedWall> = {
            [MapObjectKey.WALL_ROCK]: BaseRockWall,
            [MapObjectKey.WALL_BRICKS]: BaseBrickWall,
            [MapObjectKey.WALL_PLANKS]: BasePlankWall,
            [MapObjectKey.WALL_SMOOTH]: BaseSmoothWall
        };

        const WallClass = wallClasses[key];
        if (WallClass) {
            new WallClass({ scene: this, x, y });
        }
    }

    private createVisualObject(config: EditorObjectConfig, x: number, y: number) {
        let sprite: Phaser.GameObjects.Image;
        if (config.texture === 'pixel') {
            sprite = this.add.image(x, y, 'pixel');
            sprite.setTint(config.color || 0xffffff);
        } else {
            sprite = this.add.image(x, y, config.texture, config.frame);
        }
        sprite.setDisplaySize(this.TILE_SIZE, this.TILE_SIZE);
        
        if (config.type === 'plant') sprite.setDepth(DEPTHS.EDITOR.PREVIEW_PLANT);
        else if (config.type === 'object' && config.subtype === 'misc') sprite.setDepth(DEPTHS.EDITOR.PREVIEW_OBJECT);
        else sprite.setDepth(DEPTHS.EDITOR.PREVIEW_DEFAULT); 

        this.mapObjectsGroup.add(sprite);
    }

    private renderMapObjects() {
        this.mapObjectsGroup.clear(true, true);
        this.resetTerrain();
        this.drawMapObjects();
        this.terrainSystem.render();
    }

    private resetTerrain() {
        const gridW = Math.ceil(this.currentMap.width / this.TILE_SIZE);
        const gridH = Math.ceil(this.currentMap.height / this.TILE_SIZE);
        
        for(let x=0; x<gridW; x++) {
            for(let y=0; y<gridH; y++) {
                this.terrainSystem.setTerrain(x, y, TerrainType.NONE); 
            }
        }
    }

    private drawMapObjects() {
        this.currentMap.objects.forEach(obj => {
            if (obj.type === 'tile') {
                const type = this.getTerrainType(obj.key);
                const gx = Math.floor(obj.x / this.TILE_SIZE);
                const gy = Math.floor(obj.y / this.TILE_SIZE);
                if (type) this.terrainSystem.setTerrain(gx, gy, type);
            } else if (obj.type === 'wall') {
                this.createVisualWall(obj.key, obj.x, obj.y);
            } else {
                const config = EDITOR_OBJECTS.find(c => c.key === obj.key);
                if (config) {
                    this.createVisualObject(config, obj.x, obj.y);
                }
            }
        });
    }

    private getTerrainType(key: MapObjectKey): TerrainType | null {
        switch (key) {
            case MapObjectKey.TERRAIN_SOIL: return TerrainType.SOIL;
            case MapObjectKey.TERRAIN_SOIL_RICH: return TerrainType.SOIL_RICH;
            case MapObjectKey.TERRAIN_MUD: return TerrainType.MUD;
            case MapObjectKey.TERRAIN_ROCK: return TerrainType.ROCK;
            case MapObjectKey.TERRAIN_SMOOTH_STONE: return TerrainType.SMOOTH_STONE;
            case MapObjectKey.TERRAIN_ANCIENT_CONCRETE: return TerrainType.ANCIENT_CONCRETE;
            case MapObjectKey.TERRAIN_BROKEN_ASPHALT: return TerrainType.BROKEN_ASPHALT;
            case MapObjectKey.TERRAIN_TILE_STONE: return TerrainType.TILE_STONE;
            case MapObjectKey.TERRAIN_WOOD_FLOOR: return TerrainType.WOOD_FLOOR;
            case MapObjectKey.TERRAIN_SAND: return TerrainType.SAND;
            default: return null;
        }
    }

    private handleCameraMovement(delta: number) {
        const speed = 1.0 * delta; 
        
        if (this.cursors.left.isDown || this.controls.a.isDown) {
            this.cameras.main.scrollX -= speed;
        }
        if (this.cursors.right.isDown || this.controls.d.isDown) {
            this.cameras.main.scrollX += speed;
        }
        if (this.cursors.up.isDown || this.controls.w.isDown) {
            this.cameras.main.scrollY -= speed;
        }
        if (this.cursors.down.isDown || this.controls.s.isDown) {
            this.cameras.main.scrollY += speed;
        }
    }

    private saveMap() {
        let name = this.currentMap.name;
        if (name === 'New Map') {
             const input = window.prompt('Enter map name:', name);
             if (input) name = input;
        }
        
        this.currentMap.name = name;
        MapService.saveMap(this.currentMap);
        alert('Map Saved!');
    }

    private openLoadDialog() {
        this.scene.start('MapSelectionScene', { returnScene: 'MapEditor' });
    }
}
