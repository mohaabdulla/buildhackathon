import { TaggingEngine } from '@/systems/tagging';
import type { MemoryShard } from '@/systems/types';

// Worker message types
export interface TaggingWorkerRequest {
  type: 'ANALYZE_DATA';
  payload: {
    restaurants: any[];
    orders: any[];
    reviews: any[];
    users: any[];
    orderItems: any[];
    menuItems: any[];
  };
}

export interface TaggingWorkerResponse {
  type: 'ANALYSIS_COMPLETE' | 'ANALYSIS_ERROR';
  payload: {
    shards?: MemoryShard[];
    error?: string;
  };
}

const taggingEngine = new TaggingEngine();

self.onmessage = function(event: MessageEvent<TaggingWorkerRequest>) {
  const { type, payload } = event.data;

  switch (type) {
    case 'ANALYZE_DATA':
      try {
        console.log('Worker: Starting data analysis...');
        
        const { restaurants, orders, reviews, users, orderItems, menuItems } = payload;
        
        // Generate memory shards
        const shards = taggingEngine.generateMemoryShards(
          restaurants,
          orders,
          reviews,
          users,
          orderItems,
          menuItems
        );

        console.log(`Worker: Generated ${shards.length} memory shards`);

        const response: TaggingWorkerResponse = {
          type: 'ANALYSIS_COMPLETE',
          payload: { shards },
        };

        self.postMessage(response);
      } catch (error) {
        console.error('Worker: Analysis failed:', error);
        
        const response: TaggingWorkerResponse = {
          type: 'ANALYSIS_ERROR',
          payload: { 
            error: error instanceof Error ? error.message : 'Unknown error' 
          },
        };

        self.postMessage(response);
      }
      break;

    default:
      console.warn('Worker: Unknown message type:', type);
  }
};

// Handle worker errors
self.onerror = function(error) {
  console.error('Worker error:', error);
  
  const response: TaggingWorkerResponse = {
    type: 'ANALYSIS_ERROR',
    payload: { error: 'Worker execution error' },
  };

  self.postMessage(response);
};

export default null; // Export to satisfy TypeScript
