import React, { useState } from 'react';
import { useGameStore } from '@/systems/identity';

type JournalTab = 'discoveries' | 'restaurants' | 'profiles' | 'timeline';

export const Journal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<JournalTab>('discoveries');
  const { discoveredShards, districts, progress } = useGameStore();

  const renderDiscoveries = () => (
    <div className="journal-section">
      <h3>Memory Shards Discovered</h3>
      {discoveredShards.length === 0 ? (
        <p>No memory shards discovered yet. Explore the city to find clues!</p>
      ) : (
        <div className="discoveries-list">
          {discoveredShards.map(shard => (
            <div key={shard.id} className="discovery-item">
              <h4>{shard.text}</h4>
              <p>Discovered: {shard.discoveryDate?.toLocaleDateString()}</p>
              <p>Confidence: {Math.round(shard.confidence * 100)}%</p>
              <div className="tags">
                {shard.tags.map(tag => (
                  <span key={tag} className="tag">{tag}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderRestaurants = () => (
    <div className="journal-section">
      <h3>Restaurant Database</h3>
      <p>Information about restaurants in each district.</p>
      {districts.map(district => (
        <div key={district.id} className="district-section">
          <h4>{district.name} {district.unlocked ? '🔓' : '🔒'}</h4>
          <p>Discovered Shards: {district.discoveredShards}/{district.totalShards}</p>
          <p>Mood Score: {district.moodScore > 0 ? '😊' : district.moodScore < 0 ? '😞' : '😐'}</p>
        </div>
      ))}
    </div>
  );

  const renderProfiles = () => (
    <div className="journal-section">
      <h3>Character Profiles</h3>
      <p>Profiles of people you've encountered during your investigation.</p>
      <div className="profiles-placeholder">
        <p>Character profiles will be populated as you discover more about the people in the food delivery network.</p>
      </div>
    </div>
  );

  const renderTimeline = () => (
    <div className="journal-section">
      <h3>Investigation Timeline</h3>
      <div className="timeline">
        <div className="timeline-item">
          <strong>Investigation Started</strong>
          <p>You began investigating the mysterious food amnesia affecting the city.</p>
        </div>
        {progress.completedPuzzles.map(puzzle => (
          <div key={puzzle} className="timeline-item">
            <strong>Puzzle Completed: {puzzle}</strong>
            <p>Successfully solved a mystery puzzle.</p>
          </div>
        ))}
        {progress.unlockedDistricts.map(district => (
          <div key={district} className="timeline-item">
            <strong>District Unlocked: {district}</strong>
            <p>Gained access to a new area of the city.</p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'discoveries': return renderDiscoveries();
      case 'restaurants': return renderRestaurants();
      case 'profiles': return renderProfiles();
      case 'timeline': return renderTimeline();
      default: return renderDiscoveries();
    }
  };

  return (
    <div className="journal">
      <div className="journal-header">
        <h2>Detective Journal</h2>
        <p>Your investigation notes and discoveries</p>
      </div>

      <div className="journal-tabs">
        {[
          { id: 'discoveries', label: 'Discoveries' },
          { id: 'restaurants', label: 'Restaurants' },
          { id: 'profiles', label: 'Profiles' },
          { id: 'timeline', label: 'Timeline' },
        ].map(tab => (
          <button
            key={tab.id}
            className={`journal-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id as JournalTab)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="journal-content">
        {renderTabContent()}
      </div>
    </div>
  );
};
