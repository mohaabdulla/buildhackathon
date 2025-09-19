import React, { useState, useEffect } from 'react';
import { useGameStore, useTraitsSummary } from '@/systems/identity';

interface IdentityClue {
  restaurant: string;
  clue: string;
  timestamp: Date;
}

export const HUD: React.FC = () => {
  const { discoveredShards, camera, player } = useGameStore();
  const traitsSummary = useTraitsSummary();
  const [recentClues, setRecentClues] = useState<IdentityClue[]>([]);
  const [nearbyRestaurant, setNearbyRestaurant] = useState<string | null>(null);

  useEffect(() => {
    // Listen for identity clues and restaurant proximity
    const handleClueFound = (event: CustomEvent) => {
      const clue: IdentityClue = event.detail;
      setRecentClues(prev => [clue, ...prev.slice(0, 4)]); // Keep last 5 clues
    };

    const handleRestaurantNearby = (event: CustomEvent) => {
      setNearbyRestaurant(event.detail.message);
    };

    const handleInvestigation = () => {
      setNearbyRestaurant(null); // Clear the prompt when investigating
    };

    // Get the pixiRenderer event bus (we'll need to pass this from the parent)
    window.addEventListener('identityClueFound' as any, handleClueFound);
    window.addEventListener('restaurantNearby' as any, handleRestaurantNearby);
    window.addEventListener('investigateRestaurant' as any, handleInvestigation);

    return () => {
      window.removeEventListener('identityClueFound' as any, handleClueFound);
      window.removeEventListener('restaurantNearby' as any, handleRestaurantNearby);
      window.removeEventListener('investigateRestaurant' as any, handleInvestigation);
    };
  }, []);

  return (
    <div className="hud">
      <div className="hud-section">
        <h3>Investigation Progress</h3>
        <p>Clues Found: {discoveredShards.length}</p>
        <p>Position: ({Math.round(player.x)}, {Math.round(player.y)})</p>
        <p>Zoom: {camera.zoom.toFixed(1)}x</p>
      </div>

      {nearbyRestaurant && (
        <div className="hud-section interaction-prompt">
          <h3>🔍 Investigation Available</h3>
          <p>{nearbyRestaurant}</p>
        </div>
      )}

      {recentClues.length > 0 && (
        <div className="hud-section">
          <h3>Recent Clues</h3>
          <div className="clues-list">
            {recentClues.map((clue, index) => (
              <div key={index} className="clue-item">
                <strong>{clue.restaurant}</strong>
                <p>{clue.clue}</p>
                <small>{clue.timestamp.toLocaleTimeString()}</small>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="hud-section">
        <h3>Detective Profile</h3>
        <div className="traits-display">{/* existing traits code */}
          {Object.entries(useGameStore.getState().traits).map(([trait, value]) => (
            <div key={trait} className="trait-item">
              <label>{trait.replace(/([A-Z])/g, ' $1').toLowerCase()}</label>
              <div className="trait-bar">
                <div 
                  className={`trait-fill ${trait.toLowerCase().replace(/([A-Z])/g, '-$1')}`}
                  style={{ width: `${value}%` }}
                />
              </div>
              <span>{value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="controls">
        <button 
          className="control-btn"
          onClick={() => useGameStore.getState().toggleCorkboard()}
        >
          📋 Corkboard
        </button>
        <button 
          className="control-btn"
          onClick={() => useGameStore.getState().toggleInventory()}
        >
          📖 Journal
        </button>
        <button 
          className="control-btn"
          onClick={() => console.log('Toggle music')}
        >
          🎵 Music
        </button>
      </div>
    </div>
  );
};
