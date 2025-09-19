import { DifficultyConfig } from '@/config/difficulty';

export interface Point {
  x: number;
  y: number;
}

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PlacementResult {
  position: Point;
  districtIndex: number;
  snapDistance: number;
}

/**
 * Seeded random number generator for reproducible results
 */
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed % 2147483647;
    if (this.seed <= 0) this.seed += 2147483646;
  }

  next(): number {
    this.seed = (this.seed * 16807) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }

  nextInRange(min: number, max: number): number {
    return min + this.next() * (max - min);
  }
}

/**
 * Restaurant repositioning system using Poisson disc sampling
 */
export class RestaurantRepositioner {
  private rng: SeededRandom;
  private config: DifficultyConfig;

  constructor(config: DifficultyConfig) {
    this.config = config;
    this.rng = new SeededRandom(config.rngSeed);
  }

  /**
   * Calculate square bounds that encompass the full city map
   */
  calculateSquareBounds(restaurants: Array<{x?: number, y?: number, override_x?: number, override_y?: number}>): Bounds {
    if (this.config.useFullMapBounds) {
      // Use the full configured city size for even distribution
      const size = this.config.citySquareSize;
      const padding = 50; // Keep restaurants away from map edges
      
      return {
        x: padding,
        y: padding,
        width: size - (padding * 2),
        height: size - (padding * 2)
      };
    }

    // Fallback to restaurant-based bounds (original behavior)
    if (restaurants.length === 0) {
      return { x: 0, y: 0, width: this.config.citySquareSize, height: this.config.citySquareSize };
    }

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    restaurants.forEach(restaurant => {
      const x = restaurant.override_x ?? restaurant.x ?? 0;
      const y = restaurant.override_y ?? restaurant.y ?? 0;
      
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    });

    // Add padding
    const padding = 100;
    minX -= padding;
    maxX += padding;
    minY -= padding;
    maxY += padding;

    // Calculate center and create square bounds
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const currentWidth = maxX - minX;
    const currentHeight = maxY - minY;
    
    // Use the larger of current size or configured size
    const sideLength = Math.max(currentWidth, currentHeight, this.config.citySquareSize);
    
    return {
      x: centerX - sideLength / 2,
      y: centerY - sideLength / 2,
      width: sideLength,
      height: sideLength
    };
  }

  /**
   * Generate evenly spaced points using Poisson disc sampling
   */
  poissonSampleInSquare(bounds: Bounds, minDist: number, maxAttempts: number = 30): Point[] {
    const points: Point[] = [];
    const cellSize = minDist / Math.sqrt(2);
    const gridWidth = Math.ceil(bounds.width / cellSize);
    const gridHeight = Math.ceil(bounds.height / cellSize);
    const grid: (Point | null)[][] = Array(gridHeight).fill(null).map(() => Array(gridWidth).fill(null));
    const activeList: Point[] = [];

    // Add initial point
    const firstPoint = {
      x: bounds.x + this.rng.next() * bounds.width,
      y: bounds.y + this.rng.next() * bounds.height
    };
    
    points.push(firstPoint);
    activeList.push(firstPoint);
    
    const gridX = Math.floor((firstPoint.x - bounds.x) / cellSize);
    const gridY = Math.floor((firstPoint.y - bounds.y) / cellSize);
    grid[gridY][gridX] = firstPoint;

    while (activeList.length > 0) {
      const randomIndex = Math.floor(this.rng.next() * activeList.length);
      const point = activeList[randomIndex];
      let found = false;

      for (let attempts = 0; attempts < maxAttempts; attempts++) {
        // Generate random point around current point
        const angle = this.rng.next() * 2 * Math.PI;
        const distance = this.rng.nextInRange(minDist, 2 * minDist);
        const newPoint = {
          x: point.x + Math.cos(angle) * distance,
          y: point.y + Math.sin(angle) * distance
        };

        // Check if point is within bounds
        if (newPoint.x < bounds.x || newPoint.x >= bounds.x + bounds.width ||
            newPoint.y < bounds.y || newPoint.y >= bounds.y + bounds.height) {
          continue;
        }

        // Check if point is far enough from existing points
        const newGridX = Math.floor((newPoint.x - bounds.x) / cellSize);
        const newGridY = Math.floor((newPoint.y - bounds.y) / cellSize);

        if (this.isValidPoint(newPoint, grid, gridWidth, gridHeight, newGridX, newGridY, cellSize, minDist, bounds)) {
          points.push(newPoint);
          activeList.push(newPoint);
          grid[newGridY][newGridX] = newPoint;
          found = true;
          break;
        }
      }

      if (!found) {
        activeList.splice(randomIndex, 1);
      }
    }

    return points;
  }

  private isValidPoint(
    point: Point,
    grid: (Point | null)[][],
    gridWidth: number,
    gridHeight: number,
    gridX: number,
    gridY: number,
    _cellSize: number,
    minDist: number,
    _bounds: Bounds
  ): boolean {
    // Check neighboring grid cells
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const checkX = gridX + dx;
        const checkY = gridY + dy;

        if (checkX >= 0 && checkX < gridWidth && checkY >= 0 && checkY < gridHeight) {
          const neighbor = grid[checkY][checkX];
          if (neighbor) {
            const distance = Math.sqrt(
              Math.pow(point.x - neighbor.x, 2) + Math.pow(point.y - neighbor.y, 2)
            );
            if (distance < minDist) {
              return false;
            }
          }
        }
      }
    }

    return true;
  }

  /**
   * Generate positions using grid layout with jitter for even distribution
   */
  private generateGridWithJitter(
    count: number,
    minDistance: number,
    bounds: Bounds,
    rng: () => number
  ): {x: number, y: number}[] {
    const positions: {x: number, y: number}[] = [];
    
    // Calculate grid dimensions
    const cols = Math.ceil(Math.sqrt(count));
    const rows = Math.ceil(count / cols);
    
    const cellWidth = bounds.width / cols;
    const cellHeight = bounds.height / rows;
    
    // Calculate maximum jitter to maintain minimum distance
    const maxJitter = Math.min(
      (cellWidth - minDistance) / 2,
      (cellHeight - minDistance) / 2,
      this.config.gridJitterAmount || 50
    );
    
    for (let i = 0; i < count; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      
      // Base grid position (center of cell)
      const baseX = bounds.x + (col + 0.5) * cellWidth;
      const baseY = bounds.y + (row + 0.5) * cellHeight;
      
      // Add random jitter
      const jitterX = (rng() - 0.5) * 2 * maxJitter;
      const jitterY = (rng() - 0.5) * 2 * maxJitter;
      
      const x = Math.max(bounds.x, Math.min(bounds.x + bounds.width, baseX + jitterX));
      const y = Math.max(bounds.y, Math.min(bounds.y + bounds.height, baseY + jitterY));
      
      positions.push({ x, y });
    }
    
    return positions;
  }

  /**
   * Generate positions using Poisson disc sampling for organic distribution
   */
  private generatePoissonDisc(
    count: number,
    minDistance: number,
    bounds: Bounds,
    _rng: () => number
  ): {x: number, y: number}[] {
    const points = this.poissonSampleInSquare(bounds, minDistance);
    // Take up to the requested count
    return points.slice(0, count).map(p => ({ x: p.x, y: p.y }));
  }

  /**
   * Generate positions using hybrid approach: grid base with Poisson refinement
   */
  private generateHybridDistribution(
    count: number,
    minDistance: number,
    bounds: Bounds,
    rng: () => number
  ): {x: number, y: number}[] {
    // Start with grid layout for even coverage
    const gridPositions = this.generateGridWithJitter(count, minDistance, bounds, rng);
    
    // Apply Poisson-like adjustments to improve spacing
    const maxIterations = 50;
    const positions = [...gridPositions];
    
    for (let iter = 0; iter < maxIterations; iter++) {
      let improved = false;
      
      for (let i = 0; i < positions.length; i++) {
        const pos = positions[i];
        let bestX = pos.x;
        let bestY = pos.y;
        let bestScore = this.calculatePositionScore(pos, positions, bounds);
        
        // Try small adjustments
        const adjustmentRange = minDistance * 0.3;
        for (let tries = 0; tries < 5; tries++) {
          const newX = pos.x + (rng() - 0.5) * adjustmentRange * 2;
          const newY = pos.y + (rng() - 0.5) * adjustmentRange * 2;
          
          // Keep within bounds
          if (newX < bounds.x || newX > bounds.x + bounds.width ||
              newY < bounds.y || newY > bounds.y + bounds.height) {
            continue;
          }
          
          const testPos = { x: newX, y: newY };
          const testPositions = [...positions];
          testPositions[i] = testPos;
          
          const score = this.calculatePositionScore(testPos, testPositions, bounds);
          if (score > bestScore) {
            bestX = newX;
            bestY = newY;
            bestScore = score;
            improved = true;
          }
        }
        
        positions[i] = { x: bestX, y: bestY };
      }
      
      if (!improved) break;
    }
    
    return positions;
  }

  /**
   * Calculate position quality score (higher is better)
   */
  private calculatePositionScore(
    pos: {x: number, y: number},
    allPositions: {x: number, y: number}[],
    bounds: Bounds
  ): number {
    let score = 0;
    
    // Penalty for being too close to other positions
    for (const other of allPositions) {
      if (other === pos) continue;
      const distance = Math.sqrt((pos.x - other.x) ** 2 + (pos.y - other.y) ** 2);
      if (distance < this.config.minDistanceBetweenRestaurants) {
        score -= 1000; // Heavy penalty for violation
      } else {
        score += Math.min(distance, this.config.minDistanceBetweenRestaurants * 2); // Reward for good spacing
      }
    }
    
    // Penalty for being too close to edges
    const edgeDistance = Math.min(
      pos.x - bounds.x,
      bounds.x + bounds.width - pos.x,
      pos.y - bounds.y,
      bounds.y + bounds.height - pos.y
    );
    score += edgeDistance;
    
    return score;
  }

  /**
   * Validate that restaurants are distributed across all quadrants
   */
  private validateQuadrantDistribution(
    positions: {x: number, y: number}[],
    bounds: Bounds
  ): boolean {
    if (!this.config.quadrantMinimum) return true;
    
    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;
    
    const quadrants = {
      topLeft: 0,
      topRight: 0,
      bottomLeft: 0,
      bottomRight: 0
    };
    
    for (const pos of positions) {
      if (pos.x < centerX && pos.y < centerY) quadrants.topLeft++;
      else if (pos.x >= centerX && pos.y < centerY) quadrants.topRight++;
      else if (pos.x < centerX && pos.y >= centerY) quadrants.bottomLeft++;
      else quadrants.bottomRight++;
    }
    
    const minPerQuadrant = this.config.quadrantMinimum;
    return Object.values(quadrants).every(count => count >= minPerQuadrant);
  }

  /**
   * Create district zones for coherent placement
   */
  createDistrictZones(bounds: Bounds, numDistricts: number = 6): Array<{bounds: Bounds, name: string, theme: string}> {
    const districts = [];
    const cols = Math.ceil(Math.sqrt(numDistricts));
    const rows = Math.ceil(numDistricts / cols);
    
    const districtWidth = bounds.width / cols;
    const districtHeight = bounds.height / rows;

    const districtNames = [
      'Downtown', 'Chinatown', 'Little Italy', 'French Quarter',
      'Korean District', 'Tech District', 'Arts Quarter', 'Riverside',
      'Historic District'
    ];

    const themes = [
      'commercial', 'cultural', 'cultural', 'upscale',
      'cultural', 'commercial', 'mixed', 'casual',
      'upscale'
    ];

    for (let row = 0; row < rows && districts.length < numDistricts; row++) {
      for (let col = 0; col < cols && districts.length < numDistricts; col++) {
        districts.push({
          bounds: {
            x: bounds.x + col * districtWidth,
            y: bounds.y + row * districtHeight,
            width: districtWidth,
            height: districtHeight
          },
          name: districtNames[districts.length] || `District ${districts.length + 1}`,
          theme: themes[districts.length] || 'mixed'
        });
      }
    }

    return districts;
  }

  /**
   * Find the best restaurants to reposition based on density and clustering
   */
  selectRestaurantsToReposition(
    restaurants: Array<{restaurant_id: number, x?: number, y?: number, override_x?: number, override_y?: number}>,
    repositionPercentage: number
  ): number[] {
    const positions = restaurants.map(r => ({
      id: r.restaurant_id,
      x: r.override_x ?? r.x ?? 0,
      y: r.override_y ?? r.y ?? 0
    }));

    // Calculate density scores (restaurants with many close neighbors get higher scores)
    const densityScores = positions.map((pos, index) => {
      let nearbyCount = 0;
      positions.forEach((otherPos, otherIndex) => {
        if (index !== otherIndex) {
          const distance = Math.sqrt(
            Math.pow(pos.x - otherPos.x, 2) + Math.pow(pos.y - otherPos.y, 2)
          );
          if (distance < this.config.minDistanceBetweenRestaurants * 1.5) {
            nearbyCount++;
          }
        }
      });
      return { id: pos.id, score: nearbyCount };
    });

    // Sort by density score (highest first) and select top percentage
    densityScores.sort((a, b) => b.score - a.score);
    const numToReposition = Math.ceil(restaurants.length * repositionPercentage);
    
    return densityScores.slice(0, numToReposition).map(item => item.id);
  }

  /**
   * Assign districts to restaurants based on cuisine similarity
   */
  assignRestaurantsToDistricts(
    restaurants: Array<{restaurant_id: number, cuisine_type: string}>,
    districts: Array<{bounds: Bounds, name: string, theme: string}>
  ): Map<number, number> {
    const assignments = new Map<number, number>();

    // Group restaurants by cuisine type
    const cuisineGroups = new Map<string, number[]>();
    restaurants.forEach(restaurant => {
      if (!cuisineGroups.has(restaurant.cuisine_type)) {
        cuisineGroups.set(restaurant.cuisine_type, []);
      }
      cuisineGroups.get(restaurant.cuisine_type)!.push(restaurant.restaurant_id);
    });

    // Assign cuisine groups to districts
    const cuisineTypes = Array.from(cuisineGroups.keys());
    cuisineTypes.forEach((cuisine, index) => {
      const districtIndex = index % districts.length;
      const restaurantIds = cuisineGroups.get(cuisine)!;
      
      restaurantIds.forEach(restaurantId => {
        assignments.set(restaurantId, districtIndex);
      });
    });

    return assignments;
  }

  /**
   * Main method to reposition restaurants
   */
  repositionRestaurants(
    restaurants: Array<{
      restaurant_id: number;
      cuisine_type: string;
      x?: number;
      y?: number;
      override_x?: number;
      override_y?: number;
    }>
  ): Array<{restaurantId: number, x: number, y: number, district: string}> {
    console.log('Starting restaurant repositioning...');

    // Calculate square bounds
    const bounds = this.calculateSquareBounds(restaurants);
    console.log('Square bounds:', bounds);

    // Create district zones
    const districts = this.createDistrictZones(bounds);
    console.log('Created', districts.length, 'districts');

    // Select restaurants to reposition
    const restaurantsToReposition = this.selectRestaurantsToReposition(
      restaurants,
      this.config.repositionPercentage
    );
    console.log('Repositioning', restaurantsToReposition.length, 'restaurants');

    // Generate sample points using configured distribution method
    let samplePoints: {x: number, y: number}[] = [];
    const rng = () => this.rng.next();
    
    console.log('Using distribution mode:', this.config.spreadMode);
    
    switch (this.config.spreadMode) {
      case 'grid':
        samplePoints = this.generateGridWithJitter(
          restaurantsToReposition.length,
          this.config.minDistanceBetweenRestaurants,
          bounds,
          rng
        );
        break;
      case 'poisson':
        samplePoints = this.generatePoissonDisc(
          restaurantsToReposition.length,
          this.config.minDistanceBetweenRestaurants,
          bounds,
          rng
        );
        break;
      case 'hybrid':
        samplePoints = this.generateHybridDistribution(
          restaurantsToReposition.length,
          this.config.minDistanceBetweenRestaurants,
          bounds,
          rng
        );
        break;
      default:
        // Fallback to Poisson
        const poissonPoints = this.poissonSampleInSquare(
          bounds,
          this.config.minDistanceBetweenRestaurants,
          this.config.poissonSamples
        );
        samplePoints = poissonPoints.slice(0, restaurantsToReposition.length).map(p => ({ x: p.x, y: p.y }));
    }
    
    console.log('Generated', samplePoints.length, 'sample points using', this.config.spreadMode, 'distribution');
    
    // Validate quadrant distribution if required
    if (this.config.ensureFullCoverage && this.config.quadrantMinimum > 0) {
      const isValid = this.validateQuadrantDistribution(samplePoints, bounds);
      console.log('Quadrant distribution valid:', isValid);
      
      if (!isValid) {
        console.warn('Generated positions do not meet quadrant requirements, but proceeding anyway');
        // In production, you might want to regenerate or adjust positions here
      }
    }

    // Assign restaurants to districts
    const districtAssignments = this.assignRestaurantsToDistricts(restaurants, districts);

    // Create placement results
    const placements: Array<{restaurantId: number, x: number, y: number, district: string}> = [];

    restaurantsToReposition.forEach((restaurantId, index) => {
      if (index < samplePoints.length) {
        const point = samplePoints[index];
        const districtIndex = districtAssignments.get(restaurantId) ?? 0;
        const district = districts[districtIndex];

        placements.push({
          restaurantId,
          x: Math.round(point.x),
          y: Math.round(point.y),
          district: district.name
        });
      }
    });

    console.log('Generated', placements.length, 'new placements');
    return placements;
  }
}
