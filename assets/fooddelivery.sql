-- Sample Food Delivery Database Schema
-- This will be converted to SQLite binary format

CREATE TABLE users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    address TEXT,
    role TEXT CHECK (role IN ('customer', 'driver', 'restaurant_owner')) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE restaurants (
    restaurant_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    cuisine_type TEXT NOT NULL,
    address TEXT NOT NULL,
    phone TEXT,
    rating REAL CHECK (rating >= 0 AND rating <= 5),
    owner_id INTEGER,
    city TEXT NOT NULL,
    district TEXT,
    latitude REAL,
    longitude REAL,
    FOREIGN KEY (owner_id) REFERENCES users(user_id)
);

CREATE TABLE menu_items (
    item_id INTEGER PRIMARY KEY AUTOINCREMENT,
    restaurant_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL CHECK (price >= 0),
    category TEXT NOT NULL,
    is_available BOOLEAN DEFAULT 1,
    allergens TEXT, -- JSON array as text
    dietary_flags TEXT, -- JSON array as text
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(restaurant_id)
);

CREATE TABLE orders (
    order_id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    restaurant_id INTEGER NOT NULL,
    driver_id INTEGER,
    status TEXT CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'delivering', 'delivered', 'cancelled')) DEFAULT 'pending',
    total_amount REAL NOT NULL CHECK (total_amount >= 0),
    delivery_fee REAL NOT NULL CHECK (delivery_fee >= 0),
    tax_amount REAL NOT NULL CHECK (tax_amount >= 0),
    tip_amount REAL CHECK (tip_amount >= 0),
    delivery_address TEXT NOT NULL,
    order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    delivery_time DATETIME,
    FOREIGN KEY (customer_id) REFERENCES users(user_id),
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(restaurant_id),
    FOREIGN KEY (driver_id) REFERENCES users(user_id)
);

CREATE TABLE order_items (
    order_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    item_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    item_price REAL NOT NULL CHECK (item_price >= 0),
    special_instructions TEXT,
    FOREIGN KEY (order_id) REFERENCES orders(order_id),
    FOREIGN KEY (item_id) REFERENCES menu_items(item_id)
);

CREATE TABLE reviews (
    review_id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    customer_id INTEGER NOT NULL,
    restaurant_id INTEGER NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    review_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    helpful_count INTEGER DEFAULT 0,
    FOREIGN KEY (order_id) REFERENCES orders(order_id),
    FOREIGN KEY (customer_id) REFERENCES users(user_id),
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(restaurant_id)
);

-- Sample Data

-- Users
INSERT INTO users (name, email, phone, address, role) VALUES
('Alice Johnson', 'alice@email.com', '555-0001', '123 Main St, Downtown', 'customer'),
('Bob Smith', 'bob@email.com', '555-0002', '456 Oak Ave, Midtown', 'customer'),
('Carol Williams', 'carol@email.com', '555-0003', '789 Pine St, Uptown', 'customer'),
('David Brown', 'david@email.com', '555-0004', '321 Elm St, Downtown', 'customer'),
('Eve Davis', 'eve@email.com', '555-0005', '654 Maple Ave, Suburbs', 'customer'),
('Frank Wilson', 'frank@email.com', '555-0101', NULL, 'driver'),
('Grace Miller', 'grace@email.com', '555-0102', NULL, 'driver'),
('Henry Taylor', 'henry@email.com', '555-0103', NULL, 'driver'),
('Isabella Garcia', 'isabella@email.com', '555-0201', '100 Restaurant Row', 'restaurant_owner'),
('Jack Rodriguez', 'jack@email.com', '555-0202', '200 Food Court', 'restaurant_owner'),
('Kate Martinez', 'kate@email.com', '555-0203', '300 Dining District', 'restaurant_owner'),
('Liam Anderson', 'liam@email.com', '555-0204', '400 Cuisine Corner', 'restaurant_owner'),
('Maya Thompson', 'maya@email.com', '555-0205', '500 Flavor Street', 'restaurant_owner');

-- Restaurants
INSERT INTO restaurants (name, cuisine_type, address, phone, rating, owner_id, city, district, latitude, longitude) VALUES
('Mama Mias Italian', 'Italian', '100 Restaurant Row, Downtown', '555-1001', 4.5, 9, 'MetroCity', 'Downtown', 40.7128, -74.0060),
('Golden Dragon', 'Chinese', '200 Food Court, Chinatown', '555-1002', 4.2, 10, 'MetroCity', 'Chinatown', 40.7158, -73.9970),
('El Sombrero', 'Mexican', '300 Dining District, Midtown', '555-1003', 4.7, 11, 'MetroCity', 'Midtown', 40.7489, -73.9857),
('Burger Palace', 'American', '400 Cuisine Corner, Downtown', '555-1004', 3.9, 12, 'MetroCity', 'Downtown', 40.7580, -73.9855),
('Spice Garden', 'Indian', '500 Flavor Street, Little India', '555-1005', 4.6, 13, 'MetroCity', 'Little India', 40.7282, -73.9942),
('Sakura Sushi', 'Japanese', '150 Restaurant Row, Downtown', '555-1006', 4.8, 9, 'MetroCity', 'Downtown', 40.7130, -74.0050),
('Bangkok Bistro', 'Thai', '250 Food Court, Midtown', '555-1007', 4.3, 10, 'MetroCity', 'Midtown', 40.7500, -73.9850);

-- Menu Items
INSERT INTO menu_items (restaurant_id, name, description, price, category, allergens, dietary_flags) VALUES
-- Mama Mias Italian
(1, 'Margherita Pizza', 'Classic pizza with tomato sauce, mozzarella, and fresh basil', 18.99, 'Pizza', '["gluten", "dairy"]', '["vegetarian"]'),
(1, 'Spaghetti Carbonara', 'Creamy pasta with bacon, eggs, and parmesan cheese', 22.99, 'Pasta', '["gluten", "dairy", "eggs"]', '[]'),
(1, 'Tiramisu', 'Classic Italian dessert with coffee and mascarpone', 8.99, 'Dessert', '["gluten", "dairy", "eggs"]', '["vegetarian"]'),
(1, 'Spicy Arrabbiata', 'Penne pasta in spicy tomato sauce with chili peppers', 19.99, 'Pasta', '["gluten"]', '["vegetarian", "spicy"]'),

-- Golden Dragon
(2, 'Sweet and Sour Pork', 'Crispy pork with sweet and sour sauce', 16.99, 'Main Course', '["soy"]', '[]'),
(2, 'Kung Pao Chicken', 'Spicy chicken with peanuts and vegetables', 17.99, 'Main Course', '["peanuts", "soy"]', '["spicy"]'),
(2, 'Vegetable Spring Rolls', 'Crispy rolls filled with fresh vegetables', 7.99, 'Appetizer', '["gluten"]', '["vegetarian"]'),
(2, 'Mapo Tofu', 'Spicy tofu in fermented bean sauce', 14.99, 'Main Course', '["soy"]', '["vegetarian", "spicy"]'),

-- El Sombrero
(3, 'Chicken Tacos', 'Three soft tacos with grilled chicken and salsa', 12.99, 'Tacos', '["gluten"]', '[]'),
(3, 'Spicy Beef Burrito', 'Large burrito with spicy beef, beans, and cheese', 14.99, 'Burritos', '["gluten", "dairy"]', '["spicy"]'),
(3, 'Churros', 'Sweet fried dough with cinnamon sugar', 6.99, 'Dessert', '["gluten"]', '["vegetarian", "sweet"]'),
(3, 'Vegetarian Quesadilla', 'Cheese quesadilla with peppers and onions', 11.99, 'Quesadillas', '["gluten", "dairy"]', '["vegetarian"]'),

-- Burger Palace
(4, 'Classic Cheeseburger', 'Beef patty with cheese, lettuce, tomato, and pickles', 13.99, 'Burgers', '["gluten", "dairy"]', '[]'),
(4, 'Spicy Chicken Sandwich', 'Crispy chicken with spicy mayo and hot sauce', 12.99, 'Sandwiches', '["gluten", "eggs"]', '["spicy"]'),
(4, 'Chocolate Milkshake', 'Rich chocolate milkshake with whipped cream', 5.99, 'Dessert', '["dairy"]', '["vegetarian", "sweet"]'),
(4, 'Sweet Potato Fries', 'Crispy sweet potato fries with honey mustard', 4.99, 'Sides', '[]', '["vegetarian", "sweet"]'),

-- Spice Garden
(5, 'Chicken Tikka Masala', 'Creamy tomato curry with tender chicken', 18.99, 'Curry', '["dairy"]', '[]'),
(5, 'Vegetable Biryani', 'Fragrant basmati rice with spiced vegetables', 16.99, 'Rice', '[]', '["vegetarian"]'),
(5, 'Samosas', 'Crispy pastries filled with spiced potatoes', 6.99, 'Appetizer', '["gluten"]', '["vegetarian"]'),
(5, 'Vindaloo Curry', 'Very spicy curry with tender meat and potatoes', 19.99, 'Curry', '[]', '["very spicy"]'),

-- Sakura Sushi
(6, 'Salmon Sashimi', 'Fresh salmon slices served with wasabi', 24.99, 'Sashimi', '["fish"]', '[]'),
(6, 'California Roll', 'Crab, avocado, and cucumber roll', 12.99, 'Sushi', '["shellfish"]', '[]'),
(6, 'Vegetable Tempura', 'Lightly battered and fried mixed vegetables', 14.99, 'Tempura', '["gluten"]', '["vegetarian"]'),
(6, 'Mochi Ice Cream', 'Sweet rice cake filled with ice cream', 7.99, 'Dessert', '["dairy"]', '["vegetarian", "sweet"]'),

-- Bangkok Bistro
(7, 'Pad Thai', 'Stir-fried noodles with shrimp, tofu, and peanuts', 15.99, 'Noodles', '["peanuts", "shellfish"]', '[]'),
(7, 'Green Curry', 'Spicy coconut curry with vegetables', 17.99, 'Curry', '[]', '["spicy"]'),
(7, 'Mango Sticky Rice', 'Sweet dessert with fresh mango and coconut rice', 8.99, 'Dessert', '[]', '["vegetarian", "sweet"]'),
(7, 'Tom Yum Soup', 'Spicy and sour soup with lemongrass and lime', 11.99, 'Soup', '["shellfish"]', '["spicy", "sour"]');

-- Sample Orders
INSERT INTO orders (customer_id, restaurant_id, driver_id, status, total_amount, delivery_fee, tax_amount, tip_amount, delivery_address, order_date) VALUES
(1, 1, 6, 'delivered', 31.97, 2.99, 2.56, 5.00, '123 Main St, Downtown', '2024-01-15 18:30:00'),
(2, 2, 7, 'delivered', 24.98, 2.99, 2.00, 3.50, '456 Oak Ave, Midtown', '2024-01-16 19:15:00'),
(3, 3, 8, 'delivered', 19.98, 2.99, 1.60, 4.00, '789 Pine St, Uptown', '2024-01-17 20:00:00'),
(1, 5, 6, 'delivered', 25.98, 2.99, 2.08, 4.50, '123 Main St, Downtown', '2024-01-18 19:30:00'),
(4, 4, 7, 'delivered', 18.98, 2.99, 1.52, 3.00, '321 Elm St, Downtown', '2024-01-19 18:45:00');

-- Sample Order Items
INSERT INTO order_items (order_id, item_id, quantity, item_price, special_instructions) VALUES
-- Order 1: Alice at Mama Mias
(1, 1, 1, 18.99, 'Extra basil please'),
(1, 3, 1, 8.99, NULL),

-- Order 2: Bob at Golden Dragon
(2, 5, 1, 16.99, NULL),
(2, 7, 1, 7.99, 'Extra crispy'),

-- Order 3: Carol at El Sombrero
(3, 9, 1, 12.99, 'Mild salsa'),
(3, 11, 1, 6.99, NULL),

-- Order 4: Alice at Spice Garden
(4, 13, 1, 18.99, 'Medium spice level'),
(4, 15, 1, 6.99, NULL),

-- Order 5: David at Burger Palace
(5, 17, 1, 13.99, 'No pickles'),
(5, 19, 1, 4.99, NULL);

-- Sample Reviews
INSERT INTO reviews (order_id, customer_id, restaurant_id, rating, comment, review_date) VALUES
(1, 1, 1, 5, 'Amazing pizza! The tiramisu was absolutely divine. Will definitely order again!', '2024-01-15 21:00:00'),
(2, 2, 2, 4, 'Good food, delivery was a bit slow but the sweet and sour pork was delicious.', '2024-01-16 21:30:00'),
(3, 3, 3, 5, 'Best Mexican food in the city! The churros were so sweet and perfect.', '2024-01-17 22:00:00'),
(4, 1, 5, 4, 'Excellent curry, very flavorful. The samosas were crispy and tasty.', '2024-01-18 21:15:00'),
(5, 4, 4, 3, 'Burger was okay, nothing special. Fries were good though.', '2024-01-19 20:30:00');

-- Create indexes for better performance
CREATE INDEX idx_restaurants_city ON restaurants(city);
CREATE INDEX idx_restaurants_cuisine ON restaurants(cuisine_type);
CREATE INDEX idx_menu_items_restaurant ON menu_items(restaurant_id);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_restaurant ON orders(restaurant_id);
CREATE INDEX idx_orders_date ON orders(order_date);
CREATE INDEX idx_reviews_restaurant ON reviews(restaurant_id);
CREATE INDEX idx_reviews_customer ON reviews(customer_id);
