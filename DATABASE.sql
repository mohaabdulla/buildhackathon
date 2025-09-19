-- Users table
CREATE TABLE IF NOT EXISTS USERS (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    phone TEXT NOT NULL,
    role TEXT CHECK(
        role IN ('customer', 'restaurant_owner', 'driver')
    ) NOT NULL DEFAULT 'customer',
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Restaurants table
CREATE TABLE IF NOT EXISTS RESTAURANTS (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    cuisine_type TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    x REAL DEFAULT 0,
    y REAL DEFAULT 0,
    rating DECIMAL(3, 2) DEFAULT 0,
    delivery_fee DECIMAL(8, 2) DEFAULT 0,
    delivery_time_estimate INTEGER DEFAULT 30,
    -- minutes
    is_open BOOLEAN DEFAULT 1,
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES USERS(id)
);
-- Menu items table
CREATE TABLE IF NOT EXISTS MENU_ITEMS (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    restaurant_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(8, 2) NOT NULL,
    category TEXT NOT NULL,
    -- 'appetizer', 'main', 'dessert', 'drink'
    is_vegetarian BOOLEAN DEFAULT 0,
    is_available BOOLEAN DEFAULT 1,
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurant_id) REFERENCES RESTAURANTS(id)
);
-- Orders table
CREATE TABLE IF NOT EXISTS ORDERS (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    restaurant_id INTEGER NOT NULL,
    driver_id INTEGER,
    delivery_address TEXT NOT NULL,
    order_number TEXT UNIQUE NOT NULL,
    status TEXT CHECK(
        status IN (
            'pending',
            'confirmed',
            'preparing',
            'ready',
            'delivered',
            'cancelled'
        )
    ) DEFAULT 'pending',
    subtotal DECIMAL(10, 2) NOT NULL,
    delivery_fee DECIMAL(8, 2) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    is_credit_card BOOLEAN NOT NULL DEFAULT 1,
    payment_status TEXT CHECK(payment_status IN ('pending', 'paid', 'failed')) DEFAULT 'pending',
    special_instructions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES USERS(id),
    FOREIGN KEY (restaurant_id) REFERENCES RESTAURANTS(id),
    FOREIGN KEY (driver_id) REFERENCES USERS(id)
);
-- Order items table
CREATE TABLE IF NOT EXISTS ORDER_ITEMS (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    menu_item_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(8, 2) NOT NULL,
    total_price DECIMAL(8, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES ORDERS(id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES MENU_ITEMS(id)
);
-- Reviews table
CREATE TABLE IF NOT EXISTS REVIEWS (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    customer_id INTEGER NOT NULL,
    restaurant_id INTEGER NOT NULL,
    rating INTEGER CHECK(
        rating BETWEEN 1 AND 5
    ) NOT NULL,
    review_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES ORDERS(id),
    FOREIGN KEY (customer_id) REFERENCES USERS(id),
    FOREIGN KEY (restaurant_id) REFERENCES RESTAURANTS(id)
);
-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON USERS(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON USERS(role);
CREATE INDEX IF NOT EXISTS idx_restaurants_owner ON RESTAURANTS(owner_id);
CREATE INDEX IF NOT EXISTS idx_restaurants_cuisine ON RESTAURANTS(cuisine_type);
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant ON MENU_ITEMS(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON ORDERS(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant ON ORDERS(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON ORDERS(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON ORDER_ITEMS(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_restaurant ON REVIEWS(restaurant_id);

-- Sample Data
INSERT INTO USERS (first_name, last_name, email, password, phone, role) VALUES
-- Original restaurant owners
('Mario', 'Rossi', 'mario@pizzapalace.com', 'hashedpass1', '555-0101', 'restaurant_owner'),
('Chen', 'Wei', 'chen@dragonwok.com', 'hashedpass2', '555-0102', 'restaurant_owner'),
('Ahmed', 'Hassan', 'ahmed@spicepalace.com', 'hashedpass3', '555-0103', 'restaurant_owner'),
('Sofia', 'Garcia', 'sofia@tacotime.com', 'hashedpass4', '555-0104', 'restaurant_owner'),
('James', 'Thompson', 'james@burgerbarn.com', 'hashedpass5', '555-0105', 'restaurant_owner'),
('Yuki', 'Tanaka', 'yuki@sushizen.com', 'hashedpass6', '555-0106', 'restaurant_owner'),
-- New restaurant owners for expanded gameplay
('Kim', 'Soo-jin', 'kim@seoulkitchen.com', 'hashedpass7', '555-0107', 'restaurant_owner'),
('Nguyen', 'Linh', 'linh@phohouse.com', 'hashedpass8', '555-0108', 'restaurant_owner'),
('Dimitris', 'Kostas', 'dimitris@olivetree.com', 'hashedpass9', '555-0109', 'restaurant_owner'),
('Maria', 'Santos', 'maria@tropicana.com', 'hashedpass10', '555-0110', 'restaurant_owner'),
('Pierre', 'Dubois', 'pierre@bistroparis.com', 'hashedpass11', '555-0111', 'restaurant_owner'),
('Fatima', 'Al-Zahra', 'fatima@lebanesedelight.com', 'hashedpass12', '555-0112', 'restaurant_owner'),
('Raj', 'Patel', 'raj@curryexpress.com', 'hashedpass13', '555-0113', 'restaurant_owner'),
('Carlos', 'Mendoza', 'carlos@taqueriamaya.com', 'hashedpass14', '555-0114', 'restaurant_owner'),
('Hans', 'Mueller', 'hans@bavarianhof.com', 'hashedpass15', '555-0115', 'restaurant_owner'),
('Amara', 'Okafor', 'amara@lagoseats.com', 'hashedpass16', '555-0116', 'restaurant_owner'),
('Isabella', 'Rossi', 'isabella@venicecafe.com', 'hashedpass17', '555-0117', 'restaurant_owner'),
('Hiroshi', 'Nakamura', 'hiroshi@ramenbar.com', 'hashedpass18', '555-0118', 'restaurant_owner'),
('Anna', 'Kowalski', 'anna@polishkitchen.com', 'hashedpass19', '555-0119', 'restaurant_owner'),
('Omar', 'El-Hassan', 'omar@cairopalace.com', 'hashedpass20', '555-0120', 'restaurant_owner'),
('Priya', 'Sharma', 'priya@spicemarket.com', 'hashedpass21', '555-0121', 'restaurant_owner'),
('Alex', 'Petrov', 'alex@borschbar.com', 'hashedpass22', '555-0122', 'restaurant_owner');

INSERT INTO RESTAURANTS (owner_id, name, cuisine_type, phone, address, city, x, y, rating, delivery_fee, delivery_time_estimate) VALUES
-- Original restaurants (initial clustered positions that will be overridden)
(1, 'Pizza Palace', 'Italian', '555-0201', '123 Main St', 'Downtown', 400, 300, 4.5, 2.99, 25),
(2, 'Dragon Wok', 'Chinese', '555-0202', '456 Oak Ave', 'Chinatown', 450, 320, 4.2, 3.50, 30),
(3, 'Spice Palace', 'Indian', '555-0203', '789 Elm St', 'Little India', 420, 340, 4.7, 2.50, 35),
(4, 'Taco Time', 'Mexican', '555-0204', '321 Pine St', 'Mission District', 380, 360, 4.1, 1.99, 20),
(5, 'Burger Barn', 'American', '555-0205', '654 Cedar Ave', 'Downtown', 410, 280, 3.9, 3.99, 15),
(6, 'Sushi Zen', 'Japanese', '555-0206', '987 Bamboo Rd', 'Japantown', 440, 310, 4.8, 4.50, 40),
-- Expanded restaurants for increased difficulty (initial clustered positions)
(7, 'Seoul Kitchen', 'Korean', '555-0207', '234 Kimchi Lane', 'Koreatown', 460, 330, 4.6, 2.75, 35),
(8, 'Pho House', 'Vietnamese', '555-0208', '567 Saigon St', 'Little Saigon', 390, 350, 4.4, 2.25, 28),
(9, 'Olive Tree', 'Greek', '555-0209', '890 Athens Ave', 'Greek Quarter', 430, 290, 4.3, 3.25, 32),
(10, 'Tropicana Grill', 'Brazilian', '555-0210', '345 Rio Road', 'South Beach', 470, 370, 4.5, 3.75, 38),
(11, 'Bistro Paris', 'French', '555-0211', '678 Champs St', 'French Quarter', 400, 340, 4.9, 4.25, 45),
(12, 'Lebanese Delight', 'Lebanese', '555-0212', '901 Beirut Blvd', 'Middle East District', 480, 320, 4.6, 2.95, 30),
(13, 'Curry Express', 'Indian', '555-0213', '123 Delhi Drive', 'Little India', 360, 300, 4.2, 2.50, 25),
(14, 'Taqueria Maya', 'Mexican', '555-0214', '456 Aztec Ave', 'Mission District', 440, 360, 4.4, 1.75, 22),
(15, 'Bavarian Hof', 'German', '555-0215', '789 Munich Mews', 'Germantown', 420, 380, 4.1, 3.50, 35),
(16, 'Lagos Eats', 'Nigerian', '555-0216', '012 Abuja Alley', 'African Quarter', 450, 290, 4.3, 2.80, 33),
(17, 'Venice Cafe', 'Italian', '555-0217', '345 Florence St', 'Little Italy', 410, 350, 4.7, 2.99, 28),
(18, 'Ramen Bar', 'Japanese', '555-0218', '678 Tokyo Terrace', 'Japantown', 460, 310, 4.8, 3.25, 42),
(19, 'Polish Kitchen', 'Polish', '555-0219', '901 Warsaw Way', 'Polish Hill', 380, 330, 4.0, 2.65, 30),
(20, 'Cairo Palace', 'Egyptian', '555-0220', '234 Nile Street', 'Middle East District', 430, 370, 4.2, 3.10, 35),
(21, 'Spice Market', 'Thai', '555-0221', '567 Bangkok Blvd', 'Thai Town', 470, 350, 4.6, 2.40, 26),
(22, 'Borsch Bar', 'Russian', '555-0222', '890 Moscow Mews', 'Russian Hill', 390, 310, 4.1, 2.85, 31);

INSERT INTO MENU_ITEMS (restaurant_id, name, description, price, category, is_vegetarian) VALUES
-- Pizza Palace (Italian)
(1, 'Margherita Pizza', 'Classic tomato sauce and mozzarella', 12.99, 'main', 1),
(1, 'Pepperoni Pizza', 'Spicy pepperoni with mozzarella', 14.99, 'main', 0),
(1, 'Caesar Salad', 'Fresh romaine with parmesan', 8.99, 'appetizer', 1),
(1, 'Tiramisu', 'Coffee-flavored Italian dessert', 6.99, 'dessert', 1),
-- Dragon Wok (Chinese)
(2, 'Kung Pao Chicken', 'Spicy chicken with peanuts', 13.99, 'main', 0),
(2, 'Vegetable Fried Rice', 'Wok-fried rice with vegetables', 9.99, 'main', 1),
(2, 'Spring Rolls', 'Crispy vegetable spring rolls', 6.99, 'appetizer', 1),
(2, 'Sweet and Sour Pork', 'Tender pork with pineapple', 14.99, 'main', 0),
-- Spice Palace (Indian)
(3, 'Chicken Tikka Masala', 'Creamy tomato curry with chicken', 15.99, 'main', 0),
(3, 'Vegetable Biryani', 'Fragrant rice with mixed vegetables', 12.99, 'main', 1),
(3, 'Samosas', 'Crispy pastries with spiced filling', 5.99, 'appetizer', 1),
(3, 'Mango Lassi', 'Sweet yogurt drink with mango', 3.99, 'drink', 1),
-- Taco Time (Mexican)
(4, 'Beef Tacos', 'Seasoned ground beef tacos', 8.99, 'main', 0),
(4, 'Veggie Burrito', 'Black beans and vegetables', 9.99, 'main', 1),
(4, 'Guacamole & Chips', 'Fresh avocado dip with chips', 4.99, 'appetizer', 1),
(4, 'Churros', 'Cinnamon sugar fried dough', 5.99, 'dessert', 1),
-- Burger Barn (American)
(5, 'Classic Burger', 'Beef patty with lettuce and tomato', 11.99, 'main', 0),
(5, 'Veggie Burger', 'Plant-based patty', 10.99, 'main', 1),
(5, 'Sweet Potato Fries', 'Crispy sweet potato fries', 4.99, 'appetizer', 1),
(5, 'Chocolate Shake', 'Rich chocolate milkshake', 5.99, 'drink', 1),
-- Sushi Zen (Japanese)
(6, 'Salmon Roll', 'Fresh salmon sushi roll', 12.99, 'main', 0),
(6, 'Vegetable Roll', 'Cucumber and avocado roll', 8.99, 'main', 1),
(6, 'Miso Soup', 'Traditional soybean soup', 3.99, 'appetizer', 1),
(6, 'Chicken Teriyaki', 'Grilled chicken with teriyaki sauce', 14.99, 'main', 0),
-- Seoul Kitchen (Korean)
(7, 'Bibimbap', 'Mixed rice bowl with vegetables and beef', 13.99, 'main', 0),
(7, 'Kimchi Fried Rice', 'Spicy fermented cabbage fried rice', 11.99, 'main', 1),
(7, 'Korean BBQ Bulgogi', 'Marinated beef with vegetables', 16.99, 'main', 0),
(7, 'Kimchi Pancake', 'Savory pancake with kimchi', 7.99, 'appetizer', 1),
-- Pho House (Vietnamese)
(8, 'Pho Bo', 'Traditional beef noodle soup', 12.99, 'main', 0),
(8, 'Vegetarian Pho', 'Vegetable broth with tofu and noodles', 11.99, 'main', 1),
(8, 'Fresh Spring Rolls', 'Rice paper rolls with shrimp', 8.99, 'appetizer', 0),
(8, 'Banh Mi', 'Vietnamese sandwich with pork', 9.99, 'main', 0),
-- Olive Tree (Greek)
(9, 'Moussaka', 'Layered eggplant and meat casserole', 14.99, 'main', 0),
(9, 'Greek Salad', 'Tomatoes, olives, and feta cheese', 9.99, 'appetizer', 1),
(9, 'Souvlaki', 'Grilled meat skewers', 13.99, 'main', 0),
(9, 'Hummus & Pita', 'Chickpea dip with warm pita bread', 6.99, 'appetizer', 1),
-- Tropicana Grill (Brazilian)
(10, 'Picanha Steak', 'Grilled Brazilian sirloin', 19.99, 'main', 0),
(10, 'Feijoada', 'Traditional black bean stew', 15.99, 'main', 0),
(10, 'Pao de Acucar', 'Brazilian cheese bread', 5.99, 'appetizer', 1),
(10, 'Caipirinha', 'Brazilian cocktail with cachaca', 7.99, 'drink', 1),
-- Bistro Paris (French)
(11, 'Coq au Vin', 'Chicken braised in red wine', 18.99, 'main', 0),
(11, 'Ratatouille', 'Traditional vegetable stew', 13.99, 'main', 1),
(11, 'French Onion Soup', 'Rich onion soup with gruyere', 8.99, 'appetizer', 1),
(11, 'Creme Brulee', 'Vanilla custard with caramelized sugar', 7.99, 'dessert', 1),
-- Lebanese Delight (Lebanese)
(12, 'Shawarma Plate', 'Marinated lamb with rice', 14.99, 'main', 0),
(12, 'Falafel Wrap', 'Chickpea fritters in pita', 10.99, 'main', 1),
(12, 'Tabbouleh', 'Parsley salad with bulgur', 7.99, 'appetizer', 1),
(12, 'Baklava', 'Sweet pastry with nuts and honey', 5.99, 'dessert', 1),
-- Curry Express (Indian)
(13, 'Butter Chicken', 'Creamy tomato-based chicken curry', 14.99, 'main', 0),
(13, 'Dal Tadka', 'Lentil curry with spices', 10.99, 'main', 1),
(13, 'Naan Bread', 'Traditional Indian flatbread', 3.99, 'appetizer', 1),
(13, 'Gulab Jamun', 'Sweet milk dumplings in syrup', 4.99, 'dessert', 1),
-- Taqueria Maya (Mexican)
(14, 'Carnitas Tacos', 'Slow-cooked pork tacos', 11.99, 'main', 0),
(14, 'Elote', 'Mexican street corn', 5.99, 'appetizer', 1),
(14, 'Pozole', 'Traditional hominy soup', 12.99, 'main', 0),
(14, 'Tres Leches Cake', 'Three-milk sponge cake', 6.99, 'dessert', 1),
-- Bavarian Hof (German)
(15, 'Sauerbraten', 'Marinated roast beef', 16.99, 'main', 0),
(15, 'Schnitzel', 'Breaded cutlet with lemon', 15.99, 'main', 0),
(15, 'Pretzel & Mustard', 'Traditional German pretzel', 4.99, 'appetizer', 1),
(15, 'Black Forest Cake', 'Chocolate cake with cherries', 7.99, 'dessert', 1),
-- Lagos Eats (Nigerian)
(16, 'Jollof Rice', 'Spiced rice with chicken', 13.99, 'main', 0),
(16, 'Plantain & Beans', 'Sweet plantains with black-eyed peas', 9.99, 'main', 1),
(16, 'Suya Skewers', 'Spiced grilled meat', 11.99, 'appetizer', 0),
(16, 'Chin Chin', 'Sweet fried dough cubes', 4.99, 'dessert', 1),
-- Venice Cafe (Italian)
(17, 'Osso Buco', 'Braised veal shanks', 22.99, 'main', 0),
(17, 'Risotto Primavera', 'Creamy rice with spring vegetables', 14.99, 'main', 1),
(17, 'Bruschetta', 'Toasted bread with tomatoes', 7.99, 'appetizer', 1),
(17, 'Gelato', 'Italian ice cream', 5.99, 'dessert', 1),
-- Ramen Bar (Japanese)
(18, 'Tonkotsu Ramen', 'Rich pork bone broth ramen', 15.99, 'main', 0),
(18, 'Vegetable Ramen', 'Miso-based vegetable broth', 13.99, 'main', 1),
(18, 'Gyoza', 'Pan-fried pork dumplings', 8.99, 'appetizer', 0),
(18, 'Mochi Ice Cream', 'Sweet rice cake with ice cream', 6.99, 'dessert', 1),
-- Polish Kitchen (Polish)
(19, 'Pierogi', 'Dumplings with potato and cheese', 11.99, 'main', 1),
(19, 'Kielbasa & Sauerkraut', 'Polish sausage with cabbage', 13.99, 'main', 0),
(19, 'Zurek Soup', 'Sour rye soup with sausage', 9.99, 'appetizer', 0),
(19, 'Sernik', 'Polish cheesecake', 6.99, 'dessert', 1),
-- Cairo Palace (Egyptian)
(20, 'Koshari', 'Mixed rice, lentils, and pasta', 10.99, 'main', 1),
(20, 'Ful Medames', 'Fava beans with vegetables', 8.99, 'main', 1),
(20, 'Baba Ganoush', 'Roasted eggplant dip', 6.99, 'appetizer', 1),
(20, 'Mahalabia', 'Rose water milk pudding', 4.99, 'dessert', 1),
-- Spice Market (Thai)
(21, 'Pad Thai', 'Stir-fried noodles with shrimp', 12.99, 'main', 0),
(21, 'Green Curry Tofu', 'Spicy coconut curry with tofu', 11.99, 'main', 1),
(21, 'Tom Yum Soup', 'Spicy and sour shrimp soup', 8.99, 'appetizer', 0),
(21, 'Mango Sticky Rice', 'Sweet dessert with coconut', 5.99, 'dessert', 1),
-- Borsch Bar (Russian)
(22, 'Beef Stroganoff', 'Creamy beef with mushrooms', 16.99, 'main', 0),
(22, 'Borscht', 'Traditional beet soup', 7.99, 'appetizer', 1),
(22, 'Blini', 'Thin pancakes with sour cream', 6.99, 'appetizer', 1),
(22, 'Syrniki', 'Sweet cottage cheese pancakes', 8.99, 'dessert', 1);

-- Restaurant placement overrides table
CREATE TABLE IF NOT EXISTS RESTAURANT_PLACEMENTS (
    restaurant_id INTEGER PRIMARY KEY,
    x REAL NOT NULL,
    y REAL NOT NULL,
    district TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Distributed restaurant coordinates across the full map (1600x1200)
-- Using a grid distribution to ensure restaurants are spread across all areas
INSERT OR REPLACE INTO RESTAURANT_PLACEMENTS (restaurant_id, x, y, district) VALUES
-- Top row (North)
(1, 200, 150, 'Northwest'),      -- Pizza Palace
(2, 500, 180, 'North'),          -- Dragon Wok  
(3, 800, 160, 'North'),          -- Spice Palace
(4, 1100, 170, 'Northeast'),     -- Taco Time
(5, 1400, 190, 'Northeast'),     -- Burger Barn

-- Upper middle row
(6, 150, 400, 'West'),           -- Sushi Zen
(7, 450, 420, 'Central'),        -- Seoul Kitchen
(8, 750, 380, 'Central'),        -- Pho House
(9, 1050, 410, 'East'),          -- Olive Tree
(10, 1350, 390, 'East'),         -- Tropicana Grill

-- Middle row
(11, 250, 600, 'Central'),       -- Bistro Paris
(12, 550, 580, 'Central'),       -- Lebanese Delight
(13, 850, 620, 'Central'),       -- Curry Express
(14, 1150, 590, 'East'),         -- Taqueria Maya
(15, 1450, 610, 'Southeast'),    -- Bavarian Hof

-- Lower middle row
(16, 180, 800, 'Southwest'),     -- Lagos Eats
(17, 480, 820, 'Central'),       -- Venice Cafe
(18, 780, 780, 'Central'),       -- Ramen Bar
(19, 1080, 810, 'East'),         -- Polish Kitchen
(20, 1380, 790, 'Southeast'),    -- Cairo Palace

-- Bottom row (South)
(21, 300, 1000, 'South'),        -- Spice Market
(22, 600, 1020, 'South');        -- Borsch Bar