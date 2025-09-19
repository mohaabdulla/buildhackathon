import { z } from 'zod';

// Database schema definitions
export const UserSchema = z.object({
  user_id: z.number(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  address: z.string().optional(),
  role: z.enum(['customer', 'driver', 'restaurant_owner']),
  created_at: z.string(),
});

export const RestaurantSchema = z.object({
  restaurant_id: z.number(),
  name: z.string(),
  cuisine_type: z.string(),
  address: z.string(),
  phone: z.string().optional(),
  rating: z.number().min(0).max(5).optional(),
  owner_id: z.number(),
  city: z.string(),
  district: z.string().optional(),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number(),
  }).optional(),
});

export const MenuItemSchema = z.object({
  item_id: z.number(),
  restaurant_id: z.number(),
  name: z.string(),
  description: z.string().optional(),
  price: z.number().min(0),
  category: z.string(),
  is_available: z.boolean().default(true),
  allergens: z.array(z.string()).optional(),
  dietary_flags: z.array(z.string()).optional(), // vegan, vegetarian, gluten-free, etc.
});

export const OrderSchema = z.object({
  order_id: z.number(),
  customer_id: z.number(),
  restaurant_id: z.number(),
  driver_id: z.number().optional(),
  status: z.enum(['pending', 'confirmed', 'preparing', 'ready', 'delivering', 'delivered', 'cancelled']),
  total_amount: z.number().min(0),
  delivery_fee: z.number().min(0),
  tax_amount: z.number().min(0),
  tip_amount: z.number().min(0).optional(),
  delivery_address: z.string(),
  order_date: z.string(),
  delivery_time: z.string().optional(),
});

export const OrderItemSchema = z.object({
  order_item_id: z.number(),
  order_id: z.number(),
  item_id: z.number(),
  quantity: z.number().min(1),
  item_price: z.number().min(0),
  special_instructions: z.string().optional(),
});

export const ReviewSchema = z.object({
  review_id: z.number(),
  order_id: z.number(),
  customer_id: z.number(),
  restaurant_id: z.number(),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
  review_date: z.string(),
  helpful_count: z.number().min(0).default(0),
});

// Derived types
export type User = z.infer<typeof UserSchema>;
export type Restaurant = z.infer<typeof RestaurantSchema>;
export type MenuItem = z.infer<typeof MenuItemSchema>;
export type Order = z.infer<typeof OrderSchema>;
export type OrderItem = z.infer<typeof OrderItemSchema>;
export type Review = z.infer<typeof ReviewSchema>;

// Extended types for game logic
export interface RestaurantWithStats extends Restaurant {
  totalOrders: number;
  avgRating: number;
  topFlavors: string[];
  avgSentiment: number;
  vegetarianPercentage: number;
  dessertPercentage: number;
}

export interface MenuItemWithTags extends MenuItem {
  flavors: string[];
  spiciness: number;
  sweetness: number;
  isVegetarian: boolean;
  isDessert: boolean;
}

export interface OrderWithDetails extends Order {
  customerName: string;
  restaurantName: string;
  driverName?: string;
  items: (OrderItem & { itemName: string; itemPrice: number })[];
}

export interface ReviewWithSentiment extends Review {
  sentiment: number; // -1 to 1
  keywords: string[];
  emotionalTone: 'positive' | 'negative' | 'neutral';
}
