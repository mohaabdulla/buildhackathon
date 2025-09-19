export interface PathNode {
  x: number;
  y: number;
  g: number; // Cost from start
  h: number; // Heuristic cost to goal
  f: number; // Total cost
  parent?: PathNode;
}

export interface PathfindingResult {
  path: Array<{ x: number; y: number }>;
  found: boolean;
  distance: number;
}

export class Pathfinder {
  private readonly TILE_SIZE = 16;
  private walkabilityGrid: boolean[][] = [];
  private gridWidth: number = 0;
  private gridHeight: number = 0;

  constructor(gridWidth: number, gridHeight: number) {
    this.gridWidth = gridWidth;
    this.gridHeight = gridHeight;
    this.initializeGrid();
  }

  private initializeGrid(): void {
    this.walkabilityGrid = Array(this.gridHeight).fill(null).map(() =>
      Array(this.gridWidth).fill(true)
    );
  }

  /**
   * Update the walkability grid based on the city layout
   */
  public updateWalkabilityGrid(tileGrid: Array<Array<{ walkable: boolean }>>): void {
    this.gridHeight = tileGrid.length;
    this.gridWidth = tileGrid[0]?.length || 0;
    
    this.walkabilityGrid = tileGrid.map(row =>
      row.map(tile => tile.walkable)
    );
  }

  /**
   * Find a path from start to goal using A* algorithm
   */
  public findPath(
    startX: number,
    startY: number,
    goalX: number,
    goalY: number
  ): PathfindingResult {
    // Convert world coordinates to grid coordinates
    const startGridX = Math.floor(startX / this.TILE_SIZE);
    const startGridY = Math.floor(startY / this.TILE_SIZE);
    const goalGridX = Math.floor(goalX / this.TILE_SIZE);
    const goalGridY = Math.floor(goalY / this.TILE_SIZE);

    // Validate coordinates
    if (!this.isValidTile(startGridX, startGridY) || 
        !this.isValidTile(goalGridX, goalGridY)) {
      return { path: [], found: false, distance: 0 };
    }

    // Check if goal is walkable
    if (!this.walkabilityGrid[goalGridY][goalGridX]) {
      // Try to find a nearby walkable tile
      const nearbyGoal = this.findNearestWalkableTile(goalGridX, goalGridY);
      if (!nearbyGoal) {
        return { path: [], found: false, distance: 0 };
      }
      return this.findPath(startX, startY, nearbyGoal.x * this.TILE_SIZE, nearbyGoal.y * this.TILE_SIZE);
    }

    const openList: PathNode[] = [];
    const closedList: Set<string> = new Set();

    const startNode: PathNode = {
      x: startGridX,
      y: startGridY,
      g: 0,
      h: this.calculateHeuristic(startGridX, startGridY, goalGridX, goalGridY),
      f: 0
    };
    startNode.f = startNode.g + startNode.h;

    openList.push(startNode);

    while (openList.length > 0) {
      // Find node with lowest f cost
      let currentIndex = 0;
      for (let i = 1; i < openList.length; i++) {
        if (openList[i].f < openList[currentIndex].f) {
          currentIndex = i;
        }
      }

      const currentNode = openList.splice(currentIndex, 1)[0];
      const currentKey = `${currentNode.x},${currentNode.y}`;
      closedList.add(currentKey);

      // Check if we reached the goal
      if (currentNode.x === goalGridX && currentNode.y === goalGridY) {
        const path = this.reconstructPath(currentNode);
        return {
          path: path.map(node => ({
            x: node.x * this.TILE_SIZE + this.TILE_SIZE / 2,
            y: node.y * this.TILE_SIZE + this.TILE_SIZE / 2
          })),
          found: true,
          distance: currentNode.g
        };
      }

      // Check neighbors
      const neighbors = this.getNeighbors(currentNode.x, currentNode.y);
      for (const neighbor of neighbors) {
        const neighborKey = `${neighbor.x},${neighbor.y}`;
        
        if (closedList.has(neighborKey)) {
          continue;
        }

        if (!this.walkabilityGrid[neighbor.y][neighbor.x]) {
          continue;
        }

        const gCost = currentNode.g + this.getMovementCost(currentNode, neighbor);
        const existingIndex = openList.findIndex(n => n.x === neighbor.x && n.y === neighbor.y);

        if (existingIndex === -1) {
          // New node
          const hCost = this.calculateHeuristic(neighbor.x, neighbor.y, goalGridX, goalGridY);
          const newNode: PathNode = {
            x: neighbor.x,
            y: neighbor.y,
            g: gCost,
            h: hCost,
            f: gCost + hCost,
            parent: currentNode
          };
          openList.push(newNode);
        } else {
          // Update existing node if this path is better
          if (gCost < openList[existingIndex].g) {
            openList[existingIndex].g = gCost;
            openList[existingIndex].f = gCost + openList[existingIndex].h;
            openList[existingIndex].parent = currentNode;
          }
        }
      }
    }

    return { path: [], found: false, distance: 0 };
  }

  private isValidTile(x: number, y: number): boolean {
    return x >= 0 && x < this.gridWidth && y >= 0 && y < this.gridHeight;
  }

  private calculateHeuristic(x1: number, y1: number, x2: number, y2: number): number {
    // Manhattan distance
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
  }

  private getNeighbors(x: number, y: number): Array<{ x: number; y: number }> {
    const neighbors = [];
    
    // 4-directional movement (no diagonal)
    const directions = [
      { dx: 0, dy: -1 }, // Up
      { dx: 1, dy: 0 },  // Right
      { dx: 0, dy: 1 },  // Down
      { dx: -1, dy: 0 }  // Left
    ];

    for (const dir of directions) {
      const newX = x + dir.dx;
      const newY = y + dir.dy;
      
      if (this.isValidTile(newX, newY)) {
        neighbors.push({ x: newX, y: newY });
      }
    }

    return neighbors;
  }

  private getMovementCost(from: PathNode, to: { x: number; y: number }): number {
    // Different costs for different tile types could be implemented here
    return 1;
  }

  private reconstructPath(goalNode: PathNode): Array<{ x: number; y: number }> {
    const path = [];
    let current: PathNode | undefined = goalNode;
    
    while (current) {
      path.unshift({ x: current.x, y: current.y });
      current = current.parent;
    }
    
    return path;
  }

  private findNearestWalkableTile(x: number, y: number): { x: number; y: number } | null {
    const maxRadius = 10;
    
    for (let radius = 1; radius <= maxRadius; radius++) {
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          if (Math.abs(dx) + Math.abs(dy) !== radius) continue; // Only check perimeter
          
          const checkX = x + dx;
          const checkY = y + dy;
          
          if (this.isValidTile(checkX, checkY) && this.walkabilityGrid[checkY][checkX]) {
            return { x: checkX, y: checkY };
          }
        }
      }
    }
    
    return null;
  }

  /**
   * Check if there's a clear path between two points
   */
  public hasLineOfSight(x1: number, y1: number, x2: number, y2: number): boolean {
    const gridX1 = Math.floor(x1 / this.TILE_SIZE);
    const gridY1 = Math.floor(y1 / this.TILE_SIZE);
    const gridX2 = Math.floor(x2 / this.TILE_SIZE);
    const gridY2 = Math.floor(y2 / this.TILE_SIZE);

    const dx = Math.abs(gridX2 - gridX1);
    const dy = Math.abs(gridY2 - gridY1);
    const sx = gridX1 < gridX2 ? 1 : -1;
    const sy = gridY1 < gridY2 ? 1 : -1;
    let err = dx - dy;

    let x = gridX1;
    let y = gridY1;

    while (true) {
      if (!this.isValidTile(x, y) || !this.walkabilityGrid[y][x]) {
        return false;
      }

      if (x === gridX2 && y === gridY2) {
        return true;
      }

      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x += sx;
      }
      if (e2 < dx) {
        err += dx;
        y += sy;
      }
    }
  }

  /**
   * Get walkable positions within a radius
   */
  public getWalkablePositionsInRadius(
    centerX: number,
    centerY: number,
    radius: number
  ): Array<{ x: number; y: number }> {
    const gridX = Math.floor(centerX / this.TILE_SIZE);
    const gridY = Math.floor(centerY / this.TILE_SIZE);
    const gridRadius = Math.ceil(radius / this.TILE_SIZE);
    const positions = [];

    for (let dy = -gridRadius; dy <= gridRadius; dy++) {
      for (let dx = -gridRadius; dx <= gridRadius; dx++) {
        const x = gridX + dx;
        const y = gridY + dy;
        
        if (this.isValidTile(x, y) && this.walkabilityGrid[y][x]) {
          const worldX = x * this.TILE_SIZE + this.TILE_SIZE / 2;
          const worldY = y * this.TILE_SIZE + this.TILE_SIZE / 2;
          const distance = Math.sqrt(
            Math.pow(worldX - centerX, 2) + Math.pow(worldY - centerY, 2)
          );
          
          if (distance <= radius) {
            positions.push({ x: worldX, y: worldY });
          }
        }
      }
    }

    return positions;
  }
}
