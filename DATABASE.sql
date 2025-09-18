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