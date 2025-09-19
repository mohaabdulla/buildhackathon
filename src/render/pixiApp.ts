import * as PIXI from 'pixi.js';
import { useGameStore } from '@/systems/identity';
import { District, Road, CityBlock, TileType } from '@/systems/mapGeneration';
import { Pathfinder } from '@/systems/pathfinding';

export interface POI {
  id: number;
  type: 'restaurant' | 'landmark' | 'delivery_point';
  name: string;
  x: number;
  y: number;
  district: string;
  data: any; // Restaurant data, etc.
  unlocked: boolean;
  discoveredShards: number;
  totalShards: number;
}

export interface CameraControls {
  x: number;
  y: number;
  zoom: number;
  targetX: number;
  targetY: number;
  targetZoom: number;
  isMoving: boolean;
}

export class PixiRenderer {
  private app: PIXI.Application;
  private camera: CameraControls;
  private layers: Map<string, PIXI.Container> = new Map();
  private poiSprites: Map<number, PIXI.Sprite> = new Map();
  private poiPool: PIXI.Sprite[] = [];
  private playerSprite?: PIXI.Sprite;
  private isInitialized = false;
  private eventBus: EventTarget = new EventTarget();
  private keysPressed: Set<string> = new Set();
  private lastUpdateTime = 0;
  
  // Performance tracking
  private lastFrameTime = 0;
  private frameCount = 0;
  private fpsDisplay?: PIXI.Text;
  private debugMode = false;

  // Town map constants
  private readonly MAP_WIDTH = 1600;
  private readonly MAP_HEIGHT = 1200;
  private readonly TILE_SIZE = 32;
  private readonly BUILDING_COLORS = {
    residential: 0xf5f5dc,  // Beige - warm residential color
    commercial: 0xe6e6fa,  // Lavender - clean commercial look
    restaurant: 0xffd700,  // Gold - makes restaurants stand out
    industrial: 0x708090,  // Slate gray - industrial feel
    park: 0x5a8c4a,       // Natural green
  };

  // Texture and sprite management
  private textures: Map<string, PIXI.Texture> = new Map();
  private buildingSprites: PIXI.Container = new PIXI.Container();
  private roadContainer: PIXI.Container = new PIXI.Container();
  private landscapeContainer: PIXI.Container = new PIXI.Container();
  private streetGrid: { x: number; y: number; width: number; height: number; type: 'horizontal' | 'vertical' }[] = [];
  private buildingBlocks: { x: number; y: number; width: number; height: number; type: keyof typeof PixiRenderer.prototype.BUILDING_COLORS }[] = [];

  // Organic city layout
  private cityLayout?: {
    districts: District[];
    roads: Road[];
    cityBlocks: CityBlock[];
    tileGrid: TileType[][];
    restaurantLocations: any[];
  };
  private pathfinder: Pathfinder = new Pathfinder(100, 75); // Will be updated with real grid size

  // Player animation properties
  private playerIdleAnimation = {
    time: 0,
    amplitude: 2,
    frequency: 2,
    isMoving: false,
    targetRotation: 0,
    currentRotation: 0,
    lastDirection: { x: 0, y: 0 }
  };

  constructor() {
    // Initialize PIXI Application with responsive settings
    this.app = new PIXI.Application({
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: 0x2c3e50,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      resizeTo: window, // Automatically handle window resize
    });

    // Initialize camera
    this.camera = {
      x: 0,
      y: 0,
      zoom: 1,
      targetX: 0,
      targetY: 0,
      targetZoom: 1,
      isMoving: false,
    };

    this.setupLayers();
    this.initializeContainers();
    this.setupEventListeners();
    this.setupTicker();
  }

  private initializeContainers(): void {
    // Initialize specialized containers for different map elements
    const baseLayer = this.layers.get('base');
    if (baseLayer) {
      baseLayer.addChild(this.landscapeContainer);
      baseLayer.addChild(this.roadContainer);
      baseLayer.addChild(this.buildingSprites);
    }
  }

  async initialize(container: HTMLElement): Promise<void> {
    if (this.isInitialized) return;

    // Validate container
    if (!container) {
      throw new Error('Container element is required for PixiJS initialization');
    }

    // Make container fill the viewport
    this.setupViewportCSS(container);

    // Add canvas to DOM
    try {
      container.appendChild(this.app.view as HTMLCanvasElement);
      
      // Ensure canvas fills container
      const canvas = this.app.view as HTMLCanvasElement;
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.display = 'block';
    } catch (error) {
      throw new Error(`Failed to append PixiJS canvas to container: ${error}`);
    }

    // Setup enhanced resize handling
    this.setupResizeHandler();

    // Load and setup base textures
    await this.loadBaseTextures();

    this.isInitialized = true;
    console.log('PixiJS Renderer initialized with viewport coverage');
  }

  private setupViewportCSS(container: HTMLElement): void {
    // Ensure container fills viewport
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100vw';
    container.style.height = '100vh';
    container.style.overflow = 'hidden';
    container.style.zIndex = '1';
    
    // Prevent scrolling and zooming on mobile
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    // Add viewport meta tag if not present (for mobile responsiveness)
    if (!document.querySelector('meta[name="viewport"]')) {
      const viewport = document.createElement('meta');
      viewport.name = 'viewport';
      viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
      document.head.appendChild(viewport);
    }
  }

  private setupResizeHandler(): void {
    const resizeHandler = () => {
      this.handleResize();
    };
    
    // Use both resize and orientation change for mobile
    window.addEventListener('resize', resizeHandler);
    window.addEventListener('orientationchange', resizeHandler);
    
    // Initial resize to ensure proper setup
    this.handleResize();
  }

  private setupLayers(): void {
    // Create layer hierarchy
    const layerNames = ['background', 'base', 'districts', 'poi', 'effects', 'ui'];
    
    layerNames.forEach(name => {
      const layer = new PIXI.Container();
      layer.name = name;
      this.layers.set(name, layer);
      this.app.stage.addChild(layer);
    });

    // Setup layer properties
    const baseLayer = this.layers.get('base')!;
    baseLayer.sortableChildren = true;

    const poiLayer = this.layers.get('poi')!;
    poiLayer.sortableChildren = true;
    poiLayer.interactiveChildren = true;

    const effectsLayer = this.layers.get('effects')!;
    effectsLayer.alpha = 0.7;

    const uiLayer = this.layers.get('ui')!;
    uiLayer.interactiveChildren = false;
  }

  private setupEventListeners(): void {
    const stage = this.app.stage;
    stage.eventMode = 'static';
    stage.hitArea = this.app.screen;

    // Mouse/touch events for camera control
    stage.on('pointerdown', this.onPointerDown.bind(this));
    stage.on('pointermove', this.onPointerMove.bind(this));
    stage.on('pointerup', this.onPointerUp.bind(this));
    stage.on('wheel', this.onWheel.bind(this));

    // Keyboard events for player movement
    window.addEventListener('keydown', this.onKeyDown.bind(this));
    window.addEventListener('keyup', this.onKeyUp.bind(this));
  }

  private setupTicker(): void {
    this.app.ticker.add((delta) => {
      const currentTime = performance.now();
      const deltaTime = currentTime - this.lastUpdateTime;
      this.lastUpdateTime = currentTime;
      
      this.updateCamera();
      this.updatePlayer(deltaTime);
      this.updatePlayerAnimation(delta);
      this.updatePerformanceDisplay();
    });
  }

  private updatePlayerAnimation(delta: number): void {
    if (!this.playerSprite) return;
    
    // Update animation time
    this.playerIdleAnimation.time += delta * 0.016; // Convert to approximate seconds
    
    // Smooth rotation interpolation
    const rotationDiff = this.playerIdleAnimation.targetRotation - this.playerIdleAnimation.currentRotation;
    let normalizedDiff = rotationDiff;
    
    // Handle rotation wrapping (shortest path)
    if (normalizedDiff > Math.PI) {
      normalizedDiff -= 2 * Math.PI;
    } else if (normalizedDiff < -Math.PI) {
      normalizedDiff += 2 * Math.PI;
    }
    
    this.playerIdleAnimation.currentRotation += normalizedDiff * 0.1; // Smooth rotation
    this.playerSprite.rotation = this.playerIdleAnimation.currentRotation;
    
    // Idle animation (subtle bob)
    if (!this.playerIdleAnimation.isMoving) {
      const bobOffset = Math.sin(this.playerIdleAnimation.time * this.playerIdleAnimation.frequency) * this.playerIdleAnimation.amplitude;
      this.playerSprite.y = useGameStore.getState().player.y + bobOffset;
      
      // Subtle scale pulse
      const scaleOffset = Math.sin(this.playerIdleAnimation.time * this.playerIdleAnimation.frequency * 0.5) * 0.05;
      this.playerSprite.scale.set(0.8 + scaleOffset);
    } else {
      // Reset to normal scale when moving
      this.playerSprite.scale.set(0.8);
    }
  }

  private async loadBaseTextures(): Promise<void> {
    try {
      // Check if textures are already loaded
      if (this.textures.has('grass')) {
        console.log('Base textures already loaded, skipping...');
        return;
      }

      // Create procedural textures for town elements
      await this.createProceduralTextures();
      
      // Load player sprite
      await this.loadPlayerSprite();
      
      // Keep existing icon textures for compatibility
      const graphics = new PIXI.Graphics();
      
      // Restaurant icon
      graphics.clear();
      graphics.beginFill(0xff6b6b);
      graphics.drawCircle(0, 0, 16);
      graphics.endFill();
      const restaurantTexture = this.app.renderer.generateTexture(graphics);
      PIXI.Texture.addToCache(restaurantTexture, 'restaurant_icon');

      // Landmark icon
      graphics.clear();
      graphics.beginFill(0x4ecdc4);
      graphics.drawRect(-12, -12, 24, 24);
      graphics.endFill();
      const landmarkTexture = this.app.renderer.generateTexture(graphics);
      PIXI.Texture.addToCache(landmarkTexture, 'landmark_icon');

      // District background
      graphics.clear();
      graphics.beginFill(0x34495e, 0.3);
      graphics.drawRect(0, 0, 200, 200);
      graphics.endFill();
      const districtTexture = this.app.renderer.generateTexture(graphics);
      PIXI.Texture.addToCache(districtTexture, 'district_bg');

      console.log('Base textures loaded successfully');

    } catch (error) {
      console.error('Failed to load base textures:', error);
    }
  }

  private async loadPlayerSprite(): Promise<void> {
    try {
      // Try to load the player SVG sprite
      const playerTexture = await PIXI.Texture.fromURL('/player.svg');
      this.textures.set('player', playerTexture);
      console.log('Player sprite loaded successfully');
    } catch (error) {
      console.warn('Failed to load player sprite, using fallback:', error);
      // Create a fallback player sprite
      this.textures.set('player', this.createFallbackPlayerSprite());
    }
  }

  private createFallbackPlayerSprite(): PIXI.Texture {
    // Create a detective-style character sprite as fallback
    const graphics = new PIXI.Graphics();
    
    // Body (coat)
    graphics.beginFill(0x2c3e50); // Dark blue coat
    graphics.drawEllipse(0, 10, 16, 24);
    graphics.endFill();
    
    // Head
    graphics.beginFill(0xfdbcb4); // Skin tone
    graphics.drawCircle(0, -10, 12);
    graphics.endFill();
    
    // Hat
    graphics.beginFill(0x34495e); // Dark gray hat
    graphics.drawEllipse(0, -18, 14, 8);
    graphics.endFill();
    
    // Detective badge
    graphics.beginFill(0xffd700); // Gold badge
    graphics.drawCircle(-8, 0, 4);
    graphics.endFill();
    
    // Arms
    graphics.beginFill(0x2c3e50);
    graphics.drawEllipse(-12, 8, 6, 12);
    graphics.drawEllipse(12, 8, 6, 12);
    graphics.endFill();
    
    // Legs
    graphics.beginFill(0x34495e); // Dark pants
    graphics.drawEllipse(-6, 25, 5, 12);
    graphics.drawEllipse(6, 25, 5, 12);
    graphics.endFill();
    
    // Add shadow/outline
    graphics.lineStyle(2, 0x000000, 0.3);
    graphics.drawEllipse(0, 10, 16, 24);
    graphics.drawCircle(0, -10, 12);
    
    return this.app.renderer.generateTexture(graphics);
  }

  private async createProceduralTextures(): Promise<void> {
    // Create grass texture
    this.textures.set('grass', this.createGrassTexture());
    
    // Create road textures
    this.textures.set('road_asphalt', this.createAsphaltTexture());
    this.textures.set('road_concrete', this.createConcreteTexture());
    this.textures.set('crosswalk', this.createCrosswalkTexture());
    
    // Create building textures
    this.textures.set('building_residential', this.createBuildingTexture(this.BUILDING_COLORS.residential));
    this.textures.set('building_commercial', this.createBuildingTexture(this.BUILDING_COLORS.commercial));
    this.textures.set('building_restaurant', this.createBuildingTexture(this.BUILDING_COLORS.restaurant));
    this.textures.set('building_industrial', this.createBuildingTexture(this.BUILDING_COLORS.industrial));
    
    // Create landscape textures
    this.textures.set('tree', this.createTreeTexture());
    this.textures.set('park', this.createParkTexture());
    this.textures.set('sidewalk', this.createSidewalkTexture());
  }

  private createGrassTexture(): PIXI.Texture {
    const graphics = new PIXI.Graphics();
    const size = this.TILE_SIZE;
    
    // Create more natural grass texture
    graphics.beginFill(0x4a7c3a); // Natural grass green
    graphics.drawRect(0, 0, size, size);
    graphics.endFill();
    
    // Add subtle grass blade patterns
    for (let i = 0; i < 12; i++) {
      graphics.beginFill(0x3d6631); // Darker grass
      const x = Math.random() * size;
      const y = Math.random() * size;
      graphics.drawRect(x, y, 1, 3);
      graphics.endFill();
    }
    
    // Add some variation spots
    for (let i = 0; i < 6; i++) {
      graphics.beginFill(0x5a8c4a); // Lighter grass
      const x = Math.random() * size;
      const y = Math.random() * size;
      graphics.drawCircle(x, y, 1.5);
      graphics.endFill();
    }
    
    return this.app.renderer.generateTexture(graphics);
  }

  private createAsphaltTexture(): PIXI.Texture {
    const graphics = new PIXI.Graphics();
    const size = this.TILE_SIZE;
    
    // Base asphalt color - darker and more realistic
    graphics.beginFill(0x1a1a1a); // Very dark gray
    graphics.drawRect(0, 0, size, size);
    graphics.endFill();
    
    // Add yellow center line for main roads
    graphics.lineStyle(1, 0xffff00, 0.8); // Yellow line
    graphics.moveTo(size/2, 0);
    graphics.lineTo(size/2, size);
    
    // Add some subtle asphalt texture
    for (let i = 0; i < 8; i++) {
      graphics.beginFill(Math.random() > 0.5 ? 0x0f0f0f : 0x252525);
      const x = Math.random() * size;
      const y = Math.random() * size;
      graphics.drawCircle(x, y, 0.5);
      graphics.endFill();
    }
    
    return this.app.renderer.generateTexture(graphics);
  }

  private createCrosswalkTexture(): PIXI.Texture {
    const graphics = new PIXI.Graphics();
    const size = this.TILE_SIZE;
    
    // Base asphalt
    graphics.beginFill(0x1a1a1a);
    graphics.drawRect(0, 0, size, size);
    graphics.endFill();
    
    // White crosswalk stripes
    graphics.beginFill(0xffffff);
    const stripeWidth = 3;
    const stripeSpacing = 4;
    
    for (let i = 0; i < size; i += stripeWidth + stripeSpacing) {
      graphics.drawRect(i, 0, stripeWidth, size);
    }
    graphics.endFill();
    
    return this.app.renderer.generateTexture(graphics);
  }

  private createConcreteTexture(): PIXI.Texture {
    const graphics = new PIXI.Graphics();
    const size = this.TILE_SIZE;
    
    // Base concrete color
    graphics.beginFill(0x6c6c6c); // Medium gray
    graphics.drawRect(0, 0, size, size);
    graphics.endFill();
    
    // Add concrete pattern
    graphics.lineStyle(1, 0x5a5a5a, 0.3);
    for (let i = 0; i < 3; i++) {
      graphics.moveTo(Math.random() * size, 0);
      graphics.lineTo(Math.random() * size, size);
    }
    
    return this.app.renderer.generateTexture(graphics);
  }

  private createBuildingTexture(color: number): PIXI.Texture {
    const graphics = new PIXI.Graphics();
    const size = this.TILE_SIZE;
    
    // Building base with subtle gradient effect
    graphics.beginFill(color);
    graphics.drawRect(0, 0, size, size);
    graphics.endFill();
    
    // Darker top edge for depth
    graphics.beginFill(this.darkenColor(color, 0.3));
    graphics.drawRect(0, 0, size, 2);
    graphics.endFill();
    
    // Building outline
    graphics.lineStyle(1, 0x000000, 0.2);
    graphics.drawRect(0, 0, size, size);
    
    // Add realistic windows (darker for depth)
    graphics.beginFill(0x2c3e50); // Dark blue-gray windows
    const windowSize = 6;
    const spacing = 2;
    
    // Grid of windows
    for (let x = spacing; x < size - windowSize; x += windowSize + spacing) {
      for (let y = spacing; y < size - windowSize; y += windowSize + spacing) {
        graphics.drawRect(x, y, windowSize, windowSize);
      }
    }
    graphics.endFill();
    
    // Window frames (lighter)
    graphics.lineStyle(0.5, 0x5a6b7d, 0.8);
    for (let x = spacing; x < size - windowSize; x += windowSize + spacing) {
      for (let y = spacing; y < size - windowSize; y += windowSize + spacing) {
        graphics.drawRect(x, y, windowSize, windowSize);
      }
    }
    
    return this.app.renderer.generateTexture(graphics);
  }

  private darkenColor(color: number, factor: number): number {
    const r = Math.floor(((color >> 16) & 0xFF) * (1 - factor));
    const g = Math.floor(((color >> 8) & 0xFF) * (1 - factor));
    const b = Math.floor((color & 0xFF) * (1 - factor));
    return (r << 16) | (g << 8) | b;
  }

  private createTreeTexture(): PIXI.Texture {
    const graphics = new PIXI.Graphics();
    const size = this.TILE_SIZE;
    
    // Tree trunk
    graphics.beginFill(0x8b4513); // Saddle brown
    graphics.drawRect(size/2 - 2, size - 8, 4, 8);
    graphics.endFill();
    
    // Tree foliage
    graphics.beginFill(0x228b22); // Forest green
    graphics.drawCircle(size/2, size/2, 12);
    graphics.endFill();
    
    // Add some darker spots for depth
    graphics.beginFill(0x1a6b1a);
    graphics.drawCircle(size/2 - 4, size/2 - 3, 4);
    graphics.drawCircle(size/2 + 3, size/2 + 2, 3);
    graphics.endFill();
    
    return this.app.renderer.generateTexture(graphics);
  }

  private createParkTexture(): PIXI.Texture {
    const graphics = new PIXI.Graphics();
    const size = this.TILE_SIZE;
    
    // Park base (natural green)
    graphics.beginFill(0x5a8c4a); // Natural park green
    graphics.drawRect(0, 0, size, size);
    graphics.endFill();
    
    // Add tree-like spots (darker green circles)
    for (let i = 0; i < 3; i++) {
      graphics.beginFill(0x2d5016); // Dark tree green
      const x = Math.random() * size;
      const y = Math.random() * size;
      graphics.drawCircle(x, y, 3);
      graphics.endFill();
    }
    
    // Add some flower spots for color
    const flowerColors = [0xff8a80, 0xffd54f, 0x81c784];
    for (let i = 0; i < 2; i++) {
      graphics.beginFill(flowerColors[Math.floor(Math.random() * flowerColors.length)]);
      const x = Math.random() * size;
      const y = Math.random() * size;
      graphics.drawCircle(x, y, 1.5);
      graphics.endFill();
    }
    
    return this.app.renderer.generateTexture(graphics);
  }

  private createSidewalkTexture(): PIXI.Texture {
    const graphics = new PIXI.Graphics();
    const size = this.TILE_SIZE;
    
    // Sidewalk base - cleaner concrete color
    graphics.beginFill(0xc0c0c0); // Clean light gray
    graphics.drawRect(0, 0, size, size);
    graphics.endFill();
    
    // Subtle concrete texture without harsh grid
    for (let i = 0; i < 6; i++) {
      graphics.beginFill(0xb5b5b5, 0.3); // Very subtle darker spots
      const x = Math.random() * size;
      const y = Math.random() * size;
      graphics.drawCircle(x, y, 1);
      graphics.endFill();
    }
    
    // Add slight edge definition instead of grid
    graphics.lineStyle(0.5, 0xa8a8a8, 0.3);
    graphics.drawRect(0, 0, size, size);
    
    return this.app.renderer.generateTexture(graphics);
  }

  // Camera controls
  setCameraTarget(x: number, y: number, zoom: number = this.camera.zoom): void {
    this.camera.targetX = x;
    this.camera.targetY = y;
    this.camera.targetZoom = Math.max(0.5, Math.min(3, zoom));
    this.camera.isMoving = true;

    // Update game store
    useGameStore.getState().setCamera({ x, y, zoom });
  }

  addBackground(): void {
    // Clear existing landscape elements
    this.landscapeContainer.removeChildren();
    this.roadContainer.removeChildren();
    this.buildingSprites.removeChildren();
    
    // Generate the town layout with realistic features
    this.generateTownLayout();
    
    // Store map boundaries for collision detection
    (this as any).mapBounds = {
      left: 20,
      right: this.MAP_WIDTH - 20,
      top: 20,
      bottom: this.MAP_HEIGHT - 20
    };
    
    // Add containers to the base layer
    const baseLayer = this.layers.get('base');
    if (baseLayer) {
      baseLayer.addChild(this.landscapeContainer);
      baseLayer.addChild(this.roadContainer);
      baseLayer.addChild(this.buildingSprites);
    }
  }

  /**
   * New method: Generate background using organic city layout
   */
  async addOrganicBackground(cityLayout: {
    districts: District[];
    roads: Road[];
    cityBlocks: CityBlock[];
    tileGrid: TileType[][];
    restaurantLocations: any[];
  }): Promise<void> {
    console.log('Rendering organic city layout...');
    
    // Store the city layout
    this.cityLayout = cityLayout;
    
    // Update pathfinder with the new grid
    this.pathfinder.updateWalkabilityGrid(cityLayout.tileGrid);
    
    // Clear existing elements
    this.landscapeContainer.removeChildren();
    this.roadContainer.removeChildren();
    this.buildingSprites.removeChildren();
    
    // Render the organic city
    this.renderOrganicCity(cityLayout);
    
    // Store map boundaries
    (this as any).mapBounds = {
      left: 20,
      right: this.MAP_WIDTH - 20,
      top: 20,
      bottom: this.MAP_HEIGHT - 20
    };
    
    // Add containers to the base layer
    const baseLayer = this.layers.get('base');
    if (baseLayer) {
      baseLayer.addChild(this.landscapeContainer);
      baseLayer.addChild(this.roadContainer);
      baseLayer.addChild(this.buildingSprites);
    }

    console.log('Organic city rendering complete');
  }

  private renderOrganicCity(cityLayout: {
    districts: District[];
    roads: Road[];
    cityBlocks: CityBlock[];
    tileGrid: TileType[][];
    restaurantLocations: any[];
  }): void {
    const TILE_SIZE = 16;
    
    // Render base tiles (grass, roads, sidewalks, etc.)
    cityLayout.tileGrid.forEach((row, y) => {
      row.forEach((tile, x) => {
        const worldX = x * TILE_SIZE;
        const worldY = y * TILE_SIZE;
        
        let texture: PIXI.Texture | undefined;
        
        switch (tile.type) {
          case 'grass':
            texture = this.textures.get('grass');
            break;
          case 'road':
            texture = this.textures.get('road_asphalt');
            break;
          case 'sidewalk':
            texture = this.textures.get('sidewalk');
            break;
          case 'park':
            texture = this.textures.get('park');
            break;
          case 'building':
            texture = this.textures.get('building_residential');
            break;
          case 'plaza':
            texture = this.textures.get('sidewalk'); // Use sidewalk texture for plazas
            break;
          default:
            texture = this.textures.get('grass');
        }
        
        if (texture) {
          const sprite = new PIXI.Sprite(texture);
          sprite.x = worldX;
          sprite.y = worldY;
          sprite.width = TILE_SIZE;
          sprite.height = TILE_SIZE;
          
          if (tile.type === 'road' || tile.type === 'sidewalk' || tile.type === 'plaza') {
            this.roadContainer.addChild(sprite);
          } else if (tile.type === 'building') {
            // Use district-specific building texture
            let buildingTexture = texture;
            if (tile.district === 'residential') {
              buildingTexture = this.textures.get('building_residential') || texture;
            } else if (tile.district === 'commercial') {
              buildingTexture = this.textures.get('building_commercial') || texture;
            } else if (tile.district === 'mixed') {
              buildingTexture = this.textures.get('building_industrial') || texture;
            }
            
            if (buildingTexture !== texture) {
              sprite.texture = buildingTexture;
            }
            
            this.buildingSprites.addChild(sprite);
          } else {
            this.landscapeContainer.addChild(sprite);
          }
        }
      });
    });
    
    // Render city blocks as larger buildings
    cityLayout.cityBlocks.forEach(block => {
      this.renderCityBlock(block);
    });
    
    // Add district labels
    this.addDistrictLabels(cityLayout.districts);
    
    // Add road intersections and decorations
    this.addRoadDecorations(cityLayout.roads);
  }

  private renderCityBlock(block: CityBlock): void {
    let texture: PIXI.Texture | undefined;
    
    switch (block.type) {
      case 'building':
        texture = this.textures.get('building_commercial');
        break;
      case 'park':
        texture = this.textures.get('park');
        break;
      case 'parking':
        texture = this.textures.get('sidewalk'); // Use different color later
        break;
      case 'plaza':
        texture = this.textures.get('sidewalk');
        break;
      default:
        return;
    }
    
    if (texture) {
      // Create a larger building sprite
      const building = new PIXI.Sprite(texture);
      building.x = block.x;
      building.y = block.y;
      building.width = block.width;
      building.height = block.height;
      
      // Add some visual variety
      if (block.type === 'building') {
        building.tint = this.getBuildingTint(block.district);
      }
      
      this.buildingSprites.addChild(building);
    }
  }

  private getBuildingTint(district: string): number {
    const districtColors: Record<string, number> = {
      'Downtown': 0xc0c0c0,
      'Chinatown': 0xffdddd,
      'Little India': 0xffeedd,
      'Japantown': 0xddffdd,
      'Koreatown': 0xddddff,
      'French Quarter': 0xffe0dd,
      'Little Italy': 0xddeeff,
      'Germantown': 0xffffdd,
    };
    
    return districtColors[district] || 0xffffff;
  }

  private addDistrictLabels(districts: District[]): void {
    districts.forEach(district => {
      if (district.restaurants.length > 0) {
        // Create container for label with background
        const labelContainer = new PIXI.Container();
        
        // Ensure label position is within map boundaries
        const mapBounds = { x: 50, y: 50, width: 924, height: 668 }; // 1024-50*2, 768-50*2
        const labelX = Math.max(mapBounds.x + 50, Math.min(mapBounds.x + mapBounds.width - 50, district.centerX));
        const labelY = Math.max(mapBounds.y + 30, Math.min(mapBounds.y + mapBounds.height - 30, district.centerY - 40));
        
        // Create text label
        const label = new PIXI.Text(district.name, {
          fontFamily: 'Arial, sans-serif',
          fontSize: 12,
          fill: 0xffffff,
          fontWeight: 'bold',
          align: 'center'
        });
        label.anchor.set(0.5);
        
        // Create semi-transparent background
        const padding = 8;
        const background = new PIXI.Graphics();
        background.beginFill(0x000000, 0.6); // Semi-transparent black
        background.drawRoundedRect(
          -label.width/2 - padding, 
          -label.height/2 - padding/2, 
          label.width + padding*2, 
          label.height + padding,
          4
        );
        background.endFill();
        
        // Add subtle border
        background.lineStyle(1, 0xffd700, 0.4); // Gold border
        background.drawRoundedRect(
          -label.width/2 - padding, 
          -label.height/2 - padding/2, 
          label.width + padding*2, 
          label.height + padding,
          4
        );
        
        labelContainer.addChild(background);
        labelContainer.addChild(label);
        
        labelContainer.x = labelX;
        labelContainer.y = labelY;
        
        // Store original scale for zoom-based visibility
        labelContainer.name = `district-label-${district.name}`;
        labelContainer.scale.set(1.0);
        
        this.roadContainer.addChild(labelContainer);
      }
    });
  }

  private addRoadDecorations(roads: Road[]): void {
    roads.forEach(road => {
      if (road.type === 'main') {
        // Add yellow center lines for main roads
        this.addRoadCenterLine(road);
      }
      
      // Add intersection markings where roads meet
      this.addIntersectionMarkings(road);
    });
  }

  private addRoadCenterLine(road: Road): void {
    const graphics = new PIXI.Graphics();
    graphics.lineStyle(2, 0xffff00, 0.6);
    
    for (let i = 0; i < road.points.length - 1; i++) {
      const start = road.points[i];
      const end = road.points[i + 1];
      
      graphics.moveTo(start.x, start.y);
      graphics.lineTo(end.x, end.y);
    }
    
    this.roadContainer.addChild(graphics);
  }

  private addIntersectionMarkings(road: Road): void {
    // Add simple intersection dots at road endpoints
    road.points.forEach(point => {
      const circle = new PIXI.Graphics();
      circle.beginFill(0x666666);
      circle.drawCircle(point.x, point.y, 3);
      circle.endFill();
      this.roadContainer.addChild(circle);
    });
  }

  private generateTownLayout(): void {
    // Create the base landscape (grass everywhere)
    this.createBaseLandscape();
    
    // Generate street grid with realistic features
    this.generateStreetGrid();
    
    // Add sidewalks along streets
    this.addSidewalks();
    
    // Generate building blocks between streets
    this.generateBuildingBlocks();
    
    // Add parks and green spaces
    this.addParksAndGreenSpaces();
    
    // Add decorative elements (trees, etc.)
    this.addDecorations();
    
    // Add crosswalks and street markings
    this.addStreetMarkings();
  }

  private createBaseLandscape(): void {
    const grassTexture = this.textures.get('grass');
    if (!grassTexture) return;
    
    // Tile the entire map with grass
    for (let x = 0; x < this.MAP_WIDTH; x += this.TILE_SIZE) {
      for (let y = 0; y < this.MAP_HEIGHT; y += this.TILE_SIZE) {
        const grassSprite = new PIXI.Sprite(grassTexture);
        grassSprite.x = x;
        grassSprite.y = y;
        this.landscapeContainer.addChild(grassSprite);
      }
    }
  }

  private generateStreetGrid(): void {
    const roadTexture = this.textures.get('road_asphalt');
    if (!roadTexture) return;
    
    // Define main streets with varying widths
    const streets = [
      // Horizontal streets
      { x: 0, y: 120, width: this.MAP_WIDTH, height: 64, type: 'horizontal' as const },
      { x: 0, y: 280, width: this.MAP_WIDTH, height: 96, type: 'horizontal' as const }, // Main commercial street
      { x: 0, y: 480, width: this.MAP_WIDTH, height: 64, type: 'horizontal' as const },
      { x: 0, y: 640, width: this.MAP_WIDTH, height: 48, type: 'horizontal' as const }, // Residential street
      { x: 0, y: 800, width: this.MAP_WIDTH, height: 64, type: 'horizontal' as const },
      
      // Vertical streets
      { x: 160, y: 0, width: 64, height: this.MAP_HEIGHT, type: 'vertical' as const },
      { x: 320, y: 0, width: 80, height: this.MAP_HEIGHT, type: 'vertical' as const }, // Main avenue
      { x: 520, y: 0, width: 64, height: this.MAP_HEIGHT, type: 'vertical' as const },
      { x: 720, y: 0, width: 64, height: this.MAP_HEIGHT, type: 'vertical' as const },
      { x: 920, y: 0, width: 64, height: this.MAP_HEIGHT, type: 'vertical' as const },
      { x: 1120, y: 0, width: 64, height: this.MAP_HEIGHT, type: 'vertical' as const },
    ];
    
    this.streetGrid = streets;
    
    // Create road tiles for each street
    streets.forEach(street => {
      for (let x = street.x; x < street.x + street.width; x += this.TILE_SIZE) {
        for (let y = street.y; y < street.y + street.height; y += this.TILE_SIZE) {
          const roadSprite = new PIXI.Sprite(roadTexture);
          roadSprite.x = x;
          roadSprite.y = y;
          this.roadContainer.addChild(roadSprite);
        }
      }
    });
    
    // Add intersection enhancements
    this.enhanceIntersections();
  }

  private enhanceIntersections(): void {
    const horizontalStreets = this.streetGrid.filter(s => s.type === 'horizontal');
    const verticalStreets = this.streetGrid.filter(s => s.type === 'vertical');
    
    // Find and enhance each intersection
    horizontalStreets.forEach(hStreet => {
      verticalStreets.forEach(vStreet => {
        // Check if streets intersect
        if (hStreet.y < vStreet.y + vStreet.height && 
            hStreet.y + hStreet.height > vStreet.y &&
            vStreet.x < hStreet.x + hStreet.width && 
            vStreet.x + vStreet.width > hStreet.x) {
          
          // Add intersection enhancements (rounded corners, etc.)
          this.addIntersectionDetails(vStreet.x + vStreet.width/2, hStreet.y + hStreet.height/2);
        }
      });
    });
  }

  private addIntersectionDetails(centerX: number, centerY: number): void {
    // Add subtle intersection markings
    const graphics = new PIXI.Graphics();
    graphics.lineStyle(1, 0xffff00, 0.3); // Faint yellow
    graphics.drawCircle(centerX, centerY, 20);
    this.roadContainer.addChild(graphics);
  }

  private addSidewalks(): void {
    const sidewalkTexture = this.textures.get('sidewalk');
    if (!sidewalkTexture) return;
    
    this.streetGrid.forEach(street => {
      if (street.type === 'horizontal') {
        // Add sidewalks above and below horizontal streets
        this.createSidewalkStrip(street.x, street.y - 16, street.width, 16, sidewalkTexture);
        this.createSidewalkStrip(street.x, street.y + street.height, street.width, 16, sidewalkTexture);
      } else {
        // Add sidewalks left and right of vertical streets
        this.createSidewalkStrip(street.x - 16, street.y, 16, street.height, sidewalkTexture);
        this.createSidewalkStrip(street.x + street.width, street.y, 16, street.height, sidewalkTexture);
      }
    });
  }

  private createSidewalkStrip(x: number, y: number, width: number, height: number, texture: PIXI.Texture): void {
    for (let sx = x; sx < x + width; sx += this.TILE_SIZE) {
      for (let sy = y; sy < y + height; sy += this.TILE_SIZE) {
        if (sx >= 0 && sy >= 0 && sx < this.MAP_WIDTH && sy < this.MAP_HEIGHT) {
          const sidewalkSprite = new PIXI.Sprite(texture);
          sidewalkSprite.x = sx;
          sidewalkSprite.y = sy;
          this.landscapeContainer.addChild(sidewalkSprite);
        }
      }
    }
  }

  private generateBuildingBlocks(): void {
    // Define building areas between streets with randomized sizes
    const buildingAreas = this.calculateBuildingAreas();
    
    buildingAreas.forEach(area => {
      this.createBuildingBlock(area);
    });
  }

  private calculateBuildingAreas(): Array<{x: number, y: number, width: number, height: number, type: keyof typeof PixiRenderer.prototype.BUILDING_COLORS}> {
    const areas = [];
    const horizontalStreets = this.streetGrid.filter(s => s.type === 'horizontal').sort((a, b) => a.y - b.y);
    const verticalStreets = this.streetGrid.filter(s => s.type === 'vertical').sort((a, b) => a.x - b.x);
    
    // Create building blocks between streets
    for (let i = 0; i < horizontalStreets.length - 1; i++) {
      for (let j = 0; j < verticalStreets.length - 1; j++) {
        const topStreet = horizontalStreets[i];
        const bottomStreet = horizontalStreets[i + 1];
        const leftStreet = verticalStreets[j];
        const rightStreet = verticalStreets[j + 1];
        
        const x = leftStreet.x + leftStreet.width + 16; // Account for sidewalk
        const y = topStreet.y + topStreet.height + 16;
        const width = rightStreet.x - x - 16;
        const height = bottomStreet.y - y - 16;
        
        if (width > 64 && height > 64) {
          // Determine building type based on location
          let buildingType: keyof typeof PixiRenderer.prototype.BUILDING_COLORS = 'residential';
          
          // Commercial area around main street
          if (j >= 1 && j <= 3 && i >= 0 && i <= 2) {
            buildingType = 'commercial';
          }
          // Industrial on edges
          else if (i === 0 || j === 0 || j === verticalStreets.length - 2) {
            buildingType = 'industrial';
          }
          
          areas.push({ x, y, width, height, type: buildingType });
        }
      }
    }
    
    this.buildingBlocks = areas;
    return areas;
  }

  private createBuildingBlock(area: {x: number, y: number, width: number, height: number, type: keyof typeof PixiRenderer.prototype.BUILDING_COLORS}): void {
    const buildingTexture = this.textures.get(`building_${area.type}`);
    if (!buildingTexture) return;
    
    // Create individual buildings within the block with slight randomization
    const buildingSize = this.TILE_SIZE * 2; // Buildings are 2x2 tiles
    const spacing = 8; // Space between buildings
    
    for (let x = area.x; x < area.x + area.width - buildingSize; x += buildingSize + spacing) {
      for (let y = area.y; y < area.y + area.height - buildingSize; y += buildingSize + spacing) {
        // Add slight randomization to building positions
        const offsetX = Math.random() * 16 - 8;
        const offsetY = Math.random() * 16 - 8;
        
        const building = new PIXI.Sprite(buildingTexture);
        building.x = x + offsetX;
        building.y = y + offsetY;
        building.width = buildingSize;
        building.height = buildingSize;
        this.buildingSprites.addChild(building);
      }
    }
  }

  private addParksAndGreenSpaces(): void {
    const parkTexture = this.textures.get('park');
    if (!parkTexture) return;
    
    // Add specific park areas
    const parks = [
      { x: 440, y: 200, width: 160, height: 120 }, // Central park
      { x: 600, y: 720, width: 96, height: 64 },   // Neighborhood park
      { x: 1200, y: 400, width: 128, height: 96 }, // East park
    ];
    
    parks.forEach(park => {
      for (let x = park.x; x < park.x + park.width; x += this.TILE_SIZE) {
        for (let y = park.y; y < park.y + park.height; y += this.TILE_SIZE) {
          if (x < this.MAP_WIDTH && y < this.MAP_HEIGHT) {
            const parkSprite = new PIXI.Sprite(parkTexture);
            parkSprite.x = x;
            parkSprite.y = y;
            this.landscapeContainer.addChild(parkSprite);
          }
        }
      }
    });
  }

  private addDecorations(): void {
    const treeTexture = this.textures.get('tree');
    if (!treeTexture) return;
    
    // Add trees along streets and in parks
    const treePositions = this.generateTreePositions();
    
    treePositions.forEach(pos => {
      const tree = new PIXI.Sprite(treeTexture);
      tree.x = pos.x;
      tree.y = pos.y;
      tree.anchor.set(0.5);
      this.landscapeContainer.addChild(tree);
    });
  }

  private generateTreePositions(): Array<{x: number, y: number}> {
    const trees: Array<{x: number, y: number}> = [];
    
    // Trees along sidewalks
    this.streetGrid.forEach(street => {
      if (street.type === 'horizontal') {
        // Trees above and below street
        for (let x = street.x + 32; x < street.x + street.width; x += 80) {
          trees.push({ x, y: street.y - 24 });
          trees.push({ x, y: street.y + street.height + 24 });
        }
      } else {
        // Trees left and right of street
        for (let y = street.y + 32; y < street.y + street.height; y += 80) {
          trees.push({ x: street.x - 24, y });
          trees.push({ x: street.x + street.width + 24, y });
        }
      }
    });
    
    // Random trees in building areas (but not too dense)
    this.buildingBlocks.forEach(block => {
      if (Math.random() < 0.3) { // 30% chance of trees in block
        const treeCount = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < treeCount; i++) {
          trees.push({
            x: block.x + Math.random() * block.width,
            y: block.y + Math.random() * block.height
          });
        }
      }
    });
    
    return trees.filter(tree => 
      tree.x >= 32 && tree.x < this.MAP_WIDTH - 32 &&
      tree.y >= 32 && tree.y < this.MAP_HEIGHT - 32
    );
  }

  private addStreetMarkings(): void {
    const graphics = new PIXI.Graphics();
    
    // Add lane markings and crosswalks
    this.streetGrid.forEach(street => {
      if (street.type === 'horizontal' && street.height >= 64) {
        // Center lane markings
        graphics.lineStyle(2, 0xffff00, 0.8);
        const centerY = street.y + street.height / 2;
        for (let x = street.x; x < street.x + street.width; x += 40) {
          graphics.moveTo(x, centerY);
          graphics.lineTo(x + 20, centerY);
        }
        
        // Add crosswalks at intersections
        this.addCrosswalks(graphics, street);
      } else if (street.type === 'vertical' && street.width >= 64) {
        // Center lane markings
        graphics.lineStyle(2, 0xffff00, 0.8);
        const centerX = street.x + street.width / 2;
        for (let y = street.y; y < street.y + street.height; y += 40) {
          graphics.moveTo(centerX, y);
          graphics.lineTo(centerX, y + 20);
        }
      }
    });
    
    this.roadContainer.addChild(graphics);
  }

  private addCrosswalks(graphics: PIXI.Graphics, street: any): void {
    // Add crosswalk stripes at major intersections
    graphics.lineStyle(4, 0xffffff, 0.8);
    
    this.streetGrid.filter(s => s.type === 'vertical').forEach(vStreet => {
      if (this.streetsIntersect(street, vStreet)) {
        // Add crosswalk stripes
        const crosswalkY = street.y;
        const crosswalkEndY = street.y + street.height;
        
        for (let stripe = 0; stripe < 8; stripe++) {
          const x = vStreet.x + (stripe * 8);
          if (x < vStreet.x + vStreet.width) {
            graphics.moveTo(x, crosswalkY);
            graphics.lineTo(x, crosswalkEndY);
          }
        }
      }
    });
  }

  private streetsIntersect(street1: any, street2: any): boolean {
    return !(street1.x > street2.x + street2.width || 
             street2.x > street1.x + street1.width || 
             street1.y > street2.y + street2.height || 
             street2.y > street1.y + street1.height);
  }

  // Create and add player character to the map
  createPlayer(): void {
    if (this.playerSprite) {
      // Remove existing player sprite
      this.layers.get('poi')!.removeChild(this.playerSprite);
    }

    // Use the loaded player texture or create fallback sprite
    const playerTexture = this.textures.get('player');
    if (!playerTexture) {
      console.error('Player texture not loaded, creating fallback');
      this.playerSprite = this.createFallbackPlayerSpriteObject();
    } else {
      this.playerSprite = new PIXI.Sprite(playerTexture);
    }
    
    // Find a walkable starting position
    let startX = 800; // Default center
    let startY = 600;
    
    if (this.cityLayout) {
      // Find the first walkable road tile near the center
      const walkablePosition = this.findNearestWalkablePosition(startX, startY);
      if (walkablePosition) {
        startX = walkablePosition.x;
        startY = walkablePosition.y;
      }
    }
    
    // Update game store with valid starting position
    const gameStore = useGameStore.getState();
    gameStore.movePlayer(startX, startY);
    
    // Set sprite position
    this.playerSprite.x = startX;
    this.playerSprite.y = startY;
    this.playerSprite.anchor.set(0.5);
    this.playerSprite.zIndex = 15; // Above POIs
    
    // Set appropriate scale for the player sprite
    this.playerSprite.scale.set(0.8);
    
    // Initialize animation properties
    this.playerIdleAnimation.time = 0;
    this.playerIdleAnimation.isMoving = false;
    this.playerIdleAnimation.currentRotation = 0;
    
    // Add to POI layer (which supports interactive children)
    this.layers.get('poi')!.addChild(this.playerSprite);
  }

  private createFallbackPlayerSpriteObject(): PIXI.Sprite {
    // Create a simple circle-based player as fallback
    const graphics = new PIXI.Graphics();
    
    // Player body - larger circle
    graphics.beginFill(0x4a90e2); // Blue color
    graphics.drawCircle(0, 0, 20);
    graphics.endFill();
    
    // Player border
    graphics.lineStyle(3, 0xffffff);
    graphics.drawCircle(0, 0, 20);
    
    // Direction indicator (small triangle pointing down by default)
    graphics.beginFill(0xffffff);
    graphics.moveTo(0, 10);
    graphics.lineTo(-8, -5);
    graphics.lineTo(8, -5);
    graphics.closePath();
    graphics.endFill();
    
    // Convert to texture and create sprite
    const texture = this.app.renderer.generateTexture(graphics);
    return new PIXI.Sprite(texture);
  }

  // Update player position with movement tracking
  updatePlayerPosition(x: number, y: number): void {
    if (this.playerSprite) {
      const oldX = this.playerSprite.x;
      const oldY = this.playerSprite.y;
      
      this.playerSprite.x = x;
      this.playerSprite.y = y;
      
      // Track movement for animation
      const deltaX = x - oldX;
      const deltaY = y - oldY;
      
      if (Math.abs(deltaX) > 0.5 || Math.abs(deltaY) > 0.5) {
        this.playerIdleAnimation.isMoving = true;
        this.playerIdleAnimation.lastDirection = { x: deltaX, y: deltaY };
        
        // Calculate target rotation based on movement direction
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          this.playerIdleAnimation.targetRotation = deltaX > 0 ? Math.PI / 2 : -Math.PI / 2; // Right : Left
        } else {
          this.playerIdleAnimation.targetRotation = deltaY > 0 ? Math.PI : 0; // Down : Up
        }
      } else {
        this.playerIdleAnimation.isMoving = false;
      }
    }
  }

  // Enhanced player facing direction with smooth rotation
  updatePlayerFacing(direction: 'up' | 'down' | 'left' | 'right'): void {
    if (this.playerSprite) {
      // Set target rotation based on direction
      switch (direction) {
        case 'up':
          this.playerIdleAnimation.targetRotation = 0;
          break;
        case 'down':
          this.playerIdleAnimation.targetRotation = Math.PI;
          break;
        case 'left':
          this.playerIdleAnimation.targetRotation = -Math.PI / 2;
          break;
        case 'right':
          this.playerIdleAnimation.targetRotation = Math.PI / 2;
          break;
      }
    }
  }

  private updateCamera(): void {
    if (!this.camera.isMoving) return;

    const lerpFactor = 0.1;
    const threshold = 1;

    // Smooth interpolation
    this.camera.x += (this.camera.targetX - this.camera.x) * lerpFactor;
    this.camera.y += (this.camera.targetY - this.camera.y) * lerpFactor;
    this.camera.zoom += (this.camera.targetZoom - this.camera.zoom) * lerpFactor;

    // Check if we've reached the target
    const deltaX = Math.abs(this.camera.targetX - this.camera.x);
    const deltaY = Math.abs(this.camera.targetY - this.camera.y);
    const deltaZoom = Math.abs(this.camera.targetZoom - this.camera.zoom);

    if (deltaX < threshold && deltaY < threshold && deltaZoom < 0.01) {
      this.camera.x = this.camera.targetX;
      this.camera.y = this.camera.targetY;
      this.camera.zoom = this.camera.targetZoom;
      this.camera.isMoving = false;
    }

    // Apply camera transform to world layers
    const worldLayers = ['base', 'districts', 'poi', 'effects'];
    worldLayers.forEach(layerName => {
      const layer = this.layers.get(layerName);
      if (layer) {
        layer.x = -this.camera.x * this.camera.zoom + this.app.screen.width / 2;
        layer.y = -this.camera.y * this.camera.zoom + this.app.screen.height / 2;
        layer.scale.set(this.camera.zoom);
      }
    });

    // Update level of detail based on zoom level
    this.updateLevelOfDetail();
  }

  private updateLevelOfDetail(): void {
    const zoom = this.camera.zoom;
    
    // Determine zoom level
    let zoomLevel: 'far' | 'medium' | 'near';
    if (zoom < 0.7) {
      zoomLevel = 'far';
    } else if (zoom < 1.5) {
      zoomLevel = 'medium';
    } else {
      zoomLevel = 'near';
    }
    
    // Update visibility based on zoom level
    this.updateDetailVisibility(zoomLevel);
  }

  private updateDetailVisibility(zoomLevel: 'far' | 'medium' | 'near'): void {
    // Hide/show elements based on zoom level
    
    // Individual buildings visible at medium and near zoom
    this.buildingSprites.visible = zoomLevel !== 'far';
    
    // Trees visible at medium and near zoom
    this.landscapeContainer.children.forEach(child => {
      if ((child as any).isTree) {
        child.visible = zoomLevel !== 'far';
      }
    });
    
    // Street markings visible only at near zoom
    this.roadContainer.children.forEach(child => {
      if ((child as any).isStreetMarking) {
        child.visible = zoomLevel === 'near';
      }
    });
    
    // Restaurant labels visible at medium and near zoom
    this.poiSprites.forEach((sprite) => {
      if (sprite instanceof PIXI.Container) {
        // Show more detail at closer zoom
        sprite.alpha = zoomLevel === 'far' ? 0.8 : 1.0;
      }
    });
    
    // Show neighborhood blocks at far zoom
    if (zoomLevel === 'far') {
      this.showNeighborhoodBlocks();
    } else {
      this.hideNeighborhoodBlocks();
    }
  }

  private showNeighborhoodBlocks(): void {
    // Create simplified neighborhood representations
    if (!this.layers.get('districts')?.getChildByName?.('neighborhood-blocks')) {
      const neighborhoodContainer = new PIXI.Container();
      neighborhoodContainer.name = 'neighborhood-blocks';
      
      // Create simplified blocks for each building area
      this.buildingBlocks.forEach((block, index) => {
        const graphics = new PIXI.Graphics();
        graphics.beginFill(this.BUILDING_COLORS[block.type], 0.6);
        graphics.drawRoundedRect(block.x, block.y, block.width, block.height, 10);
        graphics.endFill();
        
        graphics.lineStyle(2, 0x000000, 0.3);
        graphics.drawRoundedRect(block.x, block.y, block.width, block.height, 10);
        
        neighborhoodContainer.addChild(graphics);
        
        // Add neighborhood labels
        const style = new PIXI.TextStyle({
          fontFamily: 'Arial',
          fontSize: 18,
          fill: 'white',
          fontWeight: 'bold',
          stroke: '#000000',
          strokeThickness: 3,
        });
        
        const blockName = this.getNeighborhoodName(block.type, index);
        const label = new PIXI.Text(blockName, style);
        label.x = block.x + block.width / 2;
        label.y = block.y + block.height / 2;
        label.anchor.set(0.5);
        neighborhoodContainer.addChild(label);
      });
      
      this.layers.get('districts')?.addChild(neighborhoodContainer);
    }
    
    const neighborhoodBlocks = this.layers.get('districts')?.getChildByName?.('neighborhood-blocks');
    if (neighborhoodBlocks) {
      neighborhoodBlocks.visible = true;
    }
  }

  private hideNeighborhoodBlocks(): void {
    const neighborhoodBlocks = this.layers.get('districts')?.getChildByName?.('neighborhood-blocks');
    if (neighborhoodBlocks) {
      neighborhoodBlocks.visible = false;
    }
  }

  private getNeighborhoodName(type: string, index: number): string {
    const names = {
      residential: ['Maple Heights', 'Oak Gardens', 'Pine Valley', 'Cedar Park'],
      commercial: ['Downtown', 'Business District', 'Shopping Center', 'Market Square'],
      industrial: ['Industrial Park', 'Factory District', 'Warehouse Quarter'],
    };
    
    const typeNames = names[type as keyof typeof names] || ['Unknown Area'];
    return typeNames[index % typeNames.length] || `${type} ${index + 1}`;
  }

  // POI management
  addPOI(poi: POI): void {
    // Create a detailed restaurant building based on cuisine type
    const buildingContainer = new PIXI.Container();
    
    // Add a subtle lot background to distinguish restaurants
    const lotBackground = this.createRestaurantLot();
    buildingContainer.addChild(lotBackground);
    
    // Create the main building sprite
    const buildingSprite = this.createRestaurantBuilding(poi);
    buildingContainer.addChild(buildingSprite);
    
    // Add subtle highlight border for restaurants
    const highlight = this.createRestaurantHighlight();
    buildingContainer.addChild(highlight);
    
    // Add cuisine-specific decorations
    this.addRestaurantDecorations(buildingContainer, poi);
    
    buildingContainer.x = poi.x;
    buildingContainer.y = poi.y;
    buildingContainer.eventMode = 'static';
    buildingContainer.cursor = 'pointer';
    buildingContainer.zIndex = 10;

    // Add POI data
    (buildingContainer as any).poiData = poi;

    // Event handlers
    buildingContainer.on('pointerdown', () => this.onPOIClick(poi));
    buildingContainer.on('pointerover', () => this.showRestaurantLabel(poi, true));
    buildingContainer.on('pointerout', () => this.showRestaurantLabel(poi, false));

    // Visual state
    this.updatePOIVisual(buildingContainer, poi);

    this.poiSprites.set(poi.id, buildingContainer as any);
    this.layers.get('poi')!.addChild(buildingContainer);
  }

  private createRestaurantLot(): PIXI.Sprite {
    const graphics = new PIXI.Graphics();
    
    // Create a subtle lot background (slightly different from regular ground)
    graphics.beginFill(0x3a4a3a, 0.3); // Semi-transparent darker green
    graphics.drawRoundedRect(-30, -40, 60, 55, 3);
    graphics.endFill();
    
    const texture = this.app.renderer.generateTexture(graphics);
    return new PIXI.Sprite(texture);
  }

  private createRestaurantHighlight(): PIXI.Sprite {
    const graphics = new PIXI.Graphics();
    
    // Subtle highlight border
    graphics.lineStyle(1, 0xffd700, 0.6); // Gold outline with transparency
    graphics.drawRoundedRect(-27, -37, 54, 49, 4);
    
    const texture = this.app.renderer.generateTexture(graphics);
    return new PIXI.Sprite(texture);
  }

  private createRestaurantBuilding(poi: POI): PIXI.Sprite {
    const graphics = new PIXI.Graphics();
    const cuisineType = this.getCuisineType(poi);
    const buildingStyle = this.getBuildingStyleByCuisine(cuisineType);
    
    // Main building structure - reduced size from 70x60 to 50x45
    graphics.beginFill(buildingStyle.mainColor);
    graphics.drawRoundedRect(-25, -35, 50, 45, 4);
    graphics.endFill();
    
    // Building outline
    graphics.lineStyle(2, 0x2c2c2c, 1);
    graphics.drawRoundedRect(-25, -35, 50, 45, 4);
    
    // Roof style based on cuisine
    this.addRoof(graphics, cuisineType);
    
    // Windows - adjusted positions for smaller building
    graphics.beginFill(buildingStyle.windowColor);
    graphics.drawRect(-20, -28, 12, 12); // Left window
    graphics.drawRect(8, -28, 12, 12);   // Right window
    graphics.endFill();
    
    // Window frames
    graphics.lineStyle(1.5, 0x654321, 1);
    graphics.drawRect(-20, -28, 12, 12);
    graphics.drawRect(8, -28, 12, 12);
    
    // Door - adjusted for smaller building
    graphics.beginFill(buildingStyle.doorColor);
    graphics.drawRoundedRect(-8, -5, 16, 25, 2);
    graphics.endFill();
    
    // Door frame
    graphics.lineStyle(2, 0x000000, 1);
    graphics.drawRoundedRect(-10, -5, 20, 30, 3);
    
    // Door handle
    graphics.beginFill(0xffd700); // Gold handle
    graphics.drawCircle(6, 10, 2);
    graphics.endFill();
    
    // Restaurant sign
    graphics.beginFill(buildingStyle.signColor);
    graphics.drawRoundedRect(-30, -55, 60, 12, 2);
    graphics.endFill();
    
    graphics.lineStyle(2, 0x000000, 1);
    graphics.drawRoundedRect(-30, -55, 60, 12, 2);
    
    return new PIXI.Sprite(this.app.renderer.generateTexture(graphics));
  }

  private addRoof(graphics: PIXI.Graphics, cuisineType: string): void {
    graphics.lineStyle(0);
    
    switch (cuisineType) {
      case 'italian':
        // Red tile roof - adjusted for smaller building
        graphics.beginFill(0xcc4125);
        graphics.moveTo(-28, -35);
        graphics.lineTo(0, -50);
        graphics.lineTo(28, -35);
        graphics.closePath();
        graphics.endFill();
        break;
        
      case 'chinese':
        // Pagoda-style roof - adjusted for smaller building
        graphics.beginFill(0x8b0000);
        graphics.moveTo(-28, -35);
        graphics.lineTo(-14, -45);
        graphics.lineTo(0, -42);
        graphics.lineTo(14, -45);
        graphics.lineTo(28, -35);
        graphics.closePath();
        graphics.endFill();
        break;
        
      case 'mexican':
        // Flat adobe-style roof - adjusted for smaller building
        graphics.beginFill(0xd2691e);
        graphics.drawRect(-28, -38, 56, 4);
        graphics.endFill();
        break;
        
      default:
        // Standard peaked roof - adjusted for smaller building
        graphics.beginFill(0x8b4513);
        graphics.moveTo(-27, -35);
        graphics.lineTo(0, -47);
        graphics.lineTo(27, -35);
        graphics.closePath();
        graphics.endFill();
    }
  }

  private addRestaurantDecorations(container: PIXI.Container, poi: POI): void {
    const cuisineType = this.getCuisineType(poi);
    
    switch (cuisineType) {
      case 'italian':
        this.addItalianDecorations(container);
        break;
      case 'chinese':
        this.addChineseDecorations(container);
        break;
      case 'mexican':
        this.addMexicanDecorations(container);
        break;
      case 'american':
        this.addAmericanDecorations(container);
        break;
      case 'thai':
        this.addThaiDecorations(container);
        break;
      case 'indian':
        this.addIndianDecorations(container);
        break;
      case 'korean':
        this.addKoreanDecorations(container);
        break;
      case 'vietnamese':
        this.addVietnameseDecorations(container);
        break;
      case 'greek':
        this.addGreekDecorations(container);
        break;
      case 'brazilian':
        this.addBrazilianDecorations(container);
        break;
      case 'french':
        this.addFrenchDecorations(container);
        break;
      case 'lebanese':
        this.addLebaneseDecorations(container);
        break;
      case 'german':
        this.addGermanDecorations(container);
        break;
      case 'nigerian':
        this.addNigerianDecorations(container);
        break;
      case 'japanese':
        this.addJapaneseDecorations(container);
        break;
      case 'polish':
        this.addPolishDecorations(container);
        break;
      case 'egyptian':
        this.addEgyptianDecorations(container);
        break;
      case 'russian':
        this.addRussianDecorations(container);
        break;
      default:
        this.addAmericanDecorations(container);
        break;
    }
  }

  private addItalianDecorations(container: PIXI.Container): void {
    // Italian flag colors on awning
    const awning = new PIXI.Graphics();
    awning.beginFill(0x009246); // Green
    awning.drawRect(-25, -30, 10, 15);
    awning.beginFill(0xffffff); // White
    awning.drawRect(-15, -30, 10, 15);
    awning.beginFill(0xce2b37); // Red
    awning.drawRect(-5, -30, 10, 15);
    awning.endFill();
    container.addChild(awning);
  }

  private addChineseDecorations(container: PIXI.Container): void {
    // Red lanterns
    const lantern1 = new PIXI.Graphics();
    lantern1.beginFill(0xff0000);
    lantern1.drawCircle(-20, -25, 6);
    lantern1.endFill();
    
    const lantern2 = new PIXI.Graphics();
    lantern2.beginFill(0xff0000);
    lantern2.drawCircle(20, -25, 6);
    lantern2.endFill();
    
    container.addChild(lantern1);
    container.addChild(lantern2);
  }

  private addMexicanDecorations(container: PIXI.Container): void {
    // Colorful bunting
    const bunting = new PIXI.Graphics();
    const colors = [0xff6b6b, 0x4ecdc4, 0x45b7d1, 0xffd93d];
    for (let i = 0; i < 4; i++) {
      bunting.beginFill(colors[i]);
      bunting.moveTo(-30 + i * 15, -30);
      bunting.lineTo(-20 + i * 15, -20);
      bunting.lineTo(-10 + i * 15, -30);
      bunting.closePath();
      bunting.endFill();
    }
    container.addChild(bunting);
  }

  private addAmericanDecorations(container: PIXI.Container): void {
    // Classic diner sign
    const neonSign = new PIXI.Graphics();
    neonSign.lineStyle(3, 0x00ffff, 1);
    neonSign.drawRoundedRect(-25, -35, 50, 8, 2);
    container.addChild(neonSign);
  }

  private addThaiDecorations(container: PIXI.Container): void {
    // Golden decorative elements
    const decoration = new PIXI.Graphics();
    decoration.beginFill(0xffd700);
    decoration.drawRect(-3, -40, 6, 15);
    decoration.drawCircle(0, -45, 4);
    decoration.endFill();
    container.addChild(decoration);
  }

  private addIndianDecorations(container: PIXI.Container): void {
    // Colorful mandala-style decoration
    const mandala = new PIXI.Graphics();
    mandala.beginFill(0xff6b35);
    mandala.drawCircle(0, -35, 8);
    mandala.beginFill(0xf7931e);
    mandala.drawCircle(0, -35, 5);
    mandala.endFill();
    container.addChild(mandala);
  }

  // New cuisine decorations - simplified versions for now
  private addKoreanDecorations(container: PIXI.Container): void {
    // Korean flag colors (red and blue elements)
    const decoration = new PIXI.Graphics();
    decoration.beginFill(0xff0000);
    decoration.drawCircle(-10, -35, 4);
    decoration.beginFill(0x0000ff);
    decoration.drawCircle(10, -35, 4);
    decoration.endFill();
    container.addChild(decoration);
  }

  private addVietnameseDecorations(container: PIXI.Container): void {
    // Yellow star (Vietnam flag element)
    const star = new PIXI.Graphics();
    star.beginFill(0xffff00);
    // Simple 5-pointed star using polygon
    star.drawPolygon([
      0, -41,      // top
      -3, -33,     // top left
      -8, -33,     // left
      -4, -29,     // bottom left
      -6, -22,     // bottom
      0, -27,      // center
      6, -22,      // bottom right
      4, -29,      // bottom right
      8, -33,      // right
      3, -33       // top right
    ]);
    star.endFill();
    container.addChild(star);
  }

  private addGreekDecorations(container: PIXI.Container): void {
    // Blue and white elements (Greek flag colors)
    const decoration = new PIXI.Graphics();
    decoration.beginFill(0x0066cc);
    decoration.drawRect(-15, -40, 30, 4);
    decoration.beginFill(0xffffff);
    decoration.drawRect(-15, -36, 30, 4);
    decoration.endFill();
    container.addChild(decoration);
  }

  private addBrazilianDecorations(container: PIXI.Container): void {
    // Green and yellow (Brazil flag colors)
    const decoration = new PIXI.Graphics();
    decoration.beginFill(0x00a859);
    decoration.drawCircle(-8, -35, 5);
    decoration.beginFill(0xfeed00);
    decoration.drawCircle(8, -35, 5);
    decoration.endFill();
    container.addChild(decoration);
  }

  private addFrenchDecorations(container: PIXI.Container): void {
    // Tricolor stripes
    const decoration = new PIXI.Graphics();
    decoration.beginFill(0x0055a4);
    decoration.drawRect(-15, -40, 10, 8);
    decoration.beginFill(0xffffff);
    decoration.drawRect(-5, -40, 10, 8);
    decoration.beginFill(0xef4135);
    decoration.drawRect(5, -40, 10, 8);
    decoration.endFill();
    container.addChild(decoration);
  }

  private addLebaneseDecorations(container: PIXI.Container): void {
    // Cedar tree element (Lebanon symbol)
    const cedar = new PIXI.Graphics();
    cedar.beginFill(0x00a859);
    cedar.drawPolygon([0, -40, -6, -30, 6, -30]);
    cedar.endFill();
    container.addChild(cedar);
  }

  private addGermanDecorations(container: PIXI.Container): void {
    // Black, red, gold stripes
    const decoration = new PIXI.Graphics();
    decoration.beginFill(0x000000);
    decoration.drawRect(-15, -42, 30, 3);
    decoration.beginFill(0xff0000);
    decoration.drawRect(-15, -39, 30, 3);
    decoration.beginFill(0xffd700);
    decoration.drawRect(-15, -36, 30, 3);
    decoration.endFill();
    container.addChild(decoration);
  }

  private addNigerianDecorations(container: PIXI.Container): void {
    // Green and white (Nigeria flag colors)
    const decoration = new PIXI.Graphics();
    decoration.beginFill(0x008751);
    decoration.drawRect(-15, -40, 10, 8);
    decoration.beginFill(0xffffff);
    decoration.drawRect(-5, -40, 10, 8);
    decoration.beginFill(0x008751);
    decoration.drawRect(5, -40, 10, 8);
    decoration.endFill();
    container.addChild(decoration);
  }

  private addJapaneseDecorations(container: PIXI.Container): void {
    // Red circle (Japanese flag)
    const decoration = new PIXI.Graphics();
    decoration.beginFill(0xff0000);
    decoration.drawCircle(0, -35, 6);
    decoration.endFill();
    container.addChild(decoration);
  }

  private addPolishDecorations(container: PIXI.Container): void {
    // White and red stripes
    const decoration = new PIXI.Graphics();
    decoration.beginFill(0xffffff);
    decoration.drawRect(-15, -40, 30, 4);
    decoration.beginFill(0xff0000);
    decoration.drawRect(-15, -36, 30, 4);
    decoration.endFill();
    container.addChild(decoration);
  }

  private addEgyptianDecorations(container: PIXI.Container): void {
    // Pyramid shape in gold
    const pyramid = new PIXI.Graphics();
    pyramid.beginFill(0xffd700);
    pyramid.drawPolygon([0, -40, -8, -30, 8, -30]);
    pyramid.endFill();
    container.addChild(pyramid);
  }

  private addRussianDecorations(container: PIXI.Container): void {
    // White, blue, red stripes
    const decoration = new PIXI.Graphics();
    decoration.beginFill(0xffffff);
    decoration.drawRect(-15, -42, 30, 3);
    decoration.beginFill(0x0039a6);
    decoration.drawRect(-15, -39, 30, 3);
    decoration.beginFill(0xd52b1e);
    decoration.drawRect(-15, -36, 30, 3);
    decoration.endFill();
    container.addChild(decoration);
  }

  private getCuisineType(poi: POI): string {
    const restaurantData = poi.data as any;
    return restaurantData?.cuisine?.toLowerCase() || 'american';
  }

  private getBuildingStyleByCuisine(cuisine: string): {mainColor: number, windowColor: number, doorColor: number, signColor: number} {
    const styles = {
      italian: { mainColor: 0xfaf0e6, windowColor: 0x87ceeb, doorColor: 0x8b4513, signColor: 0x009246 },
      chinese: { mainColor: 0xdc143c, windowColor: 0xffd700, doorColor: 0x8b0000, signColor: 0xff0000 },
      mexican: { mainColor: 0xdaa520, windowColor: 0x00ced1, doorColor: 0xd2691e, signColor: 0xff6347 },
      american: { mainColor: 0xb0c4de, windowColor: 0xffffff, doorColor: 0x4169e1, signColor: 0xff1493 },
      thai: { mainColor: 0xffd700, windowColor: 0xff6347, doorColor: 0xff4500, signColor: 0xdc143c },
      indian: { mainColor: 0xff7f50, windowColor: 0x40e0d0, doorColor: 0xff4500, signColor: 0xffd700 },
      korean: { mainColor: 0xff69b4, windowColor: 0x00ff7f, doorColor: 0x8b008b, signColor: 0xff1493 },
      vietnamese: { mainColor: 0x20b2aa, windowColor: 0xffff00, doorColor: 0x006400, signColor: 0xff0000 },
      greek: { mainColor: 0x4169e1, windowColor: 0xffffff, doorColor: 0x191970, signColor: 0x00bfff },
      brazilian: { mainColor: 0x32cd32, windowColor: 0xffff00, doorColor: 0x006400, signColor: 0xff4500 },
      french: { mainColor: 0xf0f8ff, windowColor: 0x4169e1, doorColor: 0x8b4513, signColor: 0xff0000 },
      lebanese: { mainColor: 0xfaebd7, windowColor: 0xdaa520, doorColor: 0x8b4513, signColor: 0x228b22 },
      german: { mainColor: 0xd2b48c, windowColor: 0x4682b4, doorColor: 0x8b4513, signColor: 0xffd700 },
      nigerian: { mainColor: 0x228b22, windowColor: 0xffffff, doorColor: 0x006400, signColor: 0xffd700 },
      japanese: { mainColor: 0xdc143c, windowColor: 0xffffff, doorColor: 0x8b0000, signColor: 0xff1493 },
      polish: { mainColor: 0xffffff, windowColor: 0xdc143c, doorColor: 0x8b4513, signColor: 0xff0000 },
      egyptian: { mainColor: 0xdaa520, windowColor: 0x4169e1, doorColor: 0x8b4513, signColor: 0xffd700 },
      russian: { mainColor: 0x4682b4, windowColor: 0xffffff, doorColor: 0x191970, signColor: 0xff0000 },
    };
    
    return styles[cuisine as keyof typeof styles] || styles.american;
  }

  private showRestaurantLabel(poi: POI, show: boolean): void {
    // Create/remove hover label
    const labelId = `label_${poi.id}`;
    const existingLabel = this.layers.get('ui')?.getChildByName?.(labelId);
    
    if (show && !existingLabel) {
      const style = new PIXI.TextStyle({
        fontFamily: 'Arial',
        fontSize: 16,
        fill: 'white',
        fontWeight: 'bold',
        stroke: '#000000',
        strokeThickness: 4,
        dropShadow: true,
        dropShadowDistance: 2,
        dropShadowAngle: Math.PI / 4,
        dropShadowColor: 0x000000,
        dropShadowAlpha: 0.7
      });
      
      const label = new PIXI.Text(poi.name, style);
      label.name = labelId;
      label.x = poi.x;
      label.y = poi.y - 70;
      label.anchor.set(0.5);
      label.zIndex = 100;
      
      this.layers.get('ui')?.addChild(label);
    } else if (!show && existingLabel) {
      this.layers.get('ui')?.removeChild(existingLabel);
    }
  }

  private getBuildingColorByCuisine(poi: POI): number {
    const restaurantData = poi.data as any;
    const cuisine = restaurantData?.cuisine?.toLowerCase() || 'unknown';
    
    // Colors that match different cuisine types
    switch (cuisine) {
      case 'italian': return 0xe74c3c;    // Red
      case 'chinese': return 0xf1c40f;    // Golden yellow
      case 'indian': return 0xe67e22;     // Orange
      case 'mexican': return 0x27ae60;    // Green
      case 'american': return 0x3498db;   // Blue
      case 'japanese': return 0x9b59b6;   // Purple
      case 'korean': return 0xff1493;     // Deep pink
      case 'vietnamese': return 0x20b2aa; // Light sea green
      case 'greek': return 0x4169e1;      // Royal blue
      case 'brazilian': return 0x32cd32;  // Lime green
      case 'french': return 0x4169e1;     // Royal blue
      case 'lebanese': return 0xdaa520;   // Goldenrod
      case 'german': return 0xd2b48c;     // Tan
      case 'nigerian': return 0x228b22;   // Forest green
      case 'polish': return 0xdc143c;     // Crimson
      case 'egyptian': return 0xdaa520;   // Goldenrod
      case 'thai': return 0xff4500;       // Orange red
      case 'russian': return 0x4682b4;    // Steel blue
      default: return 0x95a5a6;           // Gray
    }
  }

  removePOI(poiId: number): void {
    const sprite = this.poiSprites.get(poiId);
    if (sprite) {
      this.layers.get('poi')!.removeChild(sprite);
      this.returnSpriteToPool(sprite);
      this.poiSprites.delete(poiId);
    }
  }

  updatePOI(poi: POI): void {
    const sprite = this.poiSprites.get(poi.id);
    if (sprite) {
      (sprite as any).poiData = poi;
      this.updatePOIVisual(sprite, poi);
    }
  }

  private updatePOIVisual(sprite: PIXI.Sprite | PIXI.Container, poi: POI): void {
    // Update visual state based on POI data
    sprite.alpha = poi.unlocked ? 1 : 0.5;
    
    // For containers, apply tint to the first child (main building)
    if (sprite instanceof PIXI.Container && sprite.children.length > 0) {
      (sprite.children[0] as PIXI.Sprite).tint = poi.discoveredShards > 0 ? 0xffd700 : 0xffffff;
    } else if (sprite instanceof PIXI.Sprite) {
      sprite.tint = poi.discoveredShards > 0 ? 0xffd700 : 0xffffff;
    }

    // Scale based on importance
    const importance = poi.discoveredShards / Math.max(1, poi.totalShards);
    sprite.scale.set(0.8 + importance * 0.4);
  }

  private getTextureNameForPOI(poi: POI): string {
    switch (poi.type) {
      case 'restaurant': return 'restaurant_icon';
      case 'landmark': return 'landmark_icon';
      default: return 'restaurant_icon';
    }
  }

  // Sprite pooling for performance
  private getPooledSprite(texture: PIXI.Texture): PIXI.Sprite {
    if (this.poiPool.length > 0) {
      const sprite = this.poiPool.pop()!;
      sprite.texture = texture;
      return sprite;
    }
    return new PIXI.Sprite(texture);
  }

  private returnSpriteToPool(sprite: PIXI.Sprite): void {
    sprite.removeAllListeners();
    sprite.alpha = 1;
    sprite.tint = 0xffffff;
    sprite.scale.set(1);
    (sprite as any).poiData = null;
    this.poiPool.push(sprite);
  }

  // Culling for performance with improved batching
  private cullPOIs(): void {
    const viewBounds = this.getViewBounds();
    const zoom = this.camera.zoom;
    
    this.poiSprites.forEach((sprite) => {
      const poi = (sprite as any).poiData as POI;
      const isInView = this.isPointInBounds(poi.x, poi.y, viewBounds);
      
      // Enhanced culling based on zoom level and importance
      const shouldShow = isInView && this.shouldShowAtZoomLevel(poi, zoom);
      sprite.visible = shouldShow;
      
      // Performance optimization: reduce detail for distant objects
      if (shouldShow && zoom < 1.0) {
        sprite.alpha = Math.max(0.3, zoom);
      } else if (shouldShow) {
        sprite.alpha = 1.0;
      }
    });
    
    // Cull building sprites based on zoom and view
    this.cullBuildingSprites(viewBounds, zoom);
    
    // Cull landscape elements
    this.cullLandscapeElements(viewBounds, zoom);
  }

  private cullBuildingSprites(viewBounds: PIXI.Rectangle, zoom: number): void {
    if (zoom < 0.5) {
      // Hide all individual buildings at very far zoom
      this.buildingSprites.visible = false;
      return;
    }
    
    this.buildingSprites.visible = true;
    
    // Batch cull buildings outside view
    this.buildingSprites.children.forEach(building => {
      const isInView = this.isPointInBounds(building.x, building.y, viewBounds);
      building.visible = isInView;
      
      // Reduce quality for distant buildings
      if (isInView && zoom < 0.8) {
        building.alpha = 0.7;
        (building as PIXI.Sprite).texture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
      } else if (isInView) {
        building.alpha = 1.0;
        (building as PIXI.Sprite).texture.baseTexture.scaleMode = PIXI.SCALE_MODES.LINEAR;
      }
    });
  }

  private cullLandscapeElements(viewBounds: PIXI.Rectangle, zoom: number): void {
    // Batch process landscape elements
    this.landscapeContainer.children.forEach(element => {
      const isInView = this.isPointInBounds(element.x, element.y, viewBounds);
      
      // Trees and decorative elements only visible at medium+ zoom
      if ((element as any).isTree || (element as any).isDecoration) {
        element.visible = isInView && zoom > 0.6;
      } else {
        element.visible = isInView;
      }
    });
  }

  private shouldShowAtZoomLevel(poi: POI, zoom: number): boolean {
    // Important POIs (restaurants) always visible
    if (poi.type === 'restaurant') {
      return true;
    }
    
    // Other POIs based on zoom level
    if (zoom < 0.7) {
      return poi.discoveredShards > 0; // Only discovered landmarks at far zoom
    }
    
    return true;
  }

  private getViewBounds(): PIXI.Rectangle {
    const padding = 100; // Extra padding for smoother culling
    const worldX = (this.camera.x - this.app.screen.width / 2 / this.camera.zoom) - padding;
    const worldY = (this.camera.y - this.app.screen.height / 2 / this.camera.zoom) - padding;
    const worldWidth = (this.app.screen.width / this.camera.zoom) + padding * 2;
    const worldHeight = (this.app.screen.height / this.camera.zoom) + padding * 2;
    
    return new PIXI.Rectangle(worldX, worldY, worldWidth, worldHeight);
  }

  private isPointInBounds(x: number, y: number, bounds: PIXI.Rectangle): boolean {
    return x >= bounds.x && x <= bounds.x + bounds.width &&
           y >= bounds.y && y <= bounds.y + bounds.height;
  }

  // Event handlers
  private isDragging = false;
  private lastPointerPosition = { x: 0, y: 0 };

  private onPointerDown(event: PIXI.FederatedPointerEvent): void {
    this.isDragging = true;
    this.lastPointerPosition = { x: event.global.x, y: event.global.y };
  }

  private onPointerMove(event: PIXI.FederatedPointerEvent): void {
    if (!this.isDragging) return;

    const deltaX = event.global.x - this.lastPointerPosition.x;
    const deltaY = event.global.y - this.lastPointerPosition.y;

    this.setCameraTarget(
      this.camera.targetX - deltaX / this.camera.zoom,
      this.camera.targetY - deltaY / this.camera.zoom,
      this.camera.targetZoom
    );

    this.lastPointerPosition = { x: event.global.x, y: event.global.y };
  }

  private onPointerUp(): void {
    this.isDragging = false;
  }

  private onWheel(event: WheelEvent): void {
    event.preventDefault();
    
    const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = this.camera.targetZoom * zoomFactor;
    
    this.setCameraTarget(this.camera.targetX, this.camera.targetY, newZoom);
  }

  private onKeyDown(event: KeyboardEvent): void {
    const key = event.key.toLowerCase();
    
    // Handle debug keys
    switch (event.key) {
      case '~':
        this.toggleDebugMode();
        return;
      case 'm':
      case 'M':
        this.eventBus.dispatchEvent(new CustomEvent('toggleMoodOverlay'));
        return;
      case 'e':
      case 'E':
        this.handleInteraction();
        return;
    }

    // Handle movement keys
    this.keysPressed.add(key);
    
    // Prevent default for movement keys to avoid page scrolling
    if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
      event.preventDefault();
    }
  }

  private onPOIClick(poi: POI): void {
    useGameStore.getState().selectPOI(poi.id);
    this.eventBus.dispatchEvent(new CustomEvent('poiClick', { detail: poi }));
  }

  private onPOIHover(poi: POI, isHovering: boolean): void {
    this.eventBus.dispatchEvent(new CustomEvent('poiHover', { 
      detail: { poi, isHovering } 
    }));
  }

  private onKeyUp(event: KeyboardEvent): void {
    const key = event.key.toLowerCase();
    this.keysPressed.delete(key);
  }

  // Enhanced player movement with collision detection and pathfinding
  private updatePlayer(deltaTime: number): void {
    if (!this.playerSprite) return;

    const gameStore = useGameStore.getState();
    const player = gameStore.player;
    let deltaX = 0;
    let deltaY = 0;
    let newFacing = player.facing;

    // Calculate movement based on pressed keys
    const moveSpeed = player.speed * (deltaTime / 1000); // Convert to pixels per frame

    if (this.keysPressed.has('w') || this.keysPressed.has('arrowup')) {
      deltaY -= moveSpeed;
      newFacing = 'up';
    }
    if (this.keysPressed.has('s') || this.keysPressed.has('arrowdown')) {
      deltaY += moveSpeed;
      newFacing = 'down';
    }
    if (this.keysPressed.has('a') || this.keysPressed.has('arrowleft')) {
      deltaX -= moveSpeed;
      newFacing = 'left';
    }
    if (this.keysPressed.has('d') || this.keysPressed.has('arrowright')) {
      deltaX += moveSpeed;
      newFacing = 'right';
    }

    // Apply movement if any keys are pressed
    if (deltaX !== 0 || deltaY !== 0) {
      const targetX = player.x + deltaX;
      const targetY = player.y + deltaY;

      // Check collision detection using the organic city layout
      let newX = player.x;
      let newY = player.y;

      if (this.cityLayout) {
        // Use collision detection with the tile grid
        if (this.isPositionWalkable(targetX, targetY)) {
          newX = targetX;
          newY = targetY;
        } else {
          // Try to move only horizontally or vertically if diagonal movement is blocked
          if (this.isPositionWalkable(targetX, player.y)) {
            newX = targetX;
          } else if (this.isPositionWalkable(player.x, targetY)) {
            newY = targetY;
          }
          // If neither direction works, stay in place
        }
      } else {
        // Fallback to old boundary checking
        const constrainedPos = this.constrainToMapBounds(targetX, targetY);
        newX = constrainedPos.x;
        newY = constrainedPos.y;
      }

      // Update game state only if position changed
      if (newX !== player.x || newY !== player.y) {
        gameStore.movePlayer(newX, newY);
        if (newFacing !== player.facing) {
          gameStore.setPlayerFacing(newFacing);
        }
        gameStore.setPlayerMoving(true);

        // Update sprite position and rotation
        this.updatePlayerPosition(newX, newY);
        this.updatePlayerFacing(newFacing);

        // Update player animation state
        this.playerIdleAnimation.isMoving = true;

        // Check for restaurant interactions
        this.checkRestaurantInteractions(newX, newY);
      }
    } else {
      // Player stopped moving
      if (player.isMoving) {
        gameStore.setPlayerMoving(false);
        this.playerIdleAnimation.isMoving = false;
      }
    }
  }

  /**
   * Check if a position is walkable using the organic city layout
   */
  private isPositionWalkable(x: number, y: number): boolean {
    if (!this.cityLayout) {
      return true; // Fallback to allowing movement
    }

    const TILE_SIZE = 16;
    const tileX = Math.floor(x / TILE_SIZE);
    const tileY = Math.floor(y / TILE_SIZE);
    
    // Check bounds
    if (tileX < 0 || tileX >= this.cityLayout.tileGrid[0]?.length || 
        tileY < 0 || tileY >= this.cityLayout.tileGrid.length) {
      return false;
    }
    
    return this.cityLayout.tileGrid[tileY][tileX].walkable;
  }

  /**
   * Find a path to a target position using pathfinding
   * This can be used for click-to-move or AI navigation
   */
  public findPathToPosition(targetX: number, targetY: number): Array<{ x: number; y: number }> {
    if (!this.cityLayout) {
      return [];
    }

    const gameStore = useGameStore.getState();
    const player = gameStore.player;
    
    const result = this.pathfinder.findPath(player.x, player.y, targetX, targetY);
    return result.path;
  }

  /**
   * Move player along a calculated path (for future click-to-move feature)
   */
  public movePlayerAlongPath(path: Array<{ x: number; y: number }>): void {
    if (path.length === 0) return;
    
    // For now, just move to the first point
    // TODO: Implement smooth path following animation
    const target = path[0];
    const gameStore = useGameStore.getState();
    gameStore.movePlayer(target.x, target.y);
    this.updatePlayerPosition(target.x, target.y);
  }

  /**
   * Find the nearest walkable position to a given point
   */
  private findNearestWalkablePosition(x: number, y: number): { x: number; y: number } | null {
    if (!this.cityLayout) {
      return { x, y };
    }

    const TILE_SIZE = 16;
    const maxRadius = 50; // Search within 50 tiles
    
    // Check if the current position is already walkable
    if (this.isPositionWalkable(x, y)) {
      return { x, y };
    }
    
    // Search in expanding circles
    for (let radius = 1; radius <= maxRadius; radius++) {
      for (let angle = 0; angle < 360; angle += 15) {
        const radians = (angle * Math.PI) / 180;
        const checkX = x + Math.cos(radians) * radius * TILE_SIZE;
        const checkY = y + Math.sin(radians) * radius * TILE_SIZE;
        
        if (this.isPositionWalkable(checkX, checkY)) {
          return { x: checkX, y: checkY };
        }
      }
    }
    
    return null;
  }

  private constrainToMapBounds(x: number, y: number): {x: number, y: number} {
    const bounds = (this as any).mapBounds;
    if (!bounds) {
      // Fallback bounds using new map dimensions
      return {
        x: Math.max(50, Math.min(this.MAP_WIDTH - 50, x)),
        y: Math.max(50, Math.min(this.MAP_HEIGHT - 50, y))
      };
    }
    
    return {
      x: Math.max(bounds.left, Math.min(bounds.right, x)),
      y: Math.max(bounds.top, Math.min(bounds.bottom, y))
    };
  }

  private checkCameraFollowPlayer(playerX: number, playerY: number): void {
    // Calculate player position on screen
    const screenCenterX = this.app.screen.width / 2;
    const screenCenterY = this.app.screen.height / 2;
    
    // Convert player world position to screen position
    const playerScreenX = (playerX - this.camera.x) * this.camera.zoom + screenCenterX;
    const playerScreenY = (playerY - this.camera.y) * this.camera.zoom + screenCenterY;
    
    // Define the "comfortable zone" - camera only follows if player leaves this area
    const comfortZoneWidth = this.app.screen.width * 0.3; // 30% of screen width
    const comfortZoneHeight = this.app.screen.height * 0.3; // 30% of screen height
    
    const leftBound = screenCenterX - comfortZoneWidth / 2;
    const rightBound = screenCenterX + comfortZoneWidth / 2;
    const topBound = screenCenterY - comfortZoneHeight / 2;
    const bottomBound = screenCenterY + comfortZoneHeight / 2;
    
    // Only move camera if player is outside the comfort zone
    let shouldMoveCamera = false;
    let newCameraX = this.camera.targetX;
    let newCameraY = this.camera.targetY;
    
    if (playerScreenX < leftBound) {
      newCameraX = playerX - (leftBound - screenCenterX) / this.camera.zoom;
      shouldMoveCamera = true;
    } else if (playerScreenX > rightBound) {
      newCameraX = playerX - (rightBound - screenCenterX) / this.camera.zoom;
      shouldMoveCamera = true;
    }
    
    if (playerScreenY < topBound) {
      newCameraY = playerY - (topBound - screenCenterY) / this.camera.zoom;
      shouldMoveCamera = true;
    } else if (playerScreenY > bottomBound) {
      newCameraY = playerY - (bottomBound - screenCenterY) / this.camera.zoom;
      shouldMoveCamera = true;
    }
    
    if (shouldMoveCamera) {
      this.setCameraTarget(newCameraX, newCameraY, this.camera.zoom);
    }
  }

  private checkRestaurantInteractions(playerX: number, playerY: number): void {
    const interactionDistance = 60; // Distance in pixels to interact with restaurants
    
    // Check all POI sprites for proximity
    this.poiSprites.forEach((sprite, poiId) => {
      const poiData = (sprite as any).poiData as POI;
      if (poiData.type === 'restaurant') {
        const distance = Math.sqrt(
          Math.pow(playerX - sprite.x, 2) + Math.pow(playerY - sprite.y, 2)
        );
        
        if (distance <= interactionDistance) {
          // Show interaction prompt (could be a UI element)
          this.showInteractionPrompt(poiData);
        }
      }
    });
  }

  private showInteractionPrompt(poi: POI): void {
    // Dispatch to window for React components to listen
    window.dispatchEvent(new CustomEvent('restaurantNearby', { 
      detail: { poi, message: `Press E to investigate ${poi.name}` }
    }));
  }

  private handleInteraction(): void {
    const gameStore = useGameStore.getState();
    const playerX = gameStore.player.x;
    const playerY = gameStore.player.y;
    const interactionDistance = 60;
    
    // Find the nearest restaurant within interaction distance
    let nearestRestaurant: POI | null = null;
    let nearestDistance = Infinity;
    
    this.poiSprites.forEach((sprite) => {
      const poiData = (sprite as any).poiData as POI;
      if (poiData && poiData.type === 'restaurant') {
        const distance = Math.sqrt(
          Math.pow(playerX - sprite.x, 2) + Math.pow(playerY - sprite.y, 2)
        );
        
        if (distance <= interactionDistance && distance < nearestDistance) {
          nearestDistance = distance;
          nearestRestaurant = poiData;
        }
      }
    });
    
    if (nearestRestaurant) {
      // Start investigation at this restaurant
      window.dispatchEvent(new CustomEvent('investigateRestaurant', { 
        detail: { poi: nearestRestaurant }
      }));
      
      // Select the POI in the game state
      gameStore.selectPOI(nearestRestaurant.id);
      
      console.log(`Investigating ${nearestRestaurant.name}...`);
      
      // Generate a clue about player identity
      this.generateIdentityClue(nearestRestaurant);
    } else {
      console.log('No restaurant nearby to investigate');
    }
  }

  private generateIdentityClue(restaurant: POI): void {
    const gameStore = useGameStore.getState();
    
    // Simple clue generation based on restaurant type
    const clues = [
      `You feel familiar with the smell of ${restaurant.name}. Have you been here before?`,
      `The staff at ${restaurant.name} seem to recognize you, but can't quite place your face.`,
      `Looking at the menu at ${restaurant.name}, certain dishes trigger vague memories.`,
      `You notice a receipt in your pocket from ${restaurant.name} dated last week.`,
      `The music playing at ${restaurant.name} reminds you of something... someone?`,
      `You find yourself knowing exactly where the restroom is at ${restaurant.name}.`,
    ];
    
    const randomClue = clues[Math.floor(Math.random() * clues.length)];
    
    // Dispatch an event to show the clue in the UI
    window.dispatchEvent(new CustomEvent('identityClueFound', { 
      detail: { 
        restaurant: restaurant.name,
        clue: randomClue,
        timestamp: new Date()
      }
    }));
    
    // Add trait discovery based on restaurant cuisine
    const restaurantData = restaurant.data as any;
    const cuisine = restaurantData?.cuisine || 'unknown';
    
    // Update player traits based on discovered preferences
    const traitUpdates: any = {};
    
    switch (cuisine.toLowerCase()) {
      case 'italian':
        traitUpdates.loyalRegular = 5;
        break;
      case 'chinese':
        traitUpdates.spiceSeeker = 3;
        break;
      case 'indian':
        traitUpdates.spiceSeeker = 7;
        break;
      case 'mexican':
        traitUpdates.spiceSeeker = 5;
        traitUpdates.socialDiner = 3;
        break;
      case 'american':
        traitUpdates.budgetSaver = 4;
        break;
      case 'japanese':
        traitUpdates.healthConscious = 6;
        break;
    }
    
    if (Object.keys(traitUpdates).length > 0) {
      gameStore.updateTraits(traitUpdates);
      console.log(`Identity clues discovered! Updated traits:`, traitUpdates);
    }
  }

  private updatePerformanceDisplay(): void {
    // Update FPS counter if debug mode is enabled
    if (this.debugMode && this.fpsDisplay) {
      this.frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - this.lastFrameTime >= 1000) { // Update every second
        const fps = Math.round(this.frameCount * 1000 / (currentTime - this.lastFrameTime));
        this.fpsDisplay.text = `FPS: ${fps}\nSprites: ${this.getActiveSpritesCount()}\nZoom: ${this.camera.zoom.toFixed(2)}\nRes: ${this.app.screen.width}x${this.app.screen.height}`;
        this.frameCount = 0;
        this.lastFrameTime = currentTime;
        
        // Performance optimization based on FPS
        this.optimizePerformanceBasedOnFPS(fps);
      }
    }
  }

  private getActiveSpritesCount(): number {
    let count = 0;
    count += this.poiSprites.size;
    count += this.buildingSprites.children.length;
    count += this.landscapeContainer.children.length;
    count += this.roadContainer.children.length;
    return count;
  }

  private optimizePerformanceBasedOnFPS(fps: number): void {
    // Adjust quality settings based on performance
    if (fps < 30) {
      // Low performance mode
      this.setQualityMode('low');
    } else if (fps < 45) {
      // Medium performance mode  
      this.setQualityMode('medium');
    } else {
      // High performance mode
      this.setQualityMode('high');
    }
  }

  private setQualityMode(mode: 'low' | 'medium' | 'high'): void {
    switch (mode) {
      case 'low':
        // Reduce detail for performance
        this.playerIdleAnimation.frequency = 1; // Slower animation
        this.app.ticker.maxFPS = 30;
        break;
      case 'medium':
        this.playerIdleAnimation.frequency = 1.5;
        this.app.ticker.maxFPS = 45;
        break;
      case 'high':
        this.playerIdleAnimation.frequency = 2; // Normal animation
        this.app.ticker.maxFPS = 60;
        break;
    }
  }

  // Debug and performance
  private toggleDebugMode(): void {
    this.debugMode = !this.debugMode;
    
    if (this.debugMode) {
      this.createFPSDisplay();
    } else {
      this.removeFPSDisplay();
    }
  }

  private createFPSDisplay(): void {
    if (this.fpsDisplay) return;
    
    this.fpsDisplay = new PIXI.Text('FPS: 0', {
      fontFamily: 'Arial',
      fontSize: 16,
      fill: 0xffffff,
    });
    
    this.fpsDisplay.x = 10;
    this.fpsDisplay.y = 10;
    this.layers.get('ui')!.addChild(this.fpsDisplay);
  }

  private removeFPSDisplay(): void {
    if (this.fpsDisplay) {
      this.layers.get('ui')!.removeChild(this.fpsDisplay);
      this.fpsDisplay = undefined;
    }
  }

  private updateDebugInfo(): void {
    if (!this.debugMode || !this.fpsDisplay) return;

    const currentTime = performance.now();
    this.frameCount++;

    if (currentTime - this.lastFrameTime >= 1000) {
      const fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastFrameTime));
      this.fpsDisplay.text = `FPS: ${fps} | POIs: ${this.poiSprites.size} | Zoom: ${this.camera.zoom.toFixed(2)}`;
      
      this.frameCount = 0;
      this.lastFrameTime = currentTime;
    }
  }

  // Main update loop
  private update(_delta: number): void {
    this.updateCamera();
    this.cullPOIs();
    this.updateDebugInfo();
  }

  private handleResize(): void {
    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight;
    
    // Resize the renderer
    this.app.renderer.resize(newWidth, newHeight);
    
    // Update camera transform for all world layers to maintain proper centering
    this.updateCameraAfterResize();
    
    // Keep player centered after resize
    this.centerPlayerAfterResize();
    
    // Update any UI elements that need repositioning
    this.updateUIAfterResize();
  }

  private updateCameraAfterResize(): void {
    // Apply camera transform to world layers with new screen dimensions
    const worldLayers = ['base', 'districts', 'poi', 'effects'];
    worldLayers.forEach(layerName => {
      const layer = this.layers.get(layerName);
      if (layer) {
        layer.x = -this.camera.x * this.camera.zoom + this.app.screen.width / 2;
        layer.y = -this.camera.y * this.camera.zoom + this.app.screen.height / 2;
        layer.scale.set(this.camera.zoom);
      }
    });
  }

  private centerPlayerAfterResize(): void {
    // Get current player position from game store
    const gameStore = useGameStore.getState();
    const playerX = gameStore.player.x;
    const playerY = gameStore.player.y;
    
    // Update camera to keep player centered
    this.setCameraTarget(playerX, playerY, this.camera.zoom);
  }

  private updateUIAfterResize(): void {
    // Update any UI elements that depend on screen size
    // (HUD overlays should automatically adjust via CSS)
    
    // Update debug info position if visible
    if (this.fpsDisplay) {
      this.fpsDisplay.x = this.app.screen.width - 180;
      this.fpsDisplay.y = 10;
    }
    
    // Adjust quality based on screen size for mobile optimization
    this.adjustQualityForScreenSize();
    
    // Recalculate view bounds for culling
    this.cullPOIs();
  }

  private adjustQualityForScreenSize(): void {
    const screenArea = this.app.screen.width * this.app.screen.height;
    const isSmallScreen = screenArea < 800 * 600; // Less than 800x600
    const isMobileAspect = this.app.screen.width < this.app.screen.height; // Portrait mode
    
    if (isSmallScreen || isMobileAspect) {
      // Mobile/small screen optimizations
      this.setQualityMode('medium');
      
      // Reduce particle effects and complexity
      this.landscapeContainer.children.forEach(child => {
        if ((child as any).isDecoration) {
          child.visible = false; // Hide decorative elements on small screens
        }
      });
    } else {
      // Desktop optimizations
      this.setQualityMode('high');
      
      // Show all decorative elements
      this.landscapeContainer.children.forEach(child => {
        if ((child as any).isDecoration) {
          child.visible = true;
        }
      });
    }
  }

  // Public API
  getEventBus(): EventTarget {
    return this.eventBus;
  }

  getApp(): PIXI.Application {
    return this.app;
  }

  // Cleanup
  destroy(): void {
    window.removeEventListener('resize', this.handleResize.bind(this));
    window.removeEventListener('keydown', this.onKeyDown.bind(this));
    
    this.poiSprites.clear();
    this.poiPool.forEach(sprite => sprite.destroy());
    this.poiPool = [];
    
    this.app.destroy(true, true);
  }
}
