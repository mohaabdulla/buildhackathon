import React, { useState, useRef, useEffect } from 'react';
import { useGameStore } from '@/systems/identity';
import type { MemoryShard } from '@/systems/types';

interface DraggableShardProps {
  shard: MemoryShard;
  onDrag: (id: string, x: number, y: number) => void;
}

const DraggableShard: React.FC<DraggableShardProps> = ({ shard, onDrag }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const shardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize random position
    setPosition({
      x: Math.random() * 600 + 50,
      y: Math.random() * 400 + 50,
    });
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    const newX = e.clientX - 100; // Offset for center
    const newY = e.clientY - 50;
    
    setPosition({ x: newX, y: newY });
    onDrag(shard.id, newX, newY);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  return (
    <div
      ref={shardRef}
      className={`shard-card ${shard.discovered ? 'discovered' : ''}`}
      style={{
        left: position.x,
        top: position.y,
        transform: isDragging ? 'rotate(5deg) scale(1.05)' : 'rotate(0deg) scale(1)',
        zIndex: isDragging ? 1000 : 1,
      }}
      onMouseDown={handleMouseDown}
    >
      <h4>{shard.text}</h4>
      <div className="shard-tags">
        {shard.tags.map(tag => (
          <span key={tag} className="tag">
            {tag}
          </span>
        ))}
      </div>
      <div className="shard-confidence">
        Confidence: {Math.round(shard.confidence * 100)}%
      </div>
    </div>
  );
};

export const Corkboard: React.FC = () => {
  const { discoveredShards, availableShards } = useGameStore();
  const [shardPositions, setShardPositions] = useState<Record<string, { x: number; y: number }>>({});

  const handleShardDrag = (id: string, x: number, y: number) => {
    setShardPositions(prev => ({
      ...prev,
      [id]: { x, y },
    }));
  };

  const allShards = [...discoveredShards, ...availableShards.slice(0, 5)]; // Show max 5 undiscovered

  return (
    <div className="corkboard">
      <h2>Investigation Corkboard</h2>
      <p>Drag memory shards to organize your investigation</p>
      
      <div className="corkboard-area" style={{ position: 'relative', width: '100%', height: '500px' }}>
        {allShards.map(shard => (
          <DraggableShard
            key={shard.id}
            shard={shard}
            onDrag={handleShardDrag}
          />
        ))}
      </div>
      
      <div className="corkboard-stats">
        <p>Discovered: {discoveredShards.length}</p>
        <p>Available: {availableShards.length}</p>
      </div>
    </div>
  );
};
