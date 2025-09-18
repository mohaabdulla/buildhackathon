
## Global Fields

```SQL
    is_active BOOLEAN DEFAULT 1
```

Enables soft deletion to maintain data integrity and order history.

```SQL
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

Standard audit fields for tracking record creation and modifications.

## 1) Users Table

```SQL
CREATE TABLE IF NOT EXISTS USERS (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    phone TEXT NOT NULL,
    role TEXT CHECK(role IN ('customer', 'restaurant_owner', 'driver')) NOT NULL DEFAULT 'customer',
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

- **Three user roles**: Customers, restaurant owners, and drivers
- **Phone required**: Essential for delivery coordination
- **Simple profile**: Basic contact information only
- **Email authentication**: Primary login method

## 2) Restaurants Table

```SQL
CREATE TABLE IF NOT EXISTS RESTAURANTS (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    cuisine_type TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    rating DECIMAL(3,2) DEFAULT 0,
    delivery_fee DECIMAL(8,2) DEFAULT 0,
    delivery_time_estimate INTEGER DEFAULT 30,
    is_open BOOLEAN DEFAULT 1,
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES USERS(id)
);
```

- **Essential restaurant info**: Name, cuisine type, contact, and location
- **Simple address**: Single address field instead of complex breakdown
- **Basic business rules**: Delivery fee and estimated time
- **Restaurant status as boolean**: `is_open` field where `1 = open`, `0 = closed`
- **Rating system**: Average customer rating (calculated from reviews)

## 3) Menu Items Table

```SQL
CREATE TABLE IF NOT EXISTS MENU_ITEMS (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    restaurant_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(8,2) NOT NULL,
    category TEXT NOT NULL,
    is_vegetarian BOOLEAN DEFAULT 0,
    is_available BOOLEAN DEFAULT 1,
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurant_id) REFERENCES RESTAURANTS(id)
);
```

- **Simplified categories**: Text field instead of separate table ('appetizer', 'main', 'dessert', 'drink')
- **Essential item info**: Name, description, price, and category
- **Basic dietary info**: Vegetarian flag only
- **Availability control**: Items can be temporarily unavailable
- **No complex features**: Removed calories, images, preparation time

## 4) Orders Table

```SQL
CREATE TABLE IF NOT EXISTS ORDERS (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    restaurant_id INTEGER NOT NULL,
    driver_id INTEGER,
    delivery_address TEXT NOT NULL,
    order_number TEXT UNIQUE NOT NULL,
    status TEXT CHECK(status IN ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled')) DEFAULT 'pending',
    subtotal DECIMAL(10,2) NOT NULL,
    delivery_fee DECIMAL(8,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    is_credit_card BOOLEAN NOT NULL DEFAULT 1,
    payment_status TEXT CHECK(payment_status IN ('pending', 'paid', 'failed')) DEFAULT 'pending',
    special_instructions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES USERS(id),
    FOREIGN KEY (restaurant_id) REFERENCES RESTAURANTS(id),
    FOREIGN KEY (driver_id) REFERENCES USERS(id)
);
```

- **Essential order tracking**: Key status points from pending to delivered
- **Simple pricing**: Subtotal, delivery fee, and total (no tax or tip complexity)
- **Payment method as boolean**: `is_credit_card` field where `1 = credit card`, `0 = cash`
- **Delivery address**: Simple text field instead of complex address table
- **Driver assignment**: Optional driver for delivery tracking

## 5) Order Items Table

```SQL
CREATE TABLE IF NOT EXISTS ORDER_ITEMS (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    menu_item_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(8,2) NOT NULL,
    total_price DECIMAL(8,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES ORDERS(id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES MENU_ITEMS(id)
);
```

- **Order composition**: Items and quantities
- **Price preservation**: Historical pricing
- **Simplified structure**: No special instructions per item
- **Cascading deletion**: Items removed when order is deleted

## 6) Reviews Table

```SQL
CREATE TABLE IF NOT EXISTS REVIEWS (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    customer_id INTEGER NOT NULL,
    restaurant_id INTEGER NOT NULL,
    rating INTEGER CHECK(rating BETWEEN 1 AND 5) NOT NULL,
    review_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES ORDERS(id),
    FOREIGN KEY (customer_id) REFERENCES USERS(id),
    FOREIGN KEY (restaurant_id) REFERENCES RESTAURANTS(id)
);
```

- **Simple rating system**: Single 1-5 star rating for restaurants only
- **Order-based reviews**: One review per completed order
- **Optional text**: Written feedback is optional
- **No driver ratings**: Simplified to restaurant reviews only

### Boolean Field Conventions

For fields with only two possible values, we use boolean fields for better performance and simpler queries:

- **`is_open`**: `1` for open restaurants, `0` for closed restaurants
  - Query open restaurants: `WHERE is_open = 1`
  - Query closed restaurants: `WHERE is_open = 0`
  - Faster filtering for customer browsing
  - Real-time restaurant availability

- **`is_credit_card`**: `1` for credit card payments, `0` for cash payments
  - Query credit card orders: `WHERE is_credit_card = 1`
  - Query cash orders: `WHERE is_credit_card = 0`
  - More efficient than string comparisons
  - Uses less storage space
  - Eliminates typos in payment method values
  - Simpler payment processing logic


## Performance Indexes

Optimized for core food delivery operations:

- **`idx_users_email`**: Fast user authentication
- **`idx_users_role`**: Filter by user type
- **`idx_restaurants_owner`**: Restaurant management
- **`idx_restaurants_cuisine`**: Cuisine filtering
- **`idx_menu_items_restaurant`**: Menu loading
- **`idx_orders_customer`**: Customer order history
- **`idx_orders_restaurant`**: Restaurant order management
- **`idx_orders_status`**: Status filtering
- **`idx_order_items_order`**: Order details
- **`idx_reviews_restaurant`**: Restaurant ratings
