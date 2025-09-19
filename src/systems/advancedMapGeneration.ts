import { OrganicCityGenerator, RestaurantLocation, District, Road, CityBlock, TileType } from './mapGeneration';
import { RestaurantRepositioner } from './restaurantRepositioning';
import { RoadSnapper } from './roadSnapping';
import { Pathfinder } from './pathfinding';
import { DifficultyConfig, difficultyManager } from '@/config/difficulty';
import { sqliteManager } from '@/data/sqlite';

export interface RepositioningResult {
  cityLayout: {
    districts: District[];
    roads: Road[];
    cityBlocks: CityBlock[];
    tileGrid: TileType[][];
    restaurantLocations: RestaurantLocation[];
  };
  repositionedCount: number;
  averageSpacing: number;
  accessibilityValidated: boolean;
}

/**
 * Integrated map generation system with restaurant repositioning
 */
export class AdvancedMapGenerator {
  private cityGenerator: OrganicCityGenerator;
  private repositioner: RestaurantRepositioner;
  private roadSnapper: RoadSnapper;
  private config: DifficultyConfig;

  constructor(config?: DifficultyConfig) {
    this.config = config || difficultyManager.getConfig();
    this.cityGenerator = new OrganicCityGenerator();
    this.repositioner = new RestaurantRepositioner(this.config);
    this.roadSnapper = new RoadSnapper();
  }

  /**
   * Generate city with repositioned restaurants for optimal spacing
   */
  async generateCityWithRepositioning(
    restaurants: any[],
    forceReposition: boolean = false
  ): Promise<RepositioningResult> {
    console.log('Starting advanced map generation with repositioning...');

    // Load existing placements
    const restaurantsWithPlacements = await sqliteManager.getRestaurantsWithPlacements();
    
    // Check if we need to reposition
    const needsRepositioning = forceReposition || this.shouldReposition(restaurantsWithPlacements);
    
    if (needsRepositioning) {
      console.log('Repositioning restaurants for optimal spacing...');
      await this.repositionRestaurants(restaurantsWithPlacements);
      
      // Reload with new placements
      const updatedRestaurants = await sqliteManager.getRestaurantsWithPlacements();
      return this.generateCityLayout(updatedRestaurants);
    } else {
      console.log('Using existing restaurant positions...');
      return this.generateCityLayout(restaurantsWithPlacements);
    }
  }

  /**
   * Force repositioning of restaurants
   */
  async forceRepositioning(): Promise<void> {
    console.log('Forcing restaurant repositioning...');
    
    // Clear existing placements
    await sqliteManager.clearRestaurantPlacements();
    
    // Get fresh restaurant data
    const restaurants = await sqliteManager.getRestaurants();
    
    // Apply repositioning
    await this.repositionRestaurants(restaurants);
  }

  /**
   * Check if restaurants need repositioning based on spacing
   */
  private shouldReposition(restaurants: any[]): boolean {
    // Check if any placements exist
    const hasOverrides = restaurants.some(r => r.override_x !== null && r.override_y !== null);
    if (!hasOverrides) {
      console.log('No placement overrides found, repositioning needed');
      return true; // No placements exist, need to reposition
    }

    console.log('Found existing placement overrides, checking spacing...');

    // Check average spacing
    const avgSpacing = this.calculateAverageSpacing(restaurants);
    const targetSpacing = this.config.minDistanceBetweenRestaurants;
    
    console.log(`Average spacing: ${avgSpacing}, Target: ${targetSpacing}`);
    
    // Reposition if spacing is too small
    return avgSpacing < targetSpacing * 0.8;
  }

  /**
   * Calculate average spacing between restaurants
   */
  private calculateAverageSpacing(restaurants: any[]): number {
    if (restaurants.length < 2) return 0;

    let totalDistance = 0;
    let pairCount = 0;

    for (let i = 0; i < restaurants.length; i++) {
      for (let j = i + 1; j < restaurants.length; j++) {
        const r1 = restaurants[i];
        const r2 = restaurants[j];
        
        const x1 = r1.override_x ?? r1.x ?? 0;
        const y1 = r1.override_y ?? r1.y ?? 0;
        const x2 = r2.override_x ?? r2.x ?? 0;
        const y2 = r2.override_y ?? r2.y ?? 0;
        
        const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        totalDistance += distance;
        pairCount++;
      }
    }

    return pairCount > 0 ? totalDistance / pairCount : 0;
  }

  /**
   * Apply restaurant repositioning
   */
  private async repositionRestaurants(restaurants: any[]): Promise<void> {
    // Generate new positions using Poisson disc sampling
    const newPlacements = this.repositioner.repositionRestaurants(restaurants);
    
    // Generate initial city layout to get road network
    const initialLayout = this.cityGenerator.generateCity(restaurants);
    this.roadSnapper.updateTileGrid(initialLayout.tileGrid);
    
    // Snap restaurants to roads and validate positions
    const snappedPlacements = newPlacements.map(placement => {
      const snapResult = this.roadSnapper.snapToRoadAdjacentParcel(
        { x: placement.x, y: placement.y },
        this.config.maxSnapDistance
      );
      
      if (snapResult) {
        // Ensure position doesn't overlap with buildings
        const validPosition = this.roadSnapper.offsetToAvoidOverlap(snapResult.snappedPosition);
        
        // Ensure accessibility
        this.roadSnapper.ensureAccessibility(validPosition);
        
        return {
          ...placement,
          x: validPosition.x,
          y: validPosition.y
        };
      }
      
      return placement; // Fallback to original position
    });
    
    // Save placements to database
    await sqliteManager.setMultipleRestaurantPlacements(snappedPlacements);
    
    console.log(`Successfully repositioned ${snappedPlacements.length} restaurants`);
  }

  /**
   * Generate the final city layout
   */
  private generateCityLayout(restaurants: any[]): RepositioningResult {
    // Create restaurant locations with overrides
    const restaurantLocations = this.createRestaurantLocations(restaurants);
    
    // Generate city layout
    const cityLayout = this.cityGenerator.generateCity(restaurantLocations);
    
    // Validate accessibility
    const accessibilityValidated = this.validateAccessibility(cityLayout, restaurantLocations);
    
    // Calculate metrics
    const repositionedCount = restaurants.filter(r => r.override_x !== null).length;
    const averageSpacing = this.calculateAverageSpacing(restaurants);
    
    return {
      cityLayout,
      repositionedCount,
      averageSpacing,
      accessibilityValidated
    };
  }

  /**
   * Create restaurant locations with position overrides
   */
  private createRestaurantLocations(restaurants: any[]): RestaurantLocation[] {
    console.log('Creating restaurant locations. Sample restaurant data:', restaurants[0]);
    console.log('Total restaurants:', restaurants.length);
    
    return restaurants.map(restaurant => {
      const x = restaurant.override_x ?? restaurant.x ?? this.getDefaultX(restaurant);
      const y = restaurant.override_y ?? restaurant.y ?? this.getDefaultY(restaurant);
      
      console.log(`Restaurant ${restaurant.name}: override(${restaurant.override_x},${restaurant.override_y}) base(${restaurant.x},${restaurant.y}) -> final(${x},${y})`);
      
      return {
        id: restaurant.restaurant_id,
        name: restaurant.name,
        cuisine: restaurant.cuisine_type,
        district: restaurant.district || restaurant.city || 'Downtown',
        address: restaurant.address,
        x: x,
        y: y
      };
    });
  }

  /**
   * Get default X position for restaurant (fallback)
   */
  private getDefaultX(restaurant: any): number {
    // Use restaurant ID to generate a consistent position
    return 200 + (restaurant.restaurant_id * 137) % 1200;
  }

  /**
   * Get default Y position for restaurant (fallback)
   */
  private getDefaultY(restaurant: any): number {
    return 200 + (restaurant.restaurant_id * 73) % 800;
  }

  /**
   * Validate that all restaurants are accessible via pathfinding
   */
  private validateAccessibility(
    cityLayout: { tileGrid: TileType[][] },
    restaurantLocations: RestaurantLocation[]
  ): boolean {
    // Create pathfinder instance
    const pathfinder = new Pathfinder(
      cityLayout.tileGrid[0]?.length || 100,
      cityLayout.tileGrid.length || 75
    );
    
    pathfinder.updateWalkabilityGrid(cityLayout.tileGrid);
    
    // Find a central walkable starting position
    const startPosition = this.findCentralWalkablePosition(cityLayout.tileGrid);
    if (!startPosition) {
      console.warn('No walkable starting position found');
      return false;
    }
    
    // Test pathfinding to each restaurant
    let accessibleCount = 0;
    
    restaurantLocations.forEach(restaurant => {
      const pathResult = pathfinder.findPath(
        startPosition.x,
        startPosition.y,
        restaurant.x,
        restaurant.y
      );
      
      if (pathResult.found) {
        accessibleCount++;
      } else {
        console.warn(`Restaurant ${restaurant.name} is not accessible`);
      }
    });
    
    const accessibilityRatio = accessibleCount / restaurantLocations.length;
    console.log(`Accessibility: ${accessibleCount}/${restaurantLocations.length} (${Math.round(accessibilityRatio * 100)}%)`);
    
    return accessibilityRatio >= 0.95; // 95% accessibility threshold
  }

  /**
   * Find a central walkable position for pathfinding tests
   */
  private findCentralWalkablePosition(tileGrid: TileType[][]): { x: number; y: number } | null {
    const TILE_SIZE = 16;
    const centerX = Math.floor(tileGrid[0]?.length / 2) || 50;
    const centerY = Math.floor(tileGrid.length / 2) || 37;
    
    // Search in expanding radius for walkable tile
    for (let radius = 1; radius < 20; radius++) {
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const tileX = centerX + dx;
          const tileY = centerY + dy;
          
          if (tileX >= 0 && tileX < tileGrid[0]?.length && 
              tileY >= 0 && tileY < tileGrid.length &&
              tileGrid[tileY][tileX].walkable) {
            return {
              x: tileX * TILE_SIZE + TILE_SIZE / 2,
              y: tileY * TILE_SIZE + TILE_SIZE / 2
            };
          }
        }
      }
    }
    
    return null;
  }

  /**
   * Get repositioning statistics
   */
  async getRepositioningStats(): Promise<{
    totalRestaurants: number;
    repositionedCount: number;
    averageSpacing: number;
    minSpacing: number;
    maxSpacing: number;
    targetSpacing: number;
  }> {
    const restaurants = await sqliteManager.getRestaurantsWithPlacements();
    const repositionedCount = restaurants.filter(r => r.override_x !== null).length;
    
    // Calculate spacing statistics
    const spacings = this.calculateAllSpacings(restaurants);
    const averageSpacing = spacings.reduce((sum, s) => sum + s, 0) / spacings.length;
    const minSpacing = Math.min(...spacings);
    const maxSpacing = Math.max(...spacings);
    
    return {
      totalRestaurants: restaurants.length,
      repositionedCount,
      averageSpacing: Math.round(averageSpacing),
      minSpacing: Math.round(minSpacing),
      maxSpacing: Math.round(maxSpacing),
      targetSpacing: this.config.minDistanceBetweenRestaurants
    };
  }

  /**
   * Calculate all pairwise spacings
   */
  private calculateAllSpacings(restaurants: any[]): number[] {
    const spacings: number[] = [];
    
    for (let i = 0; i < restaurants.length; i++) {
      for (let j = i + 1; j < restaurants.length; j++) {
        const r1 = restaurants[i];
        const r2 = restaurants[j];
        
        const x1 = r1.override_x ?? r1.x ?? 0;
        const y1 = r1.override_y ?? r1.y ?? 0;
        const x2 = r2.override_x ?? r2.x ?? 0;
        const y2 = r2.override_y ?? r2.y ?? 0;
        
        const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        spacings.push(distance);
      }
    }
    
    return spacings;
  }
}

// Global instance
export const advancedMapGenerator = new AdvancedMapGenerator();
