export interface DifficultyConfig {
  travelTimeTarget: number; // Target travel time between restaurants in seconds
  minDistanceBetweenRestaurants: number; // Minimum distance in pixels
  playerSpeed: number; // Player movement speed in pixels per second
  citySquareSize: number; // Size of the square city bounds
  poissonSamples: number; // Number of attempts for Poisson sampling
  rngSeed: number; // Random seed for reproducible placement
  repositionPercentage: number; // Percentage of restaurants to reposition (0-1)
  maxSnapDistance: number; // Maximum distance to snap to road in pixels
  
  // New full map distribution settings
  spreadMode: 'grid' | 'poisson' | 'hybrid'; // Distribution algorithm
  useFullMapBounds: boolean; // Use entire map instead of clustering
  quadrantMinimum: number; // Minimum restaurants per quadrant
  gridJitterAmount: number; // Jitter amount for grid mode (in pixels)
  ensureFullCoverage: boolean; // Ensure restaurants span entire map
}

export const DEFAULT_DIFFICULTY: DifficultyConfig = {
  travelTimeTarget: 60, // Adjusted for 1024x768 map
  minDistanceBetweenRestaurants: 100, // Increased for slightly larger map
  playerSpeed: 120, // 120 pixels per second
  citySquareSize: 1024, // Match the new map size
  poissonSamples: 30, // 30 attempts per point
  rngSeed: 42, // Fixed seed for consistency
  repositionPercentage: 1.0, // Reposition ALL restaurants for full distribution
  maxSnapDistance: 36, // Adjusted snap distance
  
  // Full map distribution settings
  spreadMode: 'grid', // Use grid for most even distribution
  useFullMapBounds: true, // Use full map coverage
  quadrantMinimum: 4, // At least 4 restaurants per quadrant
  gridJitterAmount: 120, // Increased jitter for larger map
  ensureFullCoverage: true // Ensure restaurants span entire map
};

export class DifficultyManager {
  private config: DifficultyConfig = { ...DEFAULT_DIFFICULTY };

  getConfig(): DifficultyConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<DifficultyConfig>): void {
    this.config = { ...this.config, ...updates };
    this.validateConfig();
  }

  private validateConfig(): void {
    if (this.config.travelTimeTarget < 30) {
      this.config.travelTimeTarget = 30;
    }
    if (this.config.travelTimeTarget > 300) {
      this.config.travelTimeTarget = 300;
    }
    
    if (this.config.minDistanceBetweenRestaurants < 50) {
      this.config.minDistanceBetweenRestaurants = 50;
    }
    
    if (this.config.repositionPercentage < 0) {
      this.config.repositionPercentage = 0;
    }
    if (this.config.repositionPercentage > 1) {
      this.config.repositionPercentage = 1;
    }
  }

  /**
   * Calculate minimum distance based on travel time target and player speed
   */
  calculateOptimalMinDistance(): number {
    // Assume A* path is roughly 1.4x straight-line distance due to obstacles
    const pathMultiplier = 1.4;
    const straightLineDistance = (this.config.travelTimeTarget * this.config.playerSpeed) / pathMultiplier;
    return Math.round(straightLineDistance);
  }

  /**
   * Update min distance based on travel time target
   */
  autoTuneDistance(): void {
    this.config.minDistanceBetweenRestaurants = this.calculateOptimalMinDistance();
  }

  /**
   * Get difficulty preset configurations
   */
  static getPresets(): Record<string, DifficultyConfig> {
    return {
      easy: {
        ...DEFAULT_DIFFICULTY,
        travelTimeTarget: 60,
        minDistanceBetweenRestaurants: 120,
        repositionPercentage: 0.6,
        gridJitterAmount: 40
      },
      normal: {
        ...DEFAULT_DIFFICULTY,
        travelTimeTarget: 90,
        minDistanceBetweenRestaurants: 150,
        repositionPercentage: 0.8,
        gridJitterAmount: 60
      },
      hard: {
        ...DEFAULT_DIFFICULTY,
        travelTimeTarget: 120,
        minDistanceBetweenRestaurants: 180,
        repositionPercentage: 0.9,
        gridJitterAmount: 80
      },
      expert: {
        ...DEFAULT_DIFFICULTY,
        travelTimeTarget: 150,
        minDistanceBetweenRestaurants: 220,
        repositionPercentage: 1.0,
        gridJitterAmount: 100,
        quadrantMinimum: 3
      }
    };
  }

  /**
   * Apply a difficulty preset
   */
  applyPreset(presetName: string): void {
    const presets = DifficultyManager.getPresets();
    if (presets[presetName]) {
      this.config = { ...presets[presetName] };
    }
  }
}

// Global difficulty manager instance
export const difficultyManager = new DifficultyManager();
