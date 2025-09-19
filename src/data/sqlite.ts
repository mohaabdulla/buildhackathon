// Import types only, not the runtime module
import type { Database, Statement } from 'sql.js';
import { loadSqlJs } from './sqlLoader';
import type {
  User,
  Restaurant,
  MenuItem,
  Order,
  OrderItem,
  Review,
  RestaurantWithStats,
  MenuItemWithTags,
  OrderWithDetails,
} from './schemas';
import {
  UserSchema,
  RestaurantSchema,
  MenuItemSchema,
  OrderSchema,
  OrderItemSchema,
  ReviewSchema,
} from './schemas';

class SQLiteManager {
  private db: Database | null = null;
  private cache = new Map<string, any>();
  private statements = new Map<string, Statement>();

  async initialize(dbPath: string = '/assets/fooddelivery.db'): Promise<void> {
    try {
      console.log('Attempting to load sql.js...');
      
      // Use the sql.js loader
      const initSqlJs = await loadSqlJs();
      
      console.log('sql.js loaded successfully, initializing...');
      
      // Initialize sql.js
      const SQL = await initSqlJs({
        locateFile: (file: string) => {
          if (file === 'sql-wasm.wasm') {
            return `/sql-wasm.wasm`;
          }
          return `https://sql.js.org/dist/${file}`;
        },
      });

      // Fetch the database file with cache busting
      const cacheBuster = Date.now();
      const response = await fetch(`${dbPath}?v=${cacheBuster}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch database: ${response.statusText}`);
      }

      const dbBuffer = await response.arrayBuffer();
      this.db = new SQL.Database(new Uint8Array(dbBuffer));

      // Prepare common statements
      this.prepareStatements();
    } catch (error) {
      console.error('Failed to initialize SQLite database:', error);
      throw error;
    }
  }

  private prepareStatements(): void {
    if (!this.db) throw new Error('Database not initialized');

    // Create placement override table if it doesn't exist
    this.db.run(`
      CREATE TABLE IF NOT EXISTS RESTAURANT_PLACEMENTS (
        restaurant_id INTEGER PRIMARY KEY,
        x REAL NOT NULL,
        y REAL NOT NULL,
        district TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const queries = {
      getRestaurants: `
        SELECT 
          r.id as restaurant_id, 
          r.*,
          rp.x as override_x,
          rp.y as override_y,
          COALESCE(rp.district, r.city) as district
        FROM restaurants r
        LEFT JOIN RESTAURANT_PLACEMENTS rp ON r.id = rp.restaurant_id
        WHERE r.is_active = 1
      `,
      getRestaurantById: `
        SELECT 
          r.id as restaurant_id, 
          r.*,
          COALESCE(rp.x, NULL) as override_x,
          COALESCE(rp.y, NULL) as override_y,
          COALESCE(rp.district, r.city) as district
        FROM restaurants r
        LEFT JOIN RESTAURANT_PLACEMENTS rp ON r.id = rp.restaurant_id
        WHERE r.id = ?
      `,
      getMenuItemsByRestaurant: `
        SELECT id as item_id, restaurant_id, name, description, price, category, 
               CASE WHEN is_available = 1 THEN 'true' ELSE 'false' END as is_available
        FROM menu_items 
        WHERE restaurant_id = ? AND is_available = 1 
        ORDER BY category, name
      `,
      getUsersByRole: 'SELECT * FROM users WHERE role = ? ORDER BY first_name, last_name',
      getUserById: 'SELECT * FROM users WHERE id = ?',
      getOrdersByCustomer: `
        SELECT * FROM orders 
        WHERE customer_id = ? 
        ORDER BY created_at DESC
      `,
      getOrderItems: `
        SELECT oi.*, mi.name as item_name, mi.price as item_price
        FROM order_items oi
        JOIN menu_items mi ON oi.menu_item_id = mi.id
        WHERE oi.order_id = ?
      `,
      getReviewsByRestaurant: `
        SELECT r.*, u.first_name || ' ' || u.last_name as customer_name
        FROM reviews r
        JOIN users u ON r.customer_id = u.id
        WHERE r.restaurant_id = ?
        ORDER BY r.created_at DESC
      `,
      getRestaurantStats: `
        SELECT 
          r.id as restaurant_id,
          COUNT(DISTINCT o.id) as total_orders,
          AVG(rev.rating) as avg_rating,
          COUNT(DISTINCT rev.id) as review_count
        FROM restaurants r
        LEFT JOIN orders o ON r.id = o.restaurant_id
        LEFT JOIN reviews rev ON r.id = rev.restaurant_id
        WHERE r.id = ?
        GROUP BY r.id
      `,
    };

    Object.entries(queries).forEach(([key, sql]) => {
      this.statements.set(key, this.db!.prepare(sql));
    });
  }

  private getCached<T>(key: string): T | null {
    return this.cache.get(key) || null;
  }

  private setCache<T>(key: string, value: T): void {
    this.cache.set(key, value);
  }

  // Restaurant DAOs
  async getRestaurants(): Promise<Restaurant[]> {
    const cacheKey = 'restaurants:all';
    let cached = this.getCached<Restaurant[]>(cacheKey);
    
    if (cached) return cached;

    const stmt = this.statements.get('getRestaurants');
    if (!stmt) throw new Error('Statement not prepared');

    const results: Restaurant[] = [];
    stmt.bind();
    
    while (stmt.step()) {
      const row = stmt.getAsObject();
      const restaurant = RestaurantSchema.parse({
        ...row,
        coordinates: row.latitude && row.longitude ? {
          lat: row.latitude,
          lng: row.longitude,
        } : undefined,
      });
      results.push(restaurant);
    }

    stmt.reset();
    this.setCache(cacheKey, results);
    return results;
  }

  async getRestaurantById(id: number): Promise<Restaurant | null> {
    const cacheKey = `restaurant:${id}`;
    let cached = this.getCached<Restaurant>(cacheKey);
    
    if (cached) return cached;

    const stmt = this.statements.get('getRestaurantById');
    if (!stmt) throw new Error('Statement not prepared');

    stmt.bind([id]);
    
    if (stmt.step()) {
      const row = stmt.getAsObject();
      const restaurant = RestaurantSchema.parse({
        ...row,
        coordinates: row.latitude && row.longitude ? {
          lat: row.latitude,
          lng: row.longitude,
        } : undefined,
      });
      stmt.reset();
      this.setCache(cacheKey, restaurant);
      return restaurant;
    }

    stmt.reset();
    return null;
  }

  async getMenuItemsByRestaurant(restaurantId: number): Promise<MenuItemWithTags[]> {
    const cacheKey = `menu:restaurant:${restaurantId}`;
    let cached = this.getCached<MenuItemWithTags[]>(cacheKey);
    
    if (cached) return cached;

    const stmt = this.statements.get('getMenuItemsByRestaurant');
    if (!stmt) throw new Error('Statement not prepared');

    const results: MenuItemWithTags[] = [];
    stmt.bind([restaurantId]);
    
    while (stmt.step()) {
      const row = stmt.getAsObject();
      
      // Convert is_available string back to boolean for parsing
      const processedRow = { ...row };
      if (typeof processedRow.is_available === 'string') {
        (processedRow as any).is_available = processedRow.is_available === 'true';
      }
      
      const menuItem = MenuItemSchema.parse(processedRow);
      
      // Add flavor tags and analysis
      const enhanced: MenuItemWithTags = {
        ...menuItem,
        flavors: this.extractFlavors(menuItem.name, menuItem.description),
        spiciness: this.calculateSpiciness(menuItem.name, menuItem.description),
        sweetness: this.calculateSweetness(menuItem.name, menuItem.description),
        isVegetarian: this.isVegetarian(menuItem.name, menuItem.description),
        isDessert: this.isDessert(menuItem.category, menuItem.name),
      };
      
      results.push(enhanced);
    }

    stmt.reset();
    this.setCache(cacheKey, results);
    return results;
  }

  // User DAOs
  async getUsersByRole(role: 'customer' | 'driver' | 'restaurant_owner'): Promise<User[]> {
    const cacheKey = `users:role:${role}`;
    let cached = this.getCached<User[]>(cacheKey);
    
    if (cached) return cached;

    const stmt = this.statements.get('getUsersByRole');
    if (!stmt) throw new Error('Statement not prepared');

    const results: User[] = [];
    stmt.bind([role]);
    
    while (stmt.step()) {
      const row = stmt.getAsObject();
      const user = UserSchema.parse(row);
      results.push(user);
    }

    stmt.reset();
    this.setCache(cacheKey, results);
    return results;
  }

  // Order DAOs
  async getOrdersByCustomer(customerId: number): Promise<OrderWithDetails[]> {
    const cacheKey = `orders:customer:${customerId}`;
    let cached = this.getCached<OrderWithDetails[]>(cacheKey);
    
    if (cached) return cached;

    const stmt = this.statements.get('getOrdersByCustomer');
    if (!stmt) throw new Error('Statement not prepared');

    const results: OrderWithDetails[] = [];
    stmt.bind([customerId]);
    
    while (stmt.step()) {
      const row = stmt.getAsObject();
      const order = OrderSchema.parse(row);
      
      // Get additional details
      const customer = await this.getUserById(order.customer_id);
      const restaurant = await this.getRestaurantById(order.restaurant_id);
      const driver = order.driver_id ? await this.getUserById(order.driver_id) : null;
      const items = await this.getOrderItems(order.order_id);
      
      const enhanced: OrderWithDetails = {
        ...order,
        customerName: customer?.name || 'Unknown',
        restaurantName: restaurant?.name || 'Unknown',
        driverName: driver?.name,
        items,
      };
      
      results.push(enhanced);
    }

    stmt.reset();
    this.setCache(cacheKey, results);
    return results;
  }

  async getOrderItems(orderId: number): Promise<(OrderItem & { itemName: string; itemPrice: number })[]> {
    const stmt = this.statements.get('getOrderItems');
    if (!stmt) throw new Error('Statement not prepared');

    const results: (OrderItem & { itemName: string; itemPrice: number })[] = [];
    stmt.bind([orderId]);
    
    while (stmt.step()) {
      const row = stmt.getAsObject();
      const orderItem = OrderItemSchema.parse({
        order_item_id: row.order_item_id,
        order_id: row.order_id,
        item_id: row.item_id,
        quantity: row.quantity,
        item_price: row.item_price,
        special_instructions: row.special_instructions,
      });
      
      results.push({
        ...orderItem,
        itemName: row.item_name as string,
        itemPrice: row.item_price as number,
      });
    }

    stmt.reset();
    return results;
  }

  // Review DAOs
  async getReviewsByRestaurant(restaurantId: number): Promise<Review[]> {
    const cacheKey = `reviews:restaurant:${restaurantId}`;
    let cached = this.getCached<Review[]>(cacheKey);
    
    if (cached) return cached;

    const stmt = this.statements.get('getReviewsByRestaurant');
    if (!stmt) throw new Error('Statement not prepared');

    const results: Review[] = [];
    stmt.bind([restaurantId]);
    
    while (stmt.step()) {
      const row = stmt.getAsObject();
      const review = ReviewSchema.parse({
        review_id: row.review_id,
        order_id: row.order_id,
        customer_id: row.customer_id,
        restaurant_id: row.restaurant_id,
        rating: row.rating,
        comment: row.comment,
        review_date: row.review_date,
        helpful_count: row.helpful_count || 0,
      });
      results.push(review);
    }

    stmt.reset();
    this.setCache(cacheKey, results);
    return results;
  }

  // Helper methods
  private async getUserById(id: number): Promise<User | null> {
    const stmt = this.statements.get('getUserById');
    if (!stmt) throw new Error('Statement not prepared');

    stmt.bind([id]);
    
    if (stmt.step()) {
      const row = stmt.getAsObject();
      const user = UserSchema.parse(row);
      stmt.reset();
      return user;
    }

    stmt.reset();
    return null;
  }

  // Flavor analysis methods (simple heuristics for now)
  private extractFlavors(name: string, description?: string): string[] {
    const text = `${name} ${description || ''}`.toLowerCase();
    const flavors: string[] = [];
    
    if (text.match(/spicy|hot|chili|pepper|jalapeño|sriracha/)) flavors.push('spicy');
    if (text.match(/sweet|sugar|chocolate|caramel|honey|syrup/)) flavors.push('sweet');
    if (text.match(/sour|lemon|lime|vinegar|pickled/)) flavors.push('sour');
    if (text.match(/salty|salt|cheese|bacon|anchovy/)) flavors.push('salty');
    if (text.match(/bitter|coffee|dark chocolate|kale/)) flavors.push('bitter');
    if (text.match(/umami|mushroom|tomato|soy|miso|parmesan/)) flavors.push('umami');
    
    return flavors;
  }

  private calculateSpiciness(name: string, description?: string): number {
    const text = `${name} ${description || ''}`.toLowerCase();
    let score = 0;
    
    if (text.match(/mild/)) score = 1;
    if (text.match(/spicy|hot/)) score = 3;
    if (text.match(/very hot|extra spicy|ghost pepper/)) score = 5;
    
    return score;
  }

  private calculateSweetness(name: string, description?: string): number {
    const text = `${name} ${description || ''}`.toLowerCase();
    let score = 0;
    
    if (text.match(/sweet|dessert|chocolate|caramel/)) score = 4;
    if (text.match(/sugar|syrup|honey/)) score = 5;
    
    return score;
  }

  // Restaurant placement management methods
  async setRestaurantPlacement(restaurantId: number, x: number, y: number, district?: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO RESTAURANT_PLACEMENTS 
      (restaurant_id, x, y, district, created_at) 
      VALUES (?, ?, ?, ?, datetime('now'))
    `);

    try {
      stmt.run([restaurantId, x, y, district || null]);
      console.log(`Set placement for restaurant ${restaurantId} at (${x}, ${y})`);
    } finally {
      stmt.free();
    }
  }

  async setMultipleRestaurantPlacements(placements: Array<{restaurantId: number, x: number, y: number, district?: string}>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO RESTAURANT_PLACEMENTS 
      (restaurant_id, x, y, district, created_at) 
      VALUES (?, ?, ?, ?, datetime('now'))
    `);

    try {
      this.db.run('BEGIN TRANSACTION');
      
      for (const placement of placements) {
        stmt.run([placement.restaurantId, placement.x, placement.y, placement.district || null]);
      }
      
      this.db.run('COMMIT');
      console.log(`Set placements for ${placements.length} restaurants`);
    } catch (error) {
      this.db.run('ROLLBACK');
      throw error;
    } finally {
      stmt.free();
    }
  }

  async getRestaurantPlacement(restaurantId: number): Promise<{x: number, y: number, district?: string} | null> {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare('SELECT x, y, district FROM RESTAURANT_PLACEMENTS WHERE restaurant_id = ?');
    
    try {
      const result = stmt.get([restaurantId]) as any;
      return result ? {
        x: result.x,
        y: result.y,
        district: result.district
      } : null;
    } finally {
      stmt.free();
    }
  }

  async clearRestaurantPlacements(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    this.db.run('DELETE FROM RESTAURANT_PLACEMENTS');
    console.log('Cleared all restaurant placements');
  }

  async getRestaurantsWithPlacements(): Promise<Array<Restaurant & {override_x?: number, override_y?: number, district: string}>> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const stmt = this.statements.get('getRestaurants');
      if (!stmt) throw new Error('Statement not prepared');

      const results: any[] = [];
      stmt.bind([]);
      while (stmt.step()) {
        const row = stmt.getAsObject();
        results.push(row);
      }
      stmt.reset();
      
      console.log('Raw database results:', results.slice(0, 3)); // Debug first 3 rows
      
      return results.map((row: any) => {
        const restaurant = RestaurantSchema.parse({
          restaurant_id: row.restaurant_id,
          name: row.name,
          cuisine_type: row.cuisine_type,
          phone: row.phone || '',
          address: row.address,
          city: row.city,
          rating: row.rating || 0,
          delivery_fee: row.delivery_fee || 0,
          delivery_time_estimate: row.delivery_time_estimate || 30,
          is_open: Boolean(row.is_open),
          is_active: Boolean(row.is_active),
          owner_id: row.owner_id,
        });

        const result = {
          ...restaurant,
          override_x: row.override_x,
          override_y: row.override_y,
          district: row.district
        };
        
        console.log(`Processed restaurant ${restaurant.name}:`, {
          override_x: row.override_x,
          override_y: row.override_y,
          final_x: result.override_x,
          final_y: result.override_y
        });
        
        return result;
      });
    } catch (error) {
      console.error('Error getting restaurants with placements:', error);
      throw error;
    }
  }

  private isVegetarian(name: string, description?: string): boolean {
    const text = `${name} ${description || ''}`.toLowerCase();
    return !text.match(/meat|chicken|beef|pork|fish|seafood|bacon|ham/) &&
           text.match(/vegetarian|vegan|veggie/) !== null;
  }

  private isDessert(category: string, name: string): boolean {
    return category.toLowerCase().includes('dessert') ||
           name.toLowerCase().match(/cake|ice cream|cookie|pie|pudding|brownie/) !== null;
  }

  // Cache management
  clearCache(): void {
    this.cache.clear();
  }

  // Cleanup
  close(): void {
    this.statements.forEach(stmt => stmt.free());
    this.statements.clear();
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    this.clearCache();
  }
}

// Singleton instance
export const sqliteManager = new SQLiteManager();
