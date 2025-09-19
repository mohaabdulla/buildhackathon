import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { MemoryShard } from './types';

// Game state interfaces
export interface PlayerTraits {
  nightOwl: number;           // 0-100: Late night ordering patterns
  healthConscious: number;    // 0-100: Healthy food choices
  budgetSaver: number;        // 0-100: Low-cost ordering patterns
  spiceSeeker: number;        // 0-100: Spicy food preferences
  socialDiner: number;        // 0-100: Group ordering patterns
  loyalRegular: number;       // 0-100: Restaurant loyalty patterns
}

export interface District {
  id: string;
  name: string;
  unlocked: boolean;
  discoveredShards: number;
  totalShards: number;
  moodScore: number; // -1 to 1
}

export interface GameProgress {
  currentScene: string;
  completedPuzzles: string[];
  unlockedDistricts: string[];
  discoveredShards: MemoryShard[];
  totalPlayTime: number;
  lastSaveTime: Date;
}

export interface CameraState {
  x: number;
  y: number;
  zoom: number;
}

export interface GameState {
  // Player identity
  traits: PlayerTraits;
  
  // Player position and movement
  player: {
    x: number;
    y: number;
    isMoving: boolean;
    facing: 'up' | 'down' | 'left' | 'right';
    speed: number;
  };
  
  // World state
  districts: District[];
  progress: GameProgress;
  
  // UI state
  camera: CameraState;
  selectedPOI: number | null;
  isInventoryOpen: boolean;
  isCorkboardOpen: boolean;
  
  // Memory shards
  discoveredShards: MemoryShard[];
  availableShards: MemoryShard[];
  
  // Analytics
  analytics: {
    sessionsPlayed: number;
    totalPlayTime: number;
    shardsDiscovered: number;
    puzzlesCompleted: number;
    districtUnlocks: Array<{ district: string; timestamp: Date }>;
  };
}

export interface GameActions {
  // Player movement
  movePlayer: (x: number, y: number) => void;
  setPlayerPosition: (x: number, y: number) => void;
  setPlayerFacing: (direction: 'up' | 'down' | 'left' | 'right') => void;
  setPlayerMoving: (isMoving: boolean) => void;
  
  // Trait management
  applyShard: (shard: MemoryShard) => void;
  updateTraits: (deltas: Partial<PlayerTraits>) => void;
  
  // Progress management
  unlockDistrict: (districtId: string) => void;
  completepuzzle: (puzzleId: string) => void;
  discoverShard: (shard: MemoryShard) => void;
  
  // UI state
  setCamera: (camera: Partial<CameraState>) => void;
  selectPOI: (poiId: number | null) => void;
  toggleInventory: () => void;
  toggleCorkboard: () => void;
  
  // Save system
  saveGame: (slot: number) => Promise<void>;
  loadGame: (slot: number) => Promise<boolean>;
  getSaveSlots: () => Promise<SaveSlot[]>;
  
  // Analytics
  recordEvent: (event: string, data?: Record<string, any>) => void;
  
  // Reset
  resetGame: () => void;
}

export interface SaveSlot {
  slot: number;
  timestamp: Date;
  playtime: number;
  progress: number; // 0-100
  currentScene: string;
  traits: PlayerTraits;
}

// IndexedDB schema
interface GameDB extends DBSchema {
  saves: {
    key: number;
    value: {
      slot: number;
      timestamp: Date;
      data: GameState;
    };
  };
  analytics: {
    key: string;
    value: {
      event: string;
      timestamp: Date;
      data: Record<string, any>;
    };
  };
}

// Initial state
const initialTraits: PlayerTraits = {
  nightOwl: 0,
  healthConscious: 0,
  budgetSaver: 0,
  spiceSeeker: 0,
  socialDiner: 0,
  loyalRegular: 0,
};

const initialDistricts: District[] = [
  {
    id: 'downtown',
    name: 'Downtown',
    unlocked: true,
    discoveredShards: 0,
    totalShards: 15,
    moodScore: 0.2,
  },
  {
    id: 'chinatown',
    name: 'Chinatown',
    unlocked: false,
    discoveredShards: 0,
    totalShards: 12,
    moodScore: 0.5,
  },
  {
    id: 'little_india',
    name: 'Little India',
    unlocked: false,
    discoveredShards: 0,
    totalShards: 10,
    moodScore: 0.7,
  },
  {
    id: 'midtown',
    name: 'Midtown',
    unlocked: false,
    discoveredShards: 0,
    totalShards: 18,
    moodScore: -0.1,
  },
];

const initialState: GameState = {
  traits: initialTraits,
  player: {
    x: 300, // Start on main avenue
    y: 350, // Center of main commercial street
    isMoving: false,
    facing: 'down',
    speed: 120, // Slightly slower for the larger map
  },
  districts: initialDistricts,
  progress: {
    currentScene: 'Boot',
    completedPuzzles: [],
    unlockedDistricts: ['downtown'],
    discoveredShards: [],
    totalPlayTime: 0,
    lastSaveTime: new Date(),
  },
  camera: {
    x: 0,
    y: 0,
    zoom: 1,
  },
  selectedPOI: null,
  isInventoryOpen: false,
  isCorkboardOpen: false,
  discoveredShards: [],
  availableShards: [],
  analytics: {
    sessionsPlayed: 0,
    totalPlayTime: 0,
    shardsDiscovered: 0,
    puzzlesCompleted: 0,
    districtUnlocks: [],
  },
};

// IndexedDB helper
let dbPromise: Promise<IDBPDatabase<GameDB>> | null = null;

const getDB = (): Promise<IDBPDatabase<GameDB>> => {
  if (!dbPromise) {
    dbPromise = openDB<GameDB>('FoodDetectiveGame', 1, {
      upgrade(db) {
        db.createObjectStore('saves', { keyPath: 'slot' });
        db.createObjectStore('analytics', { keyPath: 'event' });
      },
    });
  }
  return dbPromise;
};

// Zustand store
export const useGameStore = create<GameState & GameActions>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    // Player movement actions
    movePlayer: (x: number, y: number) => {
      set((state) => ({
        player: {
          ...state.player,
          x,
          y,
        },
      }));
    },

    setPlayerPosition: (x: number, y: number) => {
      set((state) => ({
        player: {
          ...state.player,
          x,
          y,
          isMoving: false,
        },
      }));
    },

    setPlayerFacing: (direction: 'up' | 'down' | 'left' | 'right') => {
      set((state) => ({
        player: {
          ...state.player,
          facing: direction,
        },
      }));
    },

    setPlayerMoving: (isMoving: boolean) => {
      set((state) => ({
        player: {
          ...state.player,
          isMoving,
        },
      }));
    },

    // Trait management
    applyShard: (shard: MemoryShard) => {
      set((state) => {
        const newTraits = { ...state.traits };
        
        // Apply trait deltas based on shard tags
        shard.tags.forEach(tag => {
          const delta = Math.floor(shard.confidence * 10); // 0-10 points per shard
          
          switch (tag) {
            case 'night_owl':
              newTraits.nightOwl = Math.min(100, newTraits.nightOwl + delta);
              break;
            case 'health_conscious':
              newTraits.healthConscious = Math.min(100, newTraits.healthConscious + delta);
              break;
            case 'budget_saver':
              newTraits.budgetSaver = Math.min(100, newTraits.budgetSaver + delta);
              break;
            case 'spice_seeker':
              newTraits.spiceSeeker = Math.min(100, newTraits.spiceSeeker + delta);
              break;
            case 'social_diner':
              newTraits.socialDiner = Math.min(100, newTraits.socialDiner + delta);
              break;
            case 'loyal_regular':
              newTraits.loyalRegular = Math.min(100, newTraits.loyalRegular + delta);
              break;
          }
        });

        return {
          traits: newTraits,
          discoveredShards: [...state.discoveredShards, { ...shard, discovered: true, discoveryDate: new Date() }],
          analytics: {
            ...state.analytics,
            shardsDiscovered: state.analytics.shardsDiscovered + 1,
          },
        };
      });

      // Record analytics
      get().recordEvent('shard_discovered', {
        shardId: shard.id,
        confidence: shard.confidence,
        tags: shard.tags,
      });
    },

    updateTraits: (deltas: Partial<PlayerTraits>) => {
      set((state) => ({
        traits: {
          ...state.traits,
          ...Object.fromEntries(
            Object.entries(deltas).map(([key, value]) => [
              key,
              Math.max(0, Math.min(100, (state.traits as any)[key] + value)),
            ])
          ),
        },
      }));
    },

    // Progress management
    unlockDistrict: (districtId: string) => {
      set((state) => {
        const districts = state.districts.map(district =>
          district.id === districtId ? { ...district, unlocked: true } : district
        );

        const unlockEvent = { district: districtId, timestamp: new Date() };

        return {
          districts,
          progress: {
            ...state.progress,
            unlockedDistricts: [...state.progress.unlockedDistricts, districtId],
          },
          analytics: {
            ...state.analytics,
            districtUnlocks: [...state.analytics.districtUnlocks, unlockEvent],
          },
        };
      });

      get().recordEvent('district_unlocked', { districtId });
    },

    completepuzzle: (puzzleId: string) => {
      set((state) => ({
        progress: {
          ...state.progress,
          completedPuzzles: [...state.progress.completedPuzzles, puzzleId],
        },
        analytics: {
          ...state.analytics,
          puzzlesCompleted: state.analytics.puzzlesCompleted + 1,
        },
      }));

      get().recordEvent('puzzle_completed', { puzzleId });
    },

    discoverShard: (shard: MemoryShard) => {
      get().applyShard(shard);
    },

    // UI state
    setCamera: (camera: Partial<CameraState>) => {
      set((state) => ({
        camera: { ...state.camera, ...camera },
      }));
    },

    selectPOI: (poiId: number | null) => {
      set({ selectedPOI: poiId });
    },

    toggleInventory: () => {
      set((state) => ({ isInventoryOpen: !state.isInventoryOpen }));
    },

    toggleCorkboard: () => {
      set((state) => ({ isCorkboardOpen: !state.isCorkboardOpen }));
    },

    // Save system
    saveGame: async (slot: number) => {
      const state = get();
      const db = await getDB();
      
      await db.put('saves', {
        slot,
        timestamp: new Date(),
        data: {
          ...state,
          progress: {
            ...state.progress,
            lastSaveTime: new Date(),
          },
        },
      });

      get().recordEvent('game_saved', { slot });
    },

    loadGame: async (slot: number): Promise<boolean> => {
      try {
        const db = await getDB();
        const saveData = await db.get('saves', slot);
        
        if (saveData) {
          set(saveData.data);
          get().recordEvent('game_loaded', { slot });
          return true;
        }
        return false;
      } catch (error) {
        console.error('Failed to load game:', error);
        return false;
      }
    },

    getSaveSlots: async (): Promise<SaveSlot[]> => {
      try {
        const db = await getDB();
        const saves = await db.getAll('saves');
        
        return saves.map(save => ({
          slot: save.slot,
          timestamp: save.timestamp,
          playtime: save.data.analytics.totalPlayTime,
          progress: calculateProgress(save.data),
          currentScene: save.data.progress.currentScene,
          traits: save.data.traits,
        }));
      } catch (error) {
        console.error('Failed to get save slots:', error);
        return [];
      }
    },

    // Analytics
    recordEvent: async (event: string, data: Record<string, any> = {}) => {
      try {
        const db = await getDB();
        await db.add('analytics', {
          event: `${event}_${Date.now()}`,
          timestamp: new Date(),
          data: { event, ...data },
        });
      } catch (error) {
        console.error('Failed to record analytics event:', error);
      }
    },

    // Reset
    resetGame: () => {
      set(initialState);
    },
  }))
);

// Helper functions
function calculateProgress(state: GameState): number {
  const totalShards = state.districts.reduce((sum, district) => sum + district.totalShards, 0);
  const discoveredShards = state.discoveredShards.length;
  const unlockedDistricts = state.progress.unlockedDistricts.length;
  const totalDistricts = state.districts.length;
  const completedPuzzles = state.progress.completedPuzzles.length;
  const totalPuzzles = 20; // Estimated total puzzles

  const shardProgress = totalShards > 0 ? (discoveredShards / totalShards) * 0.5 : 0;
  const districtProgress = (unlockedDistricts / totalDistricts) * 0.3;
  const puzzleProgress = (completedPuzzles / totalPuzzles) * 0.2;

  return Math.floor((shardProgress + districtProgress + puzzleProgress) * 100);
}

// Selectors for common computed values
export const useTraitsSummary = () => {
  return useGameStore((state) => {
    const traits = state.traits;
    const sortedTraits = Object.entries(traits)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 2);
    
    return {
      primary: sortedTraits[0],
      secondary: sortedTraits[1],
      total: Object.values(traits).reduce((sum, value) => sum + value, 0),
    };
  });
};

export const useProgress = () => {
  return useGameStore((state) => calculateProgress(state));
};

export const useAvailableShards = () => {
  return useGameStore((state) => 
    state.availableShards.filter(shard => !shard.discovered)
  );
};

export const useUnlockedDistricts = () => {
  return useGameStore((state) => 
    state.districts.filter(district => district.unlocked)
  );
};
