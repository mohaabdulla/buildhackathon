export interface RestaurantLocation {
  id: number;
  name: string;
  cuisine: string;
  district: string;
  address: string;
  x: number;
  y: number;
}

export interface District {
  name: string;
  centerX: number;
  centerY: number;
  radius: number;
  restaurants: RestaurantLocation[];
  theme: 'commercial' | 'cultural' | 'upscale' | 'casual' | 'mixed';
}

export interface Road {
  id: string;
  type: 'main' | 'secondary' | 'local';
  points: Array<{ x: number; y: number }>;
  width: number;
  connectsDistricts: string[];
}

export interface CityBlock {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'building' | 'park' | 'parking' | 'plaza' | 'empty';
  isWalkable: boolean;
  district: string;
}

export interface TileType {
  walkable: boolean;
  type: 'road' | 'sidewalk' | 'building' | 'park' | 'grass' | 'plaza';
  district?: string;
}

export class OrganicCityGenerator {
  private readonly TILE_SIZE = 16;
  private readonly MAP_WIDTH = 1024;  // Slightly bigger - 1024x768 for better ratio
  private readonly MAP_HEIGHT = 768;  // Standard 4:3 aspect ratio
  
  private readonly GRID_WIDTH = Math.floor(this.MAP_WIDTH / this.TILE_SIZE);
  private readonly GRID_HEIGHT = Math.floor(this.MAP_HEIGHT / this.TILE_SIZE);

  private districts: District[] = [];
  private roads: Road[] = [];
  private cityBlocks: CityBlock[] = [];
  private tileGrid: TileType[][] = [];

  constructor() {
    this.initializeTileGrid();
  }

  private initializeTileGrid(): void {
    this.tileGrid = Array(this.GRID_HEIGHT).fill(null).map(() =>
      Array(this.GRID_WIDTH).fill(null).map(() => ({
        walkable: true,
        type: 'grass' as const
      }))
    );
  }

  /**
   * Generate the entire city layout based on restaurant data
   */
  public generateCity(restaurants: any[]): {
    districts: District[];
    roads: Road[];
    cityBlocks: CityBlock[];
    tileGrid: TileType[][];
    restaurantLocations: RestaurantLocation[];
  } {
    console.log('Generating organic city layout for', restaurants.length, 'restaurants');

    // Step 1: Create restaurant locations and cluster them into districts
    const restaurantLocations = this.createRestaurantLocations(restaurants);
    this.districts = this.createDistricts(restaurantLocations);

    // Step 2: Generate main roads connecting districts
    this.generateMainRoadNetwork();

    // Step 3: Generate secondary roads within districts
    this.generateSecondaryRoads();

    // Step 4: Create city blocks between roads
    this.generateCityBlocks();

    // Step 5: Fill empty areas with buildings and parks
    this.fillEmptyAreas();

    // Step 6: Add sidewalks and pedestrian areas
    this.addSidewalks();

    // Step 7: Ensure all restaurants are accessible
    this.ensureRestaurantAccessibility(restaurantLocations);

    console.log('City generation complete:', {
      districts: this.districts.length,
      roads: this.roads.length,
      blocks: this.cityBlocks.length
    });

    return {
      districts: this.districts,
      roads: this.roads,
      cityBlocks: this.cityBlocks,
      tileGrid: this.tileGrid,
      restaurantLocations
    };
  }

  private createRestaurantLocations(restaurants: any[]): RestaurantLocation[] {
    const locations: RestaurantLocation[] = [];

    restaurants.forEach((restaurant) => {
      // Use the restaurant's provided coordinates (from positioning system) if available
      let x = restaurant.x;
      let y = restaurant.y;
      
      // If no coordinates provided, fall back to district-based positioning
      if (x === undefined || y === undefined || x === 0 || y === 0) {
        console.log(`Restaurant ${restaurant.name} has no coordinates, using district positioning`);
        const districtCenters = this.getDistrictCenters();
        const district = this.normalizeDistrictName(restaurant.city || 'Downtown');
        const center = districtCenters[district] || districtCenters['Downtown'];
        
        // Add some randomization within the district
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 200 + 100; // 100-300 pixels from center (increased spread)
        x = Math.max(100, Math.min(this.MAP_WIDTH - 100, center.x + Math.cos(angle) * distance));
        y = Math.max(100, Math.min(this.MAP_HEIGHT - 100, center.y + Math.sin(angle) * distance));
      }
      
      console.log(`Restaurant ${restaurant.name} positioned at (${x}, ${y})`);

      locations.push({
        id: restaurant.id || restaurant.restaurant_id,
        name: restaurant.name,
        cuisine: restaurant.cuisine_type,
        district: restaurant.district || this.normalizeDistrictName(restaurant.city || 'Downtown'),
        address: restaurant.address,
        x: Math.round(x),
        y: Math.round(y)
      });
    });

    return locations;
  }

  private getDistrictCenters(): Record<string, { x: number; y: number }> {
    // Distribute districts across the enlarged 2400x1800 map
    return {
      'Downtown': { x: 1200, y: 900 },      // Center
      'Chinatown': { x: 800, y: 400 },      // Northwest
      'Little India': { x: 400, y: 600 },   // West
      'Mission District': { x: 600, y: 1400 }, // Southwest
      'Japantown': { x: 1600, y: 300 },     // Northeast
      'Koreatown': { x: 300, y: 1200 },     // South
      'Little Saigon': { x: 1800, y: 800 }, // East
      'Greek Quarter': { x: 200, y: 300 },  // Northwest corner
      'South Beach': { x: 1400, y: 1600 },  // Southeast
      'French Quarter': { x: 1800, y: 1200 }, // Southeast
      'Middle East District': { x: 1000, y: 1000 }, // Central-South
      'Germantown': { x: 2000, y: 600 },    // Far East
      'African Quarter': { x: 800, y: 1600 }, // South
      'Little Italy': { x: 1600, y: 400 },  // Northeast
      'Polish Hill': { x: 2200, y: 1000 },  // Far East
      'Thai Town': { x: 1400, y: 1400 },    // Southeast
      'Russian Hill': { x: 600, y: 200 },   // North
      'Central': { x: 1200, y: 900 },       // Same as Downtown
      'North': { x: 1200, y: 300 },         // North center
      'South': { x: 1200, y: 1500 },        // South center
      'East': { x: 2000, y: 900 },          // East center
      'West': { x: 400, y: 900 },           // West center
      'Northwest': { x: 600, y: 450 },      // Northwest
      'Northeast': { x: 1800, y: 450 },     // Northeast
      'Southwest': { x: 600, y: 1350 },     // Southwest
      'Southeast': { x: 1800, y: 1350 }     // Southeast
    };
  }

  private normalizeDistrictName(cityName: string): string {
    const normalized = cityName.trim();
    const centers = this.getDistrictCenters();
    return Object.keys(centers).includes(normalized) ? normalized : 'Downtown';
  }

  private createDistricts(restaurantLocations: RestaurantLocation[]): District[] {
    const districtMap = new Map<string, RestaurantLocation[]>();
    
    // Group restaurants by district
    restaurantLocations.forEach(restaurant => {
      if (!districtMap.has(restaurant.district)) {
        districtMap.set(restaurant.district, []);
      }
      districtMap.get(restaurant.district)!.push(restaurant);
    });

    // Create district objects
    const districts: District[] = [];
    const districtCenters = this.getDistrictCenters();

    districtMap.forEach((restaurants, districtName) => {
      const center = districtCenters[districtName] || districtCenters['Downtown'];
      const theme = this.getDistrictTheme(districtName);
      
      districts.push({
        name: districtName,
        centerX: center.x,
        centerY: center.y,
        radius: Math.max(100, restaurants.length * 25), // Larger districts for more restaurants
        restaurants,
        theme
      });
    });

    return districts;
  }

  private getDistrictTheme(districtName: string): 'commercial' | 'cultural' | 'upscale' | 'casual' | 'mixed' {
    const commercialDistricts = ['Downtown'];
    const culturalDistricts = ['Chinatown', 'Little India', 'Japantown', 'Koreatown', 'Little Saigon', 'Greek Quarter', 'French Quarter', 'Little Italy', 'Thai Town'];
    const upscaleDistricts = ['South Beach', 'French Quarter'];
    
    if (commercialDistricts.includes(districtName)) return 'commercial';
    if (culturalDistricts.includes(districtName)) return 'cultural';
    if (upscaleDistricts.includes(districtName)) return 'upscale';
    return 'mixed';
  }

  private generateMainRoadNetwork(): void {
    const mainRoads: Road[] = [];
    
    // Create main arteries connecting major districts
    const majorDistricts = this.districts.filter(d => d.restaurants.length >= 2);
    
    // Main horizontal road
    mainRoads.push({
      id: 'main-horizontal',
      type: 'main',
      points: [
        { x: 0, y: this.MAP_HEIGHT / 2 },
        { x: this.MAP_WIDTH, y: this.MAP_HEIGHT / 2 }
      ],
      width: 48,
      connectsDistricts: majorDistricts.map(d => d.name)
    });

    // Main vertical road
    mainRoads.push({
      id: 'main-vertical',
      type: 'main',
      points: [
        { x: this.MAP_WIDTH / 2, y: 0 },
        { x: this.MAP_WIDTH / 2, y: this.MAP_HEIGHT }
      ],
      width: 48,
      connectsDistricts: majorDistricts.map(d => d.name)
    });

    // Connect districts with secondary main roads
    for (let i = 0; i < majorDistricts.length; i++) {
      for (let j = i + 1; j < majorDistricts.length; j++) {
        const dist1 = majorDistricts[i];
        const dist2 = majorDistricts[j];
        const distance = Math.sqrt(
          Math.pow(dist1.centerX - dist2.centerX, 2) + 
          Math.pow(dist1.centerY - dist2.centerY, 2)
        );
        
        // Connect nearby districts
        if (distance < 300) {
          mainRoads.push({
            id: `connect-${dist1.name}-${dist2.name}`,
            type: 'secondary',
            points: [
              { x: dist1.centerX, y: dist1.centerY },
              { x: dist2.centerX, y: dist2.centerY }
            ],
            width: 32,
            connectsDistricts: [dist1.name, dist2.name]
          });
        }
      }
    }

    this.roads = mainRoads;
    this.applyRoadsToGrid();
  }

  private generateSecondaryRoads(): void {
    // Add local roads within each district
    this.districts.forEach(district => {
      // Create a grid of local roads within the district
      const localRoads = this.createDistrictRoadGrid(district);
      this.roads.push(...localRoads);
    });

    this.applyRoadsToGrid();
  }

  private createDistrictRoadGrid(district: District): Road[] {
    const roads: Road[] = [];
    const gridSpacing = 80; // Roads every 80 pixels
    
    // Create local horizontal roads
    for (let y = district.centerY - district.radius; y <= district.centerY + district.radius; y += gridSpacing) {
      if (y < 0 || y >= this.MAP_HEIGHT) continue;
      
      roads.push({
        id: `local-h-${district.name}-${y}`,
        type: 'local',
        points: [
          { x: Math.max(0, district.centerX - district.radius), y },
          { x: Math.min(this.MAP_WIDTH, district.centerX + district.radius), y }
        ],
        width: 24,
        connectsDistricts: [district.name]
      });
    }

    // Create local vertical roads
    for (let x = district.centerX - district.radius; x <= district.centerX + district.radius; x += gridSpacing) {
      if (x < 0 || x >= this.MAP_WIDTH) continue;
      
      roads.push({
        id: `local-v-${district.name}-${x}`,
        type: 'local',
        points: [
          { x, y: Math.max(0, district.centerY - district.radius) },
          { x, y: Math.min(this.MAP_HEIGHT, district.centerY + district.radius) }
        ],
        width: 24,
        connectsDistricts: [district.name]
      });
    }

    return roads;
  }

  private applyRoadsToGrid(): void {
    this.roads.forEach(road => {
      this.drawRoadOnGrid(road);
    });
  }

  private drawRoadOnGrid(road: Road): void {
    for (let i = 0; i < road.points.length - 1; i++) {
      const start = road.points[i];
      const end = road.points[i + 1];
      this.drawLineOnGrid(start, end, road.width, 'road');
    }
  }

  private drawLineOnGrid(start: { x: number; y: number }, end: { x: number; y: number }, width: number, type: 'road' | 'sidewalk'): void {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const steps = Math.ceil(length / this.TILE_SIZE);
    
    for (let step = 0; step <= steps; step++) {
      const t = step / steps;
      const x = start.x + dx * t;
      const y = start.y + dy * t;
      
      // Draw road width
      const halfWidth = width / 2;
      for (let offsetX = -halfWidth; offsetX <= halfWidth; offsetX += this.TILE_SIZE) {
        for (let offsetY = -halfWidth; offsetY <= halfWidth; offsetY += this.TILE_SIZE) {
          const tileX = Math.floor((x + offsetX) / this.TILE_SIZE);
          const tileY = Math.floor((y + offsetY) / this.TILE_SIZE);
          
          if (tileX >= 0 && tileX < this.GRID_WIDTH && tileY >= 0 && tileY < this.GRID_HEIGHT) {
            this.tileGrid[tileY][tileX] = {
              walkable: true,
              type: type
            };
          }
        }
      }
    }
  }

  private generateCityBlocks(): void {
    // Create building blocks in areas not occupied by roads
    const blockSize = 64; // 4x4 tiles
    
    for (let x = 0; x < this.MAP_WIDTH; x += blockSize) {
      for (let y = 0; y < this.MAP_HEIGHT; y += blockSize) {
        if (this.isAreaClearForBuilding(x, y, blockSize, blockSize)) {
          const district = this.findNearestDistrict(x + blockSize/2, y + blockSize/2);
          
          this.cityBlocks.push({
            id: `block-${x}-${y}`,
            x,
            y,
            width: blockSize,
            height: blockSize,
            type: this.getBlockType(district),
            isWalkable: false,
            district: district?.name || 'Downtown'
          });
          
          // Mark as non-walkable on grid
          this.markAreaOnGrid(x, y, blockSize, blockSize, 'building', false);
        }
      }
    }
  }

  private isAreaClearForBuilding(x: number, y: number, width: number, height: number): boolean {
    const startTileX = Math.floor(x / this.TILE_SIZE);
    const startTileY = Math.floor(y / this.TILE_SIZE);
    const endTileX = Math.floor((x + width) / this.TILE_SIZE);
    const endTileY = Math.floor((y + height) / this.TILE_SIZE);
    
    for (let tileY = startTileY; tileY <= endTileY; tileY++) {
      for (let tileX = startTileX; tileX <= endTileX; tileX++) {
        if (tileX >= 0 && tileX < this.GRID_WIDTH && tileY >= 0 && tileY < this.GRID_HEIGHT) {
          if (this.tileGrid[tileY][tileX].type === 'road') {
            return false;
          }
        }
      }
    }
    return true;
  }

  private findNearestDistrict(x: number, y: number): District | null {
    let nearest = null;
    let minDistance = Infinity;
    
    this.districts.forEach(district => {
      const distance = Math.sqrt(
        Math.pow(x - district.centerX, 2) + 
        Math.pow(y - district.centerY, 2)
      );
      if (distance < minDistance) {
        minDistance = distance;
        nearest = district;
      }
    });
    
    return nearest;
  }

  private getBlockType(district: District | null): 'building' | 'park' | 'parking' | 'plaza' | 'empty' {
    if (!district) return 'building';
    
    const random = Math.random();
    
    switch (district.theme) {
      case 'commercial':
        return random < 0.7 ? 'building' : random < 0.9 ? 'parking' : 'plaza';
      case 'cultural':
        return random < 0.6 ? 'building' : random < 0.8 ? 'plaza' : 'park';
      case 'upscale':
        return random < 0.5 ? 'building' : random < 0.8 ? 'park' : 'plaza';
      default:
        return random < 0.8 ? 'building' : 'park';
    }
  }

  private markAreaOnGrid(x: number, y: number, width: number, height: number, type: 'building' | 'park' | 'plaza', walkable: boolean): void {
    const startTileX = Math.floor(x / this.TILE_SIZE);
    const startTileY = Math.floor(y / this.TILE_SIZE);
    const endTileX = Math.floor((x + width) / this.TILE_SIZE);
    const endTileY = Math.floor((y + height) / this.TILE_SIZE);
    
    for (let tileY = startTileY; tileY <= endTileY; tileY++) {
      for (let tileX = startTileX; tileX <= endTileX; tileX++) {
        if (tileX >= 0 && tileX < this.GRID_WIDTH && tileY >= 0 && tileY < this.GRID_HEIGHT) {
          this.tileGrid[tileY][tileX] = {
            walkable,
            type: type as any
          };
        }
      }
    }
  }

  private fillEmptyAreas(): void {
    console.log('Filling empty areas with buildings and parks...');
    
    // Fill remaining grass areas with more dense development
    for (let tileY = 0; tileY < this.GRID_HEIGHT; tileY++) {
      for (let tileX = 0; tileX < this.GRID_WIDTH; tileX++) {
        if (this.tileGrid[tileY][tileX].type === 'grass') {
          const random = Math.random();
          const distanceFromCenter = Math.sqrt(
            Math.pow(tileX - this.GRID_WIDTH/2, 2) + 
            Math.pow(tileY - this.GRID_HEIGHT/2, 2)
          );
          const normalizedDistance = distanceFromCenter / (Math.max(this.GRID_WIDTH, this.GRID_HEIGHT) / 2);
          
          // Higher density near center, lower towards edges
          const buildingDensity = Math.max(0.2, 0.7 - normalizedDistance * 0.3);
          
          if (random < buildingDensity) {
            if (random < 0.15) {
              // Parks (15% of filled areas)
              this.createParkArea(tileX, tileY);
            } else if (random < 0.35) {
              // Residential buildings (20% of filled areas)
              this.createResidentialBuilding(tileX, tileY);
            } else if (random < 0.55) {
              // Commercial buildings (20% of filled areas)
              this.createCommercialBuilding(tileX, tileY);
            } else {
              // Mixed-use buildings (remaining filled areas)
              this.createMixedBuilding(tileX, tileY);
            }
          }
        }
      }
    }
    
    // Add larger park areas in some districts
    this.addDistrictParks();
    
    console.log('Empty area filling complete');
  }

  private createParkArea(centerX: number, centerY: number): void {
    // Create a small park area (2x2 or 3x3)
    const size = Math.random() < 0.7 ? 2 : 3;
    const startX = centerX - Math.floor(size / 2);
    const startY = centerY - Math.floor(size / 2);
    
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const tileX = startX + x;
        const tileY = startY + y;
        
        if (tileX >= 0 && tileX < this.GRID_WIDTH && 
            tileY >= 0 && tileY < this.GRID_HEIGHT &&
            this.tileGrid[tileY][tileX].type === 'grass') {
          this.tileGrid[tileY][tileX] = { walkable: true, type: 'park' };
        }
      }
    }
  }

  private createResidentialBuilding(tileX: number, tileY: number): void {
    // Create a single residential building
    if (this.tileGrid[tileY][tileX].type === 'grass') {
      this.tileGrid[tileY][tileX] = { walkable: false, type: 'building', district: 'residential' };
    }
  }

  private createCommercialBuilding(tileX: number, tileY: number): void {
    // Create a commercial building (slightly larger chance of being 2x1)
    if (Math.random() < 0.3 && tileX + 1 < this.GRID_WIDTH) {
      // 2x1 commercial building
      if (this.tileGrid[tileY][tileX].type === 'grass' && 
          this.tileGrid[tileY][tileX + 1].type === 'grass') {
        this.tileGrid[tileY][tileX] = { walkable: false, type: 'building', district: 'commercial' };
        this.tileGrid[tileY][tileX + 1] = { walkable: false, type: 'building', district: 'commercial' };
      }
    } else {
      // Single commercial building
      if (this.tileGrid[tileY][tileX].type === 'grass') {
        this.tileGrid[tileY][tileX] = { walkable: false, type: 'building', district: 'commercial' };
      }
    }
  }

  private createMixedBuilding(tileX: number, tileY: number): void {
    // Create a mixed-use building
    if (this.tileGrid[tileY][tileX].type === 'grass') {
      this.tileGrid[tileY][tileX] = { walkable: false, type: 'building', district: 'mixed' };
    }
  }

  private addDistrictParks(): void {
    // Add one larger park in each district
    this.districts.forEach(district => {
      const parkSize = 4 + Math.floor(Math.random() * 3); // 4x4 to 6x6
      const attempts = 10;
      
      for (let attempt = 0; attempt < attempts; attempt++) {
        const centerX = Math.floor(district.centerX / this.TILE_SIZE);
        const centerY = Math.floor(district.centerY / this.TILE_SIZE);
        
        // Try to place park near district center
        const offsetRange = 10;
        const parkX = centerX + Math.floor((Math.random() - 0.5) * offsetRange);
        const parkY = centerY + Math.floor((Math.random() - 0.5) * offsetRange);
        
        if (this.canPlacePark(parkX, parkY, parkSize)) {
          this.placePark(parkX, parkY, parkSize, district.name);
          break;
        }
      }
    });
  }

  private canPlacePark(startX: number, startY: number, size: number): boolean {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const tileX = startX + x;
        const tileY = startY + y;
        
        if (tileX < 0 || tileX >= this.GRID_WIDTH || 
            tileY < 0 || tileY >= this.GRID_HEIGHT ||
            this.tileGrid[tileY][tileX].type !== 'grass') {
          return false;
        }
      }
    }
    return true;
  }

  private placePark(startX: number, startY: number, size: number, districtName: string): void {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const tileX = startX + x;
        const tileY = startY + y;
        
        this.tileGrid[tileY][tileX] = { 
          walkable: true, 
          type: 'park',
          district: districtName
        };
      }
    }
  }

  private addSidewalks(): void {
    // Add sidewalks adjacent to roads
    for (let tileY = 0; tileY < this.GRID_HEIGHT; tileY++) {
      for (let tileX = 0; tileX < this.GRID_WIDTH; tileX++) {
        if (this.tileGrid[tileY][tileX].type === 'road') {
          // Check adjacent tiles for sidewalk placement
          this.addSidewalkAdjacent(tileX, tileY);
        }
      }
    }
  }

  private addSidewalkAdjacent(roadTileX: number, roadTileY: number): void {
    const directions = [
      { dx: -1, dy: 0 }, { dx: 1, dy: 0 }, // Left, Right
      { dx: 0, dy: -1 }, { dx: 0, dy: 1 }  // Up, Down
    ];
    
    directions.forEach(({ dx, dy }) => {
      const adjX = roadTileX + dx;
      const adjY = roadTileY + dy;
      
      if (adjX >= 0 && adjX < this.GRID_WIDTH && adjY >= 0 && adjY < this.GRID_HEIGHT) {
        const adjTile = this.tileGrid[adjY][adjX];
        if (adjTile.type === 'grass') {
          this.tileGrid[adjY][adjX] = { walkable: true, type: 'sidewalk' };
        }
      }
    });
  }

  private ensureRestaurantAccessibility(restaurantLocations: RestaurantLocation[]): void {
    // Ensure each restaurant has access to a walkable tile
    restaurantLocations.forEach(restaurant => {
      const tileX = Math.floor(restaurant.x / this.TILE_SIZE);
      const tileY = Math.floor(restaurant.y / this.TILE_SIZE);
      
      if (tileX >= 0 && tileX < this.GRID_WIDTH && tileY >= 0 && tileY < this.GRID_HEIGHT) {
        // Make restaurant tile walkable
        this.tileGrid[tileY][tileX] = { walkable: true, type: 'sidewalk' };
        
        // Ensure adjacent tiles provide access
        const directions = [
          { dx: -1, dy: 0 }, { dx: 1, dy: 0 }, 
          { dx: 0, dy: -1 }, { dx: 0, dy: 1 }
        ];
        
        directions.forEach(({ dx, dy }) => {
          const adjX = tileX + dx;
          const adjY = tileY + dy;
          
          if (adjX >= 0 && adjX < this.GRID_WIDTH && adjY >= 0 && adjY < this.GRID_HEIGHT) {
            if (!this.tileGrid[adjY][adjX].walkable) {
              this.tileGrid[adjY][adjX] = { walkable: true, type: 'sidewalk' };
            }
          }
        });
      }
    });
  }

  /**
   * Check if a tile position is walkable
   */
  public isWalkable(x: number, y: number): boolean {
    const tileX = Math.floor(x / this.TILE_SIZE);
    const tileY = Math.floor(y / this.TILE_SIZE);
    
    if (tileX < 0 || tileX >= this.GRID_WIDTH || tileY < 0 || tileY >= this.GRID_HEIGHT) {
      return false;
    }
    
    return this.tileGrid[tileY][tileX].walkable;
  }

  /**
   * Get tile type at position
   */
  public getTileType(x: number, y: number): TileType | null {
    const tileX = Math.floor(x / this.TILE_SIZE);
    const tileY = Math.floor(y / this.TILE_SIZE);
    
    if (tileX < 0 || tileX >= this.GRID_WIDTH || tileY < 0 || tileY >= this.GRID_HEIGHT) {
      return null;
    }
    
    return this.tileGrid[tileY][tileX];
  }
}
