import React, { useEffect, useState } from 'react';
import { SceneManager } from '@/engine/scenes';
import { LoadingScreen } from '@/ui/LoadingScreen';
import { HUD } from '@/ui/HUD';
import { Corkboard } from '@/ui/Corkboard';
import { Journal } from '@/ui/Journal';
import { DifficultyPanel } from '@/ui/DifficultyPanel';
import { useGameStore } from '@/systems/identity';

export const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [sceneManager, setSceneManager] = useState<SceneManager | null>(null);
  
  const { 
    isCorkboardOpen, 
    isInventoryOpen,
    progress: _progress 
  } = useGameStore();

  useEffect(() => {
    const initializeGame = async () => {
      try {
        // Wait for DOM to be ready
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const container = document.getElementById('pixi-container');
        if (!container) {
          throw new Error('PixiJS container element not found');
        }
        
        // Initialize scene manager
        const sm = new SceneManager();
        await sm.initialize(container);
        setSceneManager(sm);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to initialize game:', error);
        setIsLoading(false);
      }
    };

    initializeGame();

    return () => {
      if (sceneManager) {
        sceneManager.destroy();
      }
    };
  }, []);

  // Don't render anything until we have a container
  if (isLoading) {
    return (
      <div className="game-container">
        {/* PixiJS canvas container - create it even during loading */}
        <div id="pixi-container" style={{ position: 'absolute', top: 0, left: 0 }} />
        <LoadingScreen />
      </div>
    );
  }

  return (
    <div className="game-container">
      {/* PixiJS canvas container */}
      <div id="pixi-container" style={{ position: 'absolute', top: 0, left: 0 }} />
      
      {/* React UI overlay */}
      <div className="game-ui">
        <HUD />
        <DifficultyPanel />
        
        {isCorkboardOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <button 
                className="modal-close"
                onClick={() => useGameStore.getState().toggleCorkboard()}
              >
                ×
              </button>
              <Corkboard />
            </div>
          </div>
        )}
        
        {isInventoryOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <button 
                className="modal-close"
                onClick={() => useGameStore.getState().toggleInventory()}
              >
                ×
              </button>
              <Journal />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
