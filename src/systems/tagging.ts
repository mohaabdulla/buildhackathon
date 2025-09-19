import type {
  Restaurant,
  MenuItem,
  Order,
  Review,
  OrderItem,
  User,
  ReviewWithSentiment,
  MenuItemWithTags,
  RestaurantWithStats,
} from '@/data/schemas';
import type { MemoryShard, RestaurantAnalysis, CustomerProfile } from './types';
import lexicon from '@/data/lexicon.json';

export class TaggingEngine {
  private lexicon = lexicon;

  // Sentiment analysis with simple keyword matching
  analyzeSentiment(text: string, rating: number): number {
    const normalizedText = text.toLowerCase();
    let sentiment = (rating - 3) / 2; // Convert 1-5 to -1..1 base
    
    // Positive sentiment modifiers
    for (const word of this.lexicon.sentiment.positive.strong) {
      if (normalizedText.includes(word)) sentiment += 0.3;
    }
    for (const word of this.lexicon.sentiment.positive.medium) {
      if (normalizedText.includes(word)) sentiment += 0.2;
    }
    for (const word of this.lexicon.sentiment.positive.mild) {
      if (normalizedText.includes(word)) sentiment += 0.1;
    }

    // Negative sentiment modifiers
    for (const word of this.lexicon.sentiment.negative.strong) {
      if (normalizedText.includes(word)) sentiment -= 0.3;
    }
    for (const word of this.lexicon.sentiment.negative.medium) {
      if (normalizedText.includes(word)) sentiment -= 0.2;
    }
    for (const word of this.lexicon.sentiment.negative.mild) {
      if (normalizedText.includes(word)) sentiment -= 0.1;
    }

    // Amplifiers and diminishers
    for (const amplifier of this.lexicon.sentiment.modifiers.amplifiers) {
      if (normalizedText.includes(amplifier)) {
        sentiment *= 1.2;
      }
    }

    // Exclamation marks
    const exclamationCount = (text.match(/!/g) || []).length;
    if (exclamationCount > 0) {
      sentiment += exclamationCount * 0.1;
    }

    return Math.max(-1, Math.min(1, sentiment));
  }

  // Extract flavors from text
  extractFlavors(text: string): { flavor: string; intensity: number }[] {
    const normalizedText = text.toLowerCase();
    const flavors: { flavor: string; intensity: number }[] = [];

    Object.entries(this.lexicon.flavors).forEach(([flavorName, flavorData]) => {
      let intensity = 0;
      let hasKeyword = false;

      // Check for basic keywords
      for (const keyword of flavorData.keywords) {
        if (normalizedText.includes(keyword)) {
          hasKeyword = true;
          intensity = Math.max(intensity, 0.5);
        }
      }

      if (hasKeyword) {
        // Check intensity levels
        Object.entries(flavorData.intensity).forEach(([level, keywords]) => {
          for (const keyword of keywords) {
            if (normalizedText.includes(keyword)) {
              switch (level) {
                case 'mild': intensity = Math.max(intensity, 0.3); break;
                case 'medium': intensity = Math.max(intensity, 0.6); break;
                case 'high': intensity = Math.max(intensity, 0.8); break;
                case 'extreme': intensity = Math.max(intensity, 1.0); break;
              }
            }
          }
        });

        flavors.push({ flavor: flavorName, intensity });
      }
    });

    return flavors;
  }

  // Analyze restaurant aggregates
  analyzeRestaurant(
    restaurant: Restaurant,
    menuItems: MenuItemWithTags[],
    orders: Order[],
    reviews: ReviewWithSentiment[]
  ): RestaurantAnalysis {
    // Flavor analysis from menu items
    const flavorCounts = new Map<string, { intensity: number; count: number }>();
    
    menuItems.forEach(item => {
      const flavors = this.extractFlavors(`${item.name} ${item.description || ''}`);
      flavors.forEach(({ flavor, intensity }) => {
        const current = flavorCounts.get(flavor) || { intensity: 0, count: 0 };
        flavorCounts.set(flavor, {
          intensity: (current.intensity * current.count + intensity) / (current.count + 1),
          count: current.count + 1,
        });
      });
    });

    const topFlavors = Array.from(flavorCounts.entries())
      .map(([flavor, data]) => ({ flavor, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Sentiment analysis
    const avgSentiment = reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.sentiment, 0) / reviews.length
      : 0;

    // Dietary analysis
    const vegetarianCount = menuItems.filter(item => item.isVegetarian).length;
    const vegetarianPercentage = menuItems.length > 0 ? vegetarianCount / menuItems.length : 0;

    const dessertCount = menuItems.filter(item => item.isDessert).length;
    const dessertPercentage = menuItems.length > 0 ? dessertCount / menuItems.length : 0;

    // Price analysis
    const prices = menuItems.map(item => item.price);
    const priceRange = {
      min: Math.min(...prices),
      max: Math.max(...prices),
      avg: prices.reduce((sum, price) => sum + price, 0) / prices.length,
    };

    // Rating analysis
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : restaurant.rating || 0;

    return {
      restaurantId: restaurant.restaurant_id,
      topFlavors,
      avgSentiment,
      vegetarianPercentage,
      dessertPercentage,
      totalOrders: orders.length,
      avgRating,
      customerRetention: this.calculateCustomerRetention(orders),
      priceRange,
    };
  }

  // Generate memory shards from cross-table analysis
  generateMemoryShards(
    restaurants: RestaurantWithStats[],
    orders: Order[],
    reviews: ReviewWithSentiment[],
    users: User[],
    orderItems: OrderItem[],
    menuItems: MenuItemWithTags[]
  ): MemoryShard[] {
    const shards: MemoryShard[] = [];

    // Sweet Tooth pattern
    shards.push(...this.findSweetToothPattern(orders, orderItems, menuItems));

    // Driver's Friend pattern
    shards.push(...this.findDriverFriendPattern(orders, users));

    // Spice Seeker pattern
    shards.push(...this.findSpiceSeekerPattern(orders, orderItems, menuItems, reviews));

    // Night Owl pattern
    shards.push(...this.findNightOwlPattern(orders, users));

    // Loyal Regular pattern
    shards.push(...this.findLoyalRegularPattern(orders, users, restaurants));

    // Budget Saver pattern
    shards.push(...this.findBudgetSaverPattern(orders, users));

    // Health Conscious pattern
    shards.push(...this.findHealthConsciousPattern(orders, orderItems, menuItems, users));

    return shards.filter(shard => shard.confidence >= 0.3); // Only return confident shards
  }

  private findSweetToothPattern(
    orders: Order[],
    orderItems: OrderItem[],
    menuItems: MenuItemWithTags[]
  ): MemoryShard[] {
    const shards: MemoryShard[] = [];
    const customerDessertCounts = new Map<number, number>();
    const customerOrderCounts = new Map<number, number>();

    // Count dessert orders per customer
    orders.forEach(order => {
      const orderItemsList = orderItems.filter(item => item.order_id === order.order_id);
      const dessertCount = orderItemsList.filter(item => {
        const menuItem = menuItems.find(mi => mi.item_id === item.item_id);
        return menuItem?.isDessert || menuItem?.sweetness > 3;
      }).length;

      customerDessertCounts.set(
        order.customer_id,
        (customerDessertCounts.get(order.customer_id) || 0) + dessertCount
      );
      customerOrderCounts.set(
        order.customer_id,
        (customerOrderCounts.get(order.customer_id) || 0) + 1
      );
    });

    // Generate shards for customers with high dessert ratios
    customerDessertCounts.forEach((dessertCount, customerId) => {
      const totalOrders = customerOrderCounts.get(customerId) || 1;
      const dessertRatio = dessertCount / totalOrders;

      if (dessertRatio >= 0.5 && dessertCount >= 3) {
        const confidence = Math.min(0.9, dessertRatio + (dessertCount - 3) * 0.1);
        
        shards.push({
          id: `sweet_tooth_${customerId}`,
          text: `Customer consistently orders desserts and sweet items - clear sweet tooth detected`,
          confidence,
          sourceReferences: orders
            .filter(o => o.customer_id === customerId)
            .map(o => ({ type: 'order' as const, id: o.order_id })),
          tags: ['sweet_tooth', 'dessert_lover', 'pattern'],
          discovered: false,
        });
      }
    });

    return shards;
  }

  private findDriverFriendPattern(orders: Order[], users: User[]): MemoryShard[] {
    const shards: MemoryShard[] = [];
    const driverCustomerPairs = new Map<string, number>();

    // Count deliveries between driver-customer pairs
    orders.forEach(order => {
      if (order.driver_id) {
        const key = `${order.driver_id}_${order.customer_id}`;
        driverCustomerPairs.set(key, (driverCustomerPairs.get(key) || 0) + 1);
      }
    });

    // Generate shards for frequent driver-customer relationships
    driverCustomerPairs.forEach((count, key) => {
      if (count >= 2) {
        const [driverId, customerId] = key.split('_').map(Number);
        const driver = users.find(u => u.user_id === driverId);
        const customer = users.find(u => u.user_id === customerId);

        if (driver && customer) {
          const confidence = Math.min(0.8, 0.4 + count * 0.1);
          
          shards.push({
            id: `driver_friend_${key}`,
            text: `${driver.name} has delivered to ${customer.name} multiple times - possible friendship or preferred driver relationship`,
            confidence,
            sourceReferences: orders
              .filter(o => o.driver_id === driverId && o.customer_id === customerId)
              .map(o => ({ type: 'order' as const, id: o.order_id })),
            tags: ['driver_relationship', 'loyalty', 'pattern'],
            discovered: false,
          });
        }
      }
    });

    return shards;
  }

  private findSpiceSeekerPattern(
    orders: Order[],
    orderItems: OrderItem[],
    menuItems: MenuItemWithTags[],
    reviews: ReviewWithSentiment[]
  ): MemoryShard[] {
    const shards: MemoryShard[] = [];
    const customerSpiceData = new Map<number, { spiceCount: number; totalItems: number; positiveSpiceReviews: number }>();

    // Analyze spicy orders
    orders.forEach(order => {
      const orderItemsList = orderItems.filter(item => item.order_id === order.order_id);
      let spiceCount = 0;

      orderItemsList.forEach(item => {
        const menuItem = menuItems.find(mi => mi.item_id === item.item_id);
        if (menuItem?.spiciness >= 3) spiceCount++;
      });

      const current = customerSpiceData.get(order.customer_id) || { spiceCount: 0, totalItems: 0, positiveSpiceReviews: 0 };
      customerSpiceData.set(order.customer_id, {
        spiceCount: current.spiceCount + spiceCount,
        totalItems: current.totalItems + orderItemsList.length,
        positiveSpiceReviews: current.positiveSpiceReviews,
      });
    });

    // Add positive spice reviews
    reviews.forEach(review => {
      if (review.sentiment > 0 && review.comment && review.comment.toLowerCase().includes('spic')) {
        const current = customerSpiceData.get(review.customer_id);
        if (current) {
          current.positiveSpiceReviews++;
        }
      }
    });

    // Generate spice seeker shards
    customerSpiceData.forEach((data, customerId) => {
      const spiceRatio = data.spiceCount / data.totalItems;
      if (spiceRatio >= 0.4 && data.spiceCount >= 2) {
        const confidence = Math.min(0.9, spiceRatio + data.positiveSpiceReviews * 0.1);
        
        shards.push({
          id: `spice_seeker_${customerId}`,
          text: `Customer consistently orders spicy dishes and enjoys heat - confirmed spice seeker`,
          confidence,
          sourceReferences: orders
            .filter(o => o.customer_id === customerId)
            .map(o => ({ type: 'order' as const, id: o.order_id })),
          tags: ['spice_seeker', 'spicy_food', 'pattern'],
          discovered: false,
        });
      }
    });

    return shards;
  }

  private findNightOwlPattern(orders: Order[], users: User[]): MemoryShard[] {
    const shards: MemoryShard[] = [];
    const customerNightOrders = new Map<number, { nightOrders: number; totalOrders: number }>();

    orders.forEach(order => {
      const orderTime = new Date(order.order_date);
      const hour = orderTime.getHours();
      const isNightOrder = hour >= 22 || hour <= 5; // 10 PM to 5 AM

      const current = customerNightOrders.get(order.customer_id) || { nightOrders: 0, totalOrders: 0 };
      customerNightOrders.set(order.customer_id, {
        nightOrders: current.nightOrders + (isNightOrder ? 1 : 0),
        totalOrders: current.totalOrders + 1,
      });
    });

    customerNightOrders.forEach((data, customerId) => {
      const nightRatio = data.nightOrders / data.totalOrders;
      if (nightRatio >= 0.6 && data.nightOrders >= 2) {
        const customer = users.find(u => u.user_id === customerId);
        const confidence = Math.min(0.8, nightRatio + (data.nightOrders - 2) * 0.05);
        
        shards.push({
          id: `night_owl_${customerId}`,
          text: `${customer?.name || 'Customer'} frequently orders late at night - classic night owl behavior`,
          confidence,
          sourceReferences: orders
            .filter(o => o.customer_id === customerId)
            .map(o => ({ type: 'order' as const, id: o.order_id })),
          tags: ['night_owl', 'late_night', 'pattern'],
          discovered: false,
        });
      }
    });

    return shards;
  }

  private findLoyalRegularPattern(orders: Order[], users: User[], restaurants: RestaurantWithStats[]): MemoryShard[] {
    const shards: MemoryShard[] = [];
    const customerRestaurantCounts = new Map<string, number>();

    orders.forEach(order => {
      const key = `${order.customer_id}_${order.restaurant_id}`;
      customerRestaurantCounts.set(key, (customerRestaurantCounts.get(key) || 0) + 1);
    });

    customerRestaurantCounts.forEach((count, key) => {
      if (count >= 3) {
        const [customerId, restaurantId] = key.split('_').map(Number);
        const customer = users.find(u => u.user_id === customerId);
        const restaurant = restaurants.find(r => r.restaurant_id === restaurantId);

        if (customer && restaurant) {
          const confidence = Math.min(0.9, 0.5 + count * 0.1);
          
          shards.push({
            id: `loyal_regular_${key}`,
            text: `${customer.name} is a loyal regular at ${restaurant.name} - strong restaurant loyalty detected`,
            confidence,
            sourceReferences: orders
              .filter(o => o.customer_id === customerId && o.restaurant_id === restaurantId)
              .map(o => ({ type: 'order' as const, id: o.order_id })),
            tags: ['loyal_regular', 'restaurant_loyalty', 'pattern'],
            discovered: false,
          });
        }
      }
    });

    return shards;
  }

  private findBudgetSaverPattern(orders: Order[], users: User[]): MemoryShard[] {
    const shards: MemoryShard[] = [];
    const customerSpending = new Map<number, { total: number; count: number }>();

    orders.forEach(order => {
      const current = customerSpending.get(order.customer_id) || { total: 0, count: 0 };
      customerSpending.set(order.customer_id, {
        total: current.total + order.total_amount,
        count: current.count + 1,
      });
    });

    const avgOrderValues = Array.from(customerSpending.entries()).map(([customerId, data]) => ({
      customerId,
      avgOrderValue: data.total / data.count,
      orderCount: data.count,
    }));

    const overallAvg = avgOrderValues.reduce((sum, item) => sum + item.avgOrderValue, 0) / avgOrderValues.length;

    avgOrderValues.forEach(({ customerId, avgOrderValue, orderCount }) => {
      if (avgOrderValue <= overallAvg * 0.7 && orderCount >= 3) {
        const customer = users.find(u => u.user_id === customerId);
        const confidence = Math.min(0.8, 0.4 + (1 - avgOrderValue / overallAvg) * 0.4);
        
        shards.push({
          id: `budget_saver_${customerId}`,
          text: `${customer?.name || 'Customer'} consistently places low-value orders - budget-conscious behavior detected`,
          confidence,
          sourceReferences: orders
            .filter(o => o.customer_id === customerId)
            .map(o => ({ type: 'order' as const, id: o.order_id })),
          tags: ['budget_saver', 'low_spending', 'pattern'],
          discovered: false,
        });
      }
    });

    return shards;
  }

  private findHealthConsciousPattern(
    orders: Order[],
    orderItems: OrderItem[],
    menuItems: MenuItemWithTags[],
    users: User[]
  ): MemoryShard[] {
    const shards: MemoryShard[] = [];
    const customerHealthyChoices = new Map<number, { healthyItems: number; totalItems: number }>();

    orders.forEach(order => {
      const orderItemsList = orderItems.filter(item => item.order_id === order.order_id);
      let healthyCount = 0;

      orderItemsList.forEach(item => {
        const menuItem = menuItems.find(mi => mi.item_id === item.item_id);
        if (menuItem?.isVegetarian || 
            menuItem?.dietary_flags?.includes('healthy') ||
            menuItem?.category.toLowerCase().includes('salad') ||
            menuItem?.name.toLowerCase().includes('grilled')) {
          healthyCount++;
        }
      });

      const current = customerHealthyChoices.get(order.customer_id) || { healthyItems: 0, totalItems: 0 };
      customerHealthyChoices.set(order.customer_id, {
        healthyItems: current.healthyItems + healthyCount,
        totalItems: current.totalItems + orderItemsList.length,
      });
    });

    customerHealthyChoices.forEach((data, customerId) => {
      const healthyRatio = data.healthyItems / data.totalItems;
      if (healthyRatio >= 0.6 && data.healthyItems >= 3) {
        const customer = users.find(u => u.user_id === customerId);
        const confidence = Math.min(0.8, healthyRatio + (data.healthyItems - 3) * 0.05);
        
        shards.push({
          id: `health_conscious_${customerId}`,
          text: `${customer?.name || 'Customer'} consistently chooses healthy options - health-conscious eater`,
          confidence,
          sourceReferences: orders
            .filter(o => o.customer_id === customerId)
            .map(o => ({ type: 'order' as const, id: o.order_id })),
          tags: ['health_conscious', 'healthy_eating', 'pattern'],
          discovered: false,
        });
      }
    });

    return shards;
  }

  private calculateCustomerRetention(orders: Order[]): number {
    const customerCounts = new Map<number, number>();
    orders.forEach(order => {
      customerCounts.set(order.customer_id, (customerCounts.get(order.customer_id) || 0) + 1);
    });

    const repeatCustomers = Array.from(customerCounts.values()).filter(count => count > 1).length;
    const totalCustomers = customerCounts.size;

    return totalCustomers > 0 ? repeatCustomers / totalCustomers : 0;
  }
}
