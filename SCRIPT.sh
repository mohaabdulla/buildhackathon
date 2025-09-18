#!/bin/bash

echo "🍕 Setting up Food Delivery Database..."

# Remove existing database if it exists
if [ -f "fooddelivery.db" ]; then
    echo "Removing existing database..."
    rm fooddelivery.db
fi

# Create database and run schema
echo "Creating database schema..."
sqlite3 fooddelivery.db < DATABASE.sql

# Seed the database
echo "Seeding database with sample data..."
sqlite3 fooddelivery.db << 'EOF'

-- =============================================================================
-- SEED DATA FOR FOOD DELIVERY DATABASE
-- =============================================================================

-- Insert Users
INSERT INTO USERS (first_name, last_name, email, password, phone, role) VALUES
('John', 'Customer', 'john.customer@email.com', 'hashed_password_123', '+1-555-0101', 'customer'),
('Maria', 'Chef', 'maria.chef@email.com', 'hashed_password_456', '+1-555-0102', 'restaurant_owner'),
('Mike', 'Driver', 'mike.driver@email.com', 'hashed_password_789', '+1-555-0103', 'driver'),
('Sarah', 'Foodie', 'sarah.foodie@email.com', 'hashed_password_321', '+1-555-0104', 'customer'),
('Tony', 'Pizzaiolo', 'tony.pizza@email.com', 'hashed_password_654', '+1-555-0105', 'restaurant_owner'),
('Lisa', 'Delivery', 'lisa.delivery@email.com', 'hashed_password_987', '+1-555-0106', 'driver'),
('David', 'Hungry', 'david.hungry@email.com', 'hashed_password_147', '+1-555-0107', 'customer'),
('Anna', 'Baker', 'anna.baker@email.com', 'hashed_password_258', '+1-555-0108', 'restaurant_owner');

-- Insert Restaurants
INSERT INTO RESTAURANTS (owner_id, name, cuisine_type, phone, address, city, rating, delivery_fee, delivery_time_estimate, is_open) VALUES
(2, 'Maria''s Authentic Mexican', 'Mexican', '+1-555-1001', '123 Taco Street', 'Los Angeles', 4.5, 2.99, 25, 1),
(5, 'Tony''s Pizza Palace', 'Italian', '+1-555-1002', '456 Pizza Ave', 'New York', 4.2, 3.49, 30, 1),
(8, 'Anna''s Artisan Bakery', 'Bakery', '+1-555-1003', '789 Bread Lane', 'San Francisco', 4.8, 1.99, 20, 1),
(2, 'Spice Garden Indian', 'Indian', '+1-555-1004', '321 Curry Road', 'Chicago', 4.3, 2.49, 35, 0),
(5, 'Mediterranean Delights', 'Mediterranean', '+1-555-1005', '654 Olive Street', 'Miami', 4.6, 3.99, 28, 1);

-- Insert Menu Items
INSERT INTO MENU_ITEMS (restaurant_id, name, description, price, category, is_vegetarian, is_available) VALUES
-- Maria's Authentic Mexican
(1, 'Chicken Tacos', 'Grilled chicken with fresh salsa and cilantro', 12.99, 'main', 0, 1),
(1, 'Beef Burrito', 'Seasoned beef with rice, beans, and cheese', 14.99, 'main', 0, 1),
(1, 'Vegetarian Quesadilla', 'Cheese and veggie quesadilla with guacamole', 11.99, 'main', 1, 1),
(1, 'Churros', 'Crispy cinnamon sugar churros with chocolate sauce', 6.99, 'dessert', 1, 1),
(1, 'Horchata', 'Traditional rice and cinnamon drink', 3.99, 'drink', 1, 1),

-- Tony's Pizza Palace
(2, 'Margherita Pizza', 'Fresh mozzarella, tomato sauce, and basil', 16.99, 'main', 1, 1),
(2, 'Pepperoni Pizza', 'Classic pepperoni with mozzarella cheese', 18.99, 'main', 0, 1),
(2, 'Caesar Salad', 'Romaine lettuce with parmesan and croutons', 9.99, 'appetizer', 1, 1),
(2, 'Garlic Bread', 'Fresh baked bread with garlic butter', 5.99, 'appetizer', 1, 1),
(2, 'Tiramisu', 'Classic Italian dessert', 7.99, 'dessert', 1, 1),

-- Anna's Artisan Bakery
(3, 'Croissant Sandwich', 'Ham and cheese croissant with fresh herbs', 8.99, 'main', 0, 1),
(3, 'Avocado Toast', 'Sourdough with avocado, tomato, and microgreens', 9.99, 'main', 1, 1),
(3, 'Chocolate Croissant', 'Buttery pastry with dark chocolate', 4.99, 'dessert', 1, 1),
(3, 'Fresh Coffee', 'Locally roasted single-origin coffee', 3.49, 'drink', 1, 1),
(3, 'Fresh Orange Juice', 'Squeezed daily from Valencia oranges', 4.99, 'drink', 1, 1),

-- Mediterranean Delights
(5, 'Chicken Shawarma', 'Marinated chicken with tahini sauce', 13.99, 'main', 0, 1),
(5, 'Falafel Plate', 'Crispy falafel with hummus and pita', 11.99, 'main', 1, 1),
(5, 'Greek Salad', 'Fresh vegetables with feta and olives', 10.99, 'appetizer', 1, 1),
(5, 'Baklava', 'Honey and nut phyllo pastry', 5.99, 'dessert', 1, 1);

-- Insert Orders
INSERT INTO ORDERS (customer_id, restaurant_id, driver_id, delivery_address, order_number, status, subtotal, delivery_fee, total_amount, is_credit_card, payment_status, special_instructions) VALUES
(1, 1, 3, '789 Oak Street, Los Angeles, CA 90210', 'ORD-20241201-001', 'delivered', 27.98, 2.99, 30.97, 1, 'paid', 'Extra spicy please'),
(4, 2, 6, '456 Pine Avenue, New York, NY 10001', 'ORD-20241201-002', 'delivered', 34.97, 3.49, 38.46, 1, 'paid', 'Leave at door'),
(7, 3, 3, '123 Elm Street, San Francisco, CA 94102', 'ORD-20241201-003', 'ready', 17.97, 1.99, 19.96, 0, 'paid', 'Ring doorbell'),
(1, 5, NULL, '789 Oak Street, Los Angeles, CA 90210', 'ORD-20241201-004', 'preparing', 24.98, 3.99, 28.97, 1, 'paid', NULL),
(4, 1, 6, '456 Pine Avenue, New York, NY 10001', 'ORD-20241201-005', 'pending', 18.98, 2.99, 21.97, 1, 'pending', 'No onions');

-- Insert Order Items
INSERT INTO ORDER_ITEMS (order_id, menu_item_id, quantity, unit_price, total_price) VALUES
-- Order 1 (John's Mexican food)
(1, 1, 2, 12.99, 25.98),
(1, 5, 1, 3.99, 3.99),

-- Order 2 (Sarah's Pizza)
(2, 6, 1, 16.99, 16.99),
(2, 8, 1, 9.99, 9.99),
(2, 10, 1, 7.99, 7.99),

-- Order 3 (David's Bakery)
(3, 11, 1, 8.99, 8.99),
(3, 13, 2, 4.99, 9.98),

-- Order 4 (John's Mediterranean)
(4, 16, 1, 13.99, 13.99),
(4, 18, 1, 10.99, 10.99),

-- Order 5 (Sarah's Mexican again)
(5, 2, 1, 14.99, 14.99),
(5, 4, 1, 6.99, 6.99);

-- Insert Reviews
INSERT INTO REVIEWS (order_id, customer_id, restaurant_id, rating, review_text) VALUES
(1, 1, 1, 5, 'Amazing tacos! Fresh ingredients and perfect spice level.'),
(2, 4, 2, 4, 'Great pizza and fast delivery. Tiramisu was delicious!'),
(1, 1, 1, 5, 'Best Mexican food in the city. Will definitely order again.'),
(2, 4, 2, 4, 'Good food, driver was very polite and professional.');

EOF

echo "✅ Database setup complete!"
echo ""
echo "📊 Database Statistics:"
sqlite3 fooddelivery.db << 'EOF'
SELECT 'Users: ' || COUNT(*) FROM USERS;
SELECT 'Restaurants: ' || COUNT(*) FROM RESTAURANTS;
SELECT 'Menu Items: ' || COUNT(*) FROM MENU_ITEMS;
SELECT 'Orders: ' || COUNT(*) FROM ORDERS;
SELECT 'Order Items: ' || COUNT(*) FROM ORDER_ITEMS;
SELECT 'Reviews: ' || COUNT(*) FROM REVIEWS;
EOF

echo ""
echo "🎯 Sample Queries:"
echo "View open restaurants: sqlite3 fooddelivery.db 'SELECT name, cuisine_type, rating, delivery_fee FROM RESTAURANTS WHERE is_open = 1;'"
echo "View order history: sqlite3 fooddelivery.db 'SELECT u.first_name, r.name as restaurant, o.order_number, o.status, o.total_amount FROM ORDERS o JOIN USERS u ON o.customer_id = u.id JOIN RESTAURANTS r ON o.restaurant_id = r.id;'"
echo "View menu items: sqlite3 fooddelivery.db 'SELECT r.name as restaurant, m.name as item, m.price, m.category FROM MENU_ITEMS m JOIN RESTAURANTS r ON m.restaurant_id = r.id WHERE m.is_available = 1;'"
echo ""
echo "🍕 Food delivery database is ready for your use!"