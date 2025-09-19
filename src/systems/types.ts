export interface MemoryShard {
  id: string;
  text: string;
  confidence: number; // 0..1
  sourceReferences: {
    type: 'order' | 'review' | 'menu_item' | 'restaurant';
    id: number;
  }[];
  tags: string[];
  discovered: boolean;
  discoveryDate?: Date;
}

export interface RestaurantAnalysis {
  restaurantId: number;
  topFlavors: { flavor: string; intensity: number; count: number }[];
  avgSentiment: number; // -1..1
  vegetarianPercentage: number;
  dessertPercentage: number;
  totalOrders: number;
  avgRating: number;
  customerRetention: number;
  priceRange: { min: number; max: number; avg: number };
}

export interface CustomerProfile {
  customerId: number;
  traits: {
    nightOwl: number;
    healthConscious: number;
    budgetSaver: number;
    spiceSeeker: number;
    socialDiner: number;
    loyalRegular: number;
  };
  favoriteCategories: string[];
  avgOrderValue: number;
  orderFrequency: number;
  preferredDeliveryTimes: number[]; // hours of day
}
