import { PixiRenderer } from '@/render/pixiApp';
import { sqliteManager } from '@/data/sqlite';
import { useGameStore } from '@/systems/identity';
import { advancedMapGenerator } from '@/systems/advancedMapGeneration';

export interface Scene {
  name: string;
  sceneManager?: SceneManager;
  initialize(): Promise<void>;
  update(deltaTime: number): void;
  render(): void;
  cleanup(): void;
}

export class SceneManager {
  private renderer: PixiRenderer;
  private currentScene: Scene | null = null;
  private scenes: Map<string, Scene> = new Map();
  private isInitialized = false;

  constructor() {
    this.renderer = new PixiRenderer();
  }

  async initialize(container: HTMLElement): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize renderer
      await this.renderer.initialize(container);

      // Initialize database
      await sqliteManager.initialize();

      // Register scenes
      this.registerScenes();

      // Start with Boot scene
      await this.switchScene('Boot');

      this.isInitialized = true;
      console.log('Scene Manager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Scene Manager:', error);
      throw error;
    }
  }

  private registerScenes(): void {
    // Register all available scenes
    const bootScene = new BootScene(this.renderer);
    const mainMenuScene = new MainMenuScene(this.renderer);
    const cityHubScene = new CityHubScene(this.renderer);
    const endingsScene = new EndingsScene(this.renderer);
    
    // Set scene manager references
    bootScene.sceneManager = this;
    mainMenuScene.sceneManager = this;
    cityHubScene.sceneManager = this;
    endingsScene.sceneManager = this;
    
    this.scenes.set('Boot', bootScene);
    this.scenes.set('MainMenu', mainMenuScene);
    this.scenes.set('CityHub', cityHubScene);
    this.scenes.set('Endings', endingsScene);
  }

  async switchScene(sceneName: string): Promise<void> {
    // Cleanup current scene
    if (this.currentScene) {
      this.currentScene.cleanup();
    }

    // Get new scene
    const newScene = this.scenes.get(sceneName);
    if (!newScene) {
      throw new Error(`Scene '${sceneName}' not found`);
    }

    // Initialize new scene
    await newScene.initialize();
    this.currentScene = newScene;

    // Update game state
    useGameStore.getState().progress.currentScene = sceneName;

    console.log(`Switched to scene: ${sceneName}`);
  }

  update(deltaTime: number): void {
    if (this.currentScene) {
      this.currentScene.update(deltaTime);
    }
  }

  render(): void {
    if (this.currentScene) {
      this.currentScene.render();
    }
  }

  getRenderer(): PixiRenderer {
    return this.renderer;
  }

  getCurrentScene(): Scene | null {
    return this.currentScene;
  }

  destroy(): void {
    if (this.currentScene) {
      this.currentScene.cleanup();
    }
    this.renderer.destroy();
    sqliteManager.close();
  }
}

// Boot Scene - Loading and initialization
class BootScene implements Scene {
  name = 'Boot';
  sceneManager?: SceneManager;
  private renderer: PixiRenderer;
  private loadingProgress = 0;

  constructor(renderer: PixiRenderer) {
    this.renderer = renderer;
  }

  async initialize(): Promise<void> {
    console.log('Boot scene: Starting initialization...');
    
    // Simulate loading progress
    this.loadingProgress = 0;
    
    // Load database data
    await this.loadData();
    
    // Auto-transition to main menu after loading
    setTimeout(() => {
      if (this.sceneManager) {
        this.sceneManager.switchScene('MainMenu');
      }
    }, 1000);
  }

  private async loadData(): Promise<void> {
    try {
      // Load restaurants
      this.loadingProgress = 25;
      const restaurants = await sqliteManager.getRestaurants();
      console.log(`Loaded ${restaurants.length} restaurants`);

      // Load sample data for the first restaurant
      this.loadingProgress = 50;
      if (restaurants.length > 0) {
        const menuItems = await sqliteManager.getMenuItemsByRestaurant(restaurants[0].restaurant_id);
        console.log(`Loaded ${menuItems.length} menu items`);
      }

      // Load users
      this.loadingProgress = 75;
      const customers = await sqliteManager.getUsersByRole('customer');
      console.log(`Loaded ${customers.length} customers`);

      this.loadingProgress = 100;
      console.log('Boot scene: Data loading complete');
    } catch (error) {
      console.error('Boot scene: Failed to load data:', error);
    }
  }

  update(_deltaTime: number): void {
    // Update boot scene logic if needed
  }

  render(): void {
    // Rendered by React LoadingScreen component
  }

  cleanup(): void {
    // Nothing to cleanup for boot scene
  }
}

// Main Menu Scene
class MainMenuScene implements Scene {
  name = 'MainMenu';
  sceneManager?: SceneManager;
  private renderer: PixiRenderer;

  constructor(renderer: PixiRenderer) {
    this.renderer = renderer;
  }

  async initialize(): Promise<void> {
    console.log('Main Menu scene initialized');
    
    // Auto-transition to gameplay (CityHub) for immediate play
    setTimeout(() => {
      if (this.sceneManager) {
        console.log('Transitioning to CityHub for gameplay...');
        this.sceneManager.switchScene('CityHub');
      }
    }, 500);
  }

  update(deltaTime: number): void {
    // Handle menu interactions
  }

  render(): void {
    // Render main menu
  }

  cleanup(): void {
    // Cleanup menu resources
  }
}

// City Hub Scene - Main gameplay
class CityHubScene implements Scene {
  name = 'CityHub';
  sceneManager?: SceneManager;
  private renderer: PixiRenderer;

  constructor(renderer: PixiRenderer) {
    this.renderer = renderer;
  }

  async initialize(): Promise<void> {
    try {
      console.log('CityHub scene: Initializing with advanced map generation...');
      
      // Load restaurants from database
      const restaurants = await sqliteManager.getRestaurants();
      console.log(`Loading ${restaurants.length} restaurants on map`);
      
      // Generate optimized city layout with restaurant repositioning
      const result = await advancedMapGenerator.generateCityWithRepositioning(restaurants);
      console.log('Map generation result:', {
        repositionedCount: result.repositionedCount,
        averageSpacing: Math.round(result.averageSpacing),
        accessibilityValidated: result.accessibilityValidated
      });
      
      // Initialize renderer with the optimized city layout
      await this.renderer.addOrganicBackground(result.cityLayout);
      
      // Add restaurants as POIs using their optimized positions
      result.cityLayout.restaurantLocations.forEach((restaurant: any) => {
        this.renderer.addPOI({
          id: restaurant.id,
          type: 'restaurant',
          name: restaurant.name,
          x: restaurant.x,
          y: restaurant.y,
          district: restaurant.district,
          data: restaurants.find(r => r.restaurant_id === restaurant.id),
          unlocked: true,
          discoveredShards: 0,
          totalShards: 3,
        });
      });

      console.log(`City Hub scene: Added ${result.cityLayout.restaurantLocations.length} restaurant POIs`);
      
      // Create the player character at a central road location
      this.renderer.createPlayer();
      
      // Set camera to show the entire city at 1.0x zoom - centered on 1024x768 map
      this.renderer.setCameraTarget(512, 384, 1.0);
      
      console.log('CityHub scene: Advanced city initialization complete');
    } catch (error) {
      console.error('City Hub scene: Failed to initialize:', error);
    }
  }

  private createTownLayout(restaurants: any[]): Array<{x: number, y: number}> {
    // Create realistic restaurant positions distributed across different neighborhoods
    // These positions correspond to the expanded town map with multiple districts
    const positions = [
      // Downtown Core - High traffic commercial area
      { x: 250, y: 350 },  // Pizza Palace (Italian)
      { x: 450, y: 330 },  // Dragon Wok (Chinese)
      { x: 350, y: 180 },  // Spice Palace (Indian)
      { x: 550, y: 350 },  // Taco Time (Mexican)
      { x: 750, y: 540 },  // Burger Barn (American)
      { x: 850, y: 180 },  // Sushi Zen (Japanese)
      
      // Koreatown District
      { x: 150, y: 500 },  // Seoul Kitchen (Korean)
      { x: 200, y: 650 },  // Additional Korean area
      
      // Little Saigon
      { x: 950, y: 400 },  // Pho House (Vietnamese)
      { x: 1000, y: 300 }, // Vietnamese district extension
      
      // Mediterranean Quarter
      { x: 150, y: 250 },  // Olive Tree (Greek)
      { x: 100, y: 350 },  // Lebanese Delight (Lebanese)
      
      // International Food District
      { x: 650, y: 200 },  // Tropicana Grill (Brazilian)
      { x: 750, y: 250 },  // Bistro Paris (French)
      { x: 850, y: 300 },  // Bavarian Hof (German)
      
      // Diverse Cultural Area
      { x: 500, y: 600 },  // Lagos Eats (Nigerian)
      { x: 600, y: 650 },  // Cairo Palace (Egyptian)
      { x: 400, y: 720 },  // Polish Kitchen (Polish)
      
      // Asian Food Hub
      { x: 1100, y: 200 }, // Ramen Bar (Japanese)
      { x: 1050, y: 350 }, // Spice Market (Thai)
      { x: 1150, y: 450 }, // Curry Express (Indian)
      
      // Latin Quarter Extension
      { x: 300, y: 500 },  // Taqueria Maya (Mexican)
      
      // Eastern European Area
      { x: 150, y: 800 },  // Borsch Bar (Russian)
      
      // Upscale Italian Area
      { x: 900, y: 650 },  // Venice Cafe (Italian)
    ];
    
    // Safety fallback: if we have more restaurants than positions, add them in a spiral around the town center
    while (positions.length < restaurants.length) {
      const townCenterX = 500;
      const townCenterY = 400;
      const additionalIndex = positions.length - 24; // Start after our fixed positions
      const angle = additionalIndex * (Math.PI / 4); // 45 degrees apart
      const radius = 100 + (additionalIndex * 30); // Expanding spiral
      
      positions.push({
        x: Math.max(50, Math.min(1500, townCenterX + Math.cos(angle) * radius)),
        y: Math.max(50, Math.min(1150, townCenterY + Math.sin(angle) * radius))
      });
    }
    
    return positions.slice(0, restaurants.length);
  }

  update(deltaTime: number): void {
    // Update game logic
  }

  render(): void {
    // Rendered by PixiJS
  }

  cleanup(): void {
    // Cleanup POIs and resources
  }
}

// Endings Scene
class EndingsScene implements Scene {
  name = 'Endings';
  sceneManager?: SceneManager;
  private renderer: PixiRenderer;

  constructor(renderer: PixiRenderer) {
    this.renderer = renderer;
  }

  async initialize(): Promise<void> {
    console.log('Endings scene initialized');
  }

  update(deltaTime: number): void {
    // Handle ending sequence
  }

  render(): void {
    // Render ending content
  }

  cleanup(): void {
    // Cleanup ending resources
  }
}
