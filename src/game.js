// Main game entry point - Pure JavaScript implementation using working food-memory-game
import { sqliteManager } from './data/sqlite.js';
import { DialogManager } from './systems/dialogManager.js';

class GameApp {
  constructor() {
    this.dialogManager = null;
    this.isLoading = true;
    this.gameEngine = null;
    this.player = null;
  }

  async initialize() {
    try {
      console.log('Initializing game app...');
      
      // Initialize database first
      await sqliteManager.initialize();
      
      // Initialize dialog manager
      this.dialogManager = new DialogManager();
      await this.dialogManager.initialize();
      
      // The working implementation uses global objects, so we'll set them up
      window.gameDialogSystem = this.dialogManager;
      window.gameDatabase = sqliteManager;
      
      console.log('Game initialized successfully');
      this.isLoading = false;
      
      // The working implementation will initialize itself via its own script tags
      
    } catch (error) {
      console.error('Failed to initialize game:', error);
      throw error;
    }
  }

  // Keep some compatibility methods for any remaining calls
  showLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      loadingScreen.classList.remove('hidden');
    }
  }

  hideLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      loadingScreen.classList.add('hidden');
    }
  }
}
