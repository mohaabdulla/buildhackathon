import React, { useState, useEffect } from 'react';
import { difficultyManager } from '@/config/difficulty';
import { advancedMapGenerator } from '@/systems/advancedMapGeneration';

interface RepositioningStats {
  totalRestaurants: number;
  repositionedCount: number;
  averageSpacing: number;
  minSpacing: number;
  maxSpacing: number;
  targetSpacing: number;
}

export const DifficultyPanel: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [stats, setStats] = useState<RepositioningStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState(difficultyManager.getConfig());

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const repositioningStats = await advancedMapGenerator.getRepositioningStats();
      setStats(repositioningStats);
    } catch (error) {
      console.warn('Could not load repositioning stats:', error);
    }
  };

  const handleForceReposition = async () => {
    setLoading(true);
    try {
      await advancedMapGenerator.forceRepositioning();
      await loadStats();
      // Reload the page to show new layout
      window.location.reload();
    } catch (error) {
      console.error('Failed to reposition restaurants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (key: keyof typeof config, value: number) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    difficultyManager.updateConfig(newConfig);
  };

  const applyPreset = (presetName: string) => {
    difficultyManager.applyPreset(presetName);
    setConfig(difficultyManager.getConfig());
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded shadow-lg hover:bg-blue-700 z-50"
      >
        Map Settings
      </button>
    );
  }

  return (
    <div className="fixed top-4 right-4 bg-white border-2 border-gray-300 rounded-lg shadow-xl p-4 w-96 z-50 max-h-96 overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Map Difficulty Settings</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-500 hover:text-gray-700 text-xl"
        >
          ×
        </button>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="mb-4 p-3 bg-gray-50 rounded">
          <h4 className="font-semibold mb-2">Current Layout Stats</h4>
          <div className="text-sm space-y-1">
            <div>Total Restaurants: {stats.totalRestaurants}</div>
            <div>Repositioned: {stats.repositionedCount}</div>
            <div>Average Spacing: {stats.averageSpacing}px</div>
            <div>Min Spacing: {stats.minSpacing}px</div>
            <div>Max Spacing: {stats.maxSpacing}px</div>
            <div>Target Spacing: {stats.targetSpacing}px</div>
            <div className={stats.averageSpacing >= stats.targetSpacing ? 'text-green-600' : 'text-red-600'}>
              Status: {stats.averageSpacing >= stats.targetSpacing ? 'Optimal' : 'Needs repositioning'}
            </div>
          </div>
        </div>
      )}

      {/* Presets */}
      <div className="mb-4">
        <h4 className="font-semibold mb-2">Difficulty Presets</h4>
        <div className="grid grid-cols-2 gap-2">
          {['easy', 'normal', 'hard', 'expert'].map(preset => (
            <button
              key={preset}
              onClick={() => applyPreset(preset)}
              className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm capitalize"
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* Configuration */}
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">
            Travel Time Target: {config.travelTimeTarget}s
          </label>
          <input
            type="range"
            min="30"
            max="300"
            value={config.travelTimeTarget}
            onChange={(e) => handleConfigChange('travelTimeTarget', parseInt(e.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Min Distance: {config.minDistanceBetweenRestaurants}px
          </label>
          <input
            type="range"
            min="100"
            max="500"
            value={config.minDistanceBetweenRestaurants}
            onChange={(e) => handleConfigChange('minDistanceBetweenRestaurants', parseInt(e.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Reposition %: {Math.round(config.repositionPercentage * 100)}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={config.repositionPercentage * 100}
            onChange={(e) => handleConfigChange('repositionPercentage', parseInt(e.target.value) / 100)}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Player Speed: {config.playerSpeed}px/s
          </label>
          <input
            type="range"
            min="50"
            max="300"
            value={config.playerSpeed}
            onChange={(e) => handleConfigChange('playerSpeed', parseInt(e.target.value))}
            className="w-full"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 space-y-2">
        <button
          onClick={handleForceReposition}
          disabled={loading}
          className="w-full bg-orange-600 text-white py-2 px-4 rounded hover:bg-orange-700 disabled:opacity-50"
        >
          {loading ? 'Repositioning...' : 'Force Reposition Restaurants'}
        </button>
        
        <div className="text-xs text-gray-500 text-center">
          Note: Repositioning will reload the page to apply changes
        </div>
      </div>
    </div>
  );
};
