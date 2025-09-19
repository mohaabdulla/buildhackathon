import { Point } from './restaurantRepositioning';
import { TileType } from './mapGeneration';

export interface SnapResult {
  snappedPosition: Point;
  distance: number;
  roadType: 'road' | 'sidewalk';
  accessPoint: Point; // Nearest walkable point for player access
}

/**
 * Road snapping system to ensure restaurants are accessible
 */
export class RoadSnapper {
  private readonly TILE_SIZE = 16;
  private tileGrid: TileType[][] = [];
  private gridWidth: number = 0;
  private gridHeight: number = 0;

  constructor() {}

  /**
   * Update the tile grid for snapping calculations
   */
  updateTileGrid(tileGrid: TileType[][]): void {
    this.tileGrid = tileGrid;
    this.gridHeight = tileGrid.length;
    this.gridWidth = tileGrid[0]?.length || 0;
  }

  /**
   * Find the nearest road or sidewalk to a given position
   */
  findNearestRoad(position: Point, maxDistance: number = 64): SnapResult | null {
    const centerTileX = Math.floor(position.x / this.TILE_SIZE);
    const centerTileY = Math.floor(position.y / this.TILE_SIZE);
    const maxTileDistance = Math.ceil(maxDistance / this.TILE_SIZE);

    let nearestRoad: SnapResult | null = null;
    let minDistance = Infinity;

    // Search in expanding squares around the position
    for (let radius = 1; radius <= maxTileDistance; radius++) {
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          // Only check perimeter of current radius
          if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) {
            continue;
          }

          const tileX = centerTileX + dx;
          const tileY = centerTileY + dy;

          if (this.isValidTile(tileX, tileY)) {
            const tile = this.tileGrid[tileY][tileX];
            
            if (tile.walkable && (tile.type === 'road' || tile.type === 'sidewalk')) {
              const roadPosition = {
                x: tileX * this.TILE_SIZE + this.TILE_SIZE / 2,
                y: tileY * this.TILE_SIZE + this.TILE_SIZE / 2
              };

              const distance = this.calculateDistance(position, roadPosition);

              if (distance < minDistance) {
                minDistance = distance;
                nearestRoad = {
                  snappedPosition: roadPosition,
                  distance,
                  roadType: tile.type as 'road' | 'sidewalk',
                  accessPoint: roadPosition
                };
              }
            }
          }
        }
      }

      // If we found a road, return it (we're searching in order of distance)
      if (nearestRoad) {
        break;
      }
    }

    return nearestRoad;
  }

  /**
   * Snap a position to the nearest road-adjacent parcel
   */
  snapToRoadAdjacentParcel(position: Point, maxSnapDistance: number = 64): SnapResult | null {
    const nearestRoad = this.findNearestRoad(position, maxSnapDistance);
    
    if (!nearestRoad) {
      return null;
    }

    // Find a suitable building parcel adjacent to the road
    const buildingPosition = this.findAdjacentBuildingSpot(nearestRoad.snappedPosition, position);
    
    if (buildingPosition) {
      return {
        snappedPosition: buildingPosition,
        distance: this.calculateDistance(position, buildingPosition),
        roadType: nearestRoad.roadType,
        accessPoint: nearestRoad.snappedPosition
      };
    }

    // If no adjacent building spot, use the road position itself
    return nearestRoad;
  }

  /**
   * Find a building spot adjacent to a road position
   */
  private findAdjacentBuildingSpot(roadPosition: Point, originalPosition: Point): Point | null {
    const roadTileX = Math.floor(roadPosition.x / this.TILE_SIZE);
    const roadTileY = Math.floor(roadPosition.y / this.TILE_SIZE);

    // Check adjacent tiles for suitable building placement
    const directions = [
      { dx: -1, dy: 0 }, { dx: 1, dy: 0 },  // Left, Right
      { dx: 0, dy: -1 }, { dx: 0, dy: 1 },  // Up, Down
      { dx: -1, dy: -1 }, { dx: 1, dy: -1 }, // Diagonals
      { dx: -1, dy: 1 }, { dx: 1, dy: 1 }
    ];

    let bestSpot: Point | null = null;
    let minDistance = Infinity;

    directions.forEach(({ dx, dy }) => {
      const buildingTileX = roadTileX + dx;
      const buildingTileY = roadTileY + dy;

      if (this.isValidTile(buildingTileX, buildingTileY)) {
        const tile = this.tileGrid[buildingTileY][buildingTileX];
        
        // Look for non-walkable areas (buildings) or grass that can be converted
        if (!tile.walkable || tile.type === 'grass' || tile.type === 'park') {
          const buildingPosition = {
            x: buildingTileX * this.TILE_SIZE + this.TILE_SIZE / 2,
            y: buildingTileY * this.TILE_SIZE + this.TILE_SIZE / 2
          };

          const distance = this.calculateDistance(originalPosition, buildingPosition);
          
          if (distance < minDistance) {
            minDistance = distance;
            bestSpot = buildingPosition;
          }
        }
      }
    });

    return bestSpot;
  }

  /**
   * Ensure a restaurant position has access to walkable tiles
   */
  ensureAccessibility(restaurantPosition: Point): Point {
    const tileX = Math.floor(restaurantPosition.x / this.TILE_SIZE);
    const tileY = Math.floor(restaurantPosition.y / this.TILE_SIZE);

    // Make sure adjacent tiles are walkable for player access
    const directions = [
      { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
      { dx: 0, dy: -1 }, { dx: 0, dy: 1 }
    ];

    directions.forEach(({ dx, dy }) => {
      const adjTileX = tileX + dx;
      const adjTileY = tileY + dy;

      if (this.isValidTile(adjTileX, adjTileY)) {
        // Mark adjacent tile as sidewalk for access
        this.tileGrid[adjTileY][adjTileX] = {
          walkable: true,
          type: 'sidewalk'
        };
      }
    });

    return restaurantPosition;
  }

  /**
   * Create a service road spur to connect isolated restaurants
   */
  createServiceRoad(from: Point, to: Point): Point[] {
    const servicePath: Point[] = [];
    
    const fromTileX = Math.floor(from.x / this.TILE_SIZE);
    const fromTileY = Math.floor(from.y / this.TILE_SIZE);
    const toTileX = Math.floor(to.x / this.TILE_SIZE);
    const toTileY = Math.floor(to.y / this.TILE_SIZE);

    // Create a simple L-shaped path
    const midTileX = fromTileX;
    const midTileY = toTileY;

    // Horizontal segment
    const startX = Math.min(fromTileX, midTileX);
    const endX = Math.max(fromTileX, midTileX);
    for (let x = startX; x <= endX; x++) {
      if (this.isValidTile(x, fromTileY)) {
        this.tileGrid[fromTileY][x] = { walkable: true, type: 'road' };
        servicePath.push({
          x: x * this.TILE_SIZE + this.TILE_SIZE / 2,
          y: fromTileY * this.TILE_SIZE + this.TILE_SIZE / 2
        });
      }
    }

    // Vertical segment
    const startY = Math.min(fromTileY, midTileY);
    const endY = Math.max(fromTileY, midTileY);
    for (let y = startY; y <= endY; y++) {
      if (this.isValidTile(midTileX, y)) {
        this.tileGrid[y][midTileX] = { walkable: true, type: 'road' };
        servicePath.push({
          x: midTileX * this.TILE_SIZE + this.TILE_SIZE / 2,
          y: y * this.TILE_SIZE + this.TILE_SIZE / 2
        });
      }
    }

    return servicePath;
  }

  /**
   * Validate that a position doesn't overlap with existing buildings
   */
  validatePosition(position: Point, minClearance: number = 32): boolean {
    const tileX = Math.floor(position.x / this.TILE_SIZE);
    const tileY = Math.floor(position.y / this.TILE_SIZE);
    const clearanceTiles = Math.ceil(minClearance / this.TILE_SIZE);

    // Check area around position for conflicts
    for (let dy = -clearanceTiles; dy <= clearanceTiles; dy++) {
      for (let dx = -clearanceTiles; dx <= clearanceTiles; dx++) {
        const checkX = tileX + dx;
        const checkY = tileY + dy;

        if (this.isValidTile(checkX, checkY)) {
          const tile = this.tileGrid[checkY][checkX];
          
          // Check for conflicts with existing restaurants or important buildings
          if (tile.type === 'building' && !tile.walkable) {
            const distance = Math.sqrt(dx * dx + dy * dy) * this.TILE_SIZE;
            if (distance < minClearance) {
              return false;
            }
          }
        }
      }
    }

    return true;
  }

  /**
   * Offset a position to avoid overlaps
   */
  offsetToAvoidOverlap(position: Point, stepSize: number = 16): Point {
    let currentPosition = { ...position };
    let attempts = 0;
    const maxAttempts = 20;

    while (!this.validatePosition(currentPosition) && attempts < maxAttempts) {
      // Try different offset directions
      const angle = (attempts * Math.PI) / 4; // 45-degree increments
      currentPosition = {
        x: position.x + Math.cos(angle) * stepSize * (attempts + 1),
        y: position.y + Math.sin(angle) * stepSize * (attempts + 1)
      };
      attempts++;
    }

    return currentPosition;
  }

  private isValidTile(tileX: number, tileY: number): boolean {
    return tileX >= 0 && tileX < this.gridWidth && tileY >= 0 && tileY < this.gridHeight;
  }

  private calculateDistance(p1: Point, p2: Point): number {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
  }
}
