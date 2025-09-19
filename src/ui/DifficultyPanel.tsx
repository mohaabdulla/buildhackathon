import React, { useState, useEffect } from 'react';
import { difficultyManager, DifficultyConfig } from '@/config/difficulty';
import { advancedMapGenerator } from '@/systems/advancedMapGeneration';

interface DifficultyPanelProps {
  onConfigChange?: (config: DifficultyConfig) => void;
  onRepositionRequest?: () => void;
}

export const DifficultyPanel: React.FC<DifficultyPanelProps> = ({
  onConfigChange,
  onRepositionRequest
}) => {
  const [config, setConfig] = useState<DifficultyConfig>(difficultyManager.getConfig());
  const [isOpen, setIsOpen] = useState(false);
  const [stats, setStats] = useState<{
    totalRestaurants: number;
    repositionedCount: number;
    averageSpacing: number;
    minSpacing: number;
    maxSpacing: number;
    targetSpacing: number;
  } | null>(null);
  const [isRepositioning, setIsRepositioning] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const repositioningStats = await advancedMapGenerator.getRepositioningStats();
      setStats(repositioningStats);
    } catch (error) {
      console.error('Failed to load repositioning stats:', error);
    }
  };

  const handleConfigUpdate = (updates: Partial<DifficultyConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    difficultyManager.updateConfig(updates);
    onConfigChange?.(newConfig);
  };

  const handlePresetChange = (presetName: string) => {
    difficultyManager.applyPreset(presetName);
    const newConfig = difficultyManager.getConfig();
    setConfig(newConfig);
    onConfigChange?.(newConfig);
  };

  const handleAutoTune = () => {
    difficultyManager.autoTuneDistance();
    const newConfig = difficultyManager.getConfig();
    setConfig(newConfig);
    onConfigChange?.(newConfig);
  };

  const handleForceReposition = async () => {
    setIsRepositioning(true);
    try {
      await advancedMapGenerator.forceRepositioning();
      await loadStats();
      onRepositionRequest?.();
    } catch (error) {
      console.error('Failed to reposition restaurants:', error);
    } finally {
      setIsRepositioning(false);
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg transition-colors"
        >
          ⚙️ Difficulty
        </button>
      </div>
    );
  }

  return (
    <div className="fixed top-4 right-4 z-50 bg-white rounded-lg shadow-xl border border-gray-200 w-80 max-h-96 overflow-y-auto">
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Difficulty Settings</h3>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {/* Current Stats */}
        {stats && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm">
            <h4 className="font-medium text-gray-700 mb-2">Current Map Stats</h4>
            <div className="space-y-1 text-gray-600">
              <div>Restaurants: {stats.totalRestaurants}</div>
              <div>Repositioned: {stats.repositionedCount}</div>
              <div>Avg Spacing: {stats.averageSpacing}px</div>
              <div>Range: {stats.minSpacing}px - {stats.maxSpacing}px</div>
              <div>Target: {stats.targetSpacing}px</div>
            </div>
          </div>
        )}

        {/* Presets */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Difficulty Presets
          </label>
          <div className="grid grid-cols-2 gap-2">
            {['easy', 'normal', 'hard', 'expert'].map(preset => (
              <button
                key={preset}
                onClick={() => handlePresetChange(preset)}
                className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md capitalize transition-colors"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Travel Time Target */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Travel Time Target: {config.travelTimeTarget}s
          </label>
          <input
            type="range"
            min="30"
            max="300"
            step="15"
            value={config.travelTimeTarget}
            onChange={(e) => handleConfigUpdate({ travelTimeTarget: parseInt(e.target.value) })}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>30s</span>
            <span>300s</span>
          </div>
        </div>

        {/* Minimum Distance */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Min Distance: {config.minDistanceBetweenRestaurants}px
          </label>
          <input
            type="range"
            min="50"
            max="400"
            step="25"
            value={config.minDistanceBetweenRestaurants}
            onChange={(e) => handleConfigUpdate({ minDistanceBetweenRestaurants: parseInt(e.target.value) })}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>50px</span>
            <span>400px</span>
          </div>
        </div>

        {/* Player Speed */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Player Speed: {config.playerSpeed}px/s
          </label>
          <input
            type="range"
            min="60"
            max="200"
            step="10"
            value={config.playerSpeed}
            onChange={(e) => handleConfigUpdate({ playerSpeed: parseInt(e.target.value) })}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>60px/s</span>
            <span>200px/s</span>
          </div>
        </div>

        {/* Reposition Percentage */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reposition: {Math.round(config.repositionPercentage * 100)}%
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={config.repositionPercentage}
            onChange={(e) => handleConfigUpdate({ repositionPercentage: parseFloat(e.target.value) })}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            onClick={handleAutoTune}
            className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors text-sm"
          >
            Auto-Tune Distance
          </button>
          
          <button
            onClick={handleForceReposition}
            disabled={isRepositioning}
            className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white rounded-md transition-colors text-sm"
          >
            {isRepositioning ? 'Repositioning...' : 'Force Reposition'}
          </button>
        </div>

        <div className="mt-4 text-xs text-gray-500">
          <p>💡 Higher travel time = more challenging gameplay</p>
          <p>🎯 Auto-tune calculates distance from travel time</p>
          <p>🔄 Force reposition regenerates the entire map</p>
        </div>
      </div>
    </div>
  );
};
