
# Food Detective Game

A JavaScript-based narrative mystery game where you play as a detective investigating the disappearance of a food critic in a bustling food district.

## 🎮 Game Overview

Explore a town map filled with restaurants, talk to owners and customers, collect clues, and piece together the mystery of what happened to the missing food critic. The game features:

- **Narrative-driven gameplay** with dialog-based investigations
- **SVG-based graphics** for clean, scalable visuals
- **Restaurant exploration** across 6 different cuisine types
- **Clue collection system** with an investigation notebook
- **Real-time movement** with WASD/arrow key controls

## 🚀 How to Run

### Prerequisites
- Node.js (v16 or higher)
- npm

### Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open browser to http://localhost:5173
```

### Production Build
```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 🕹️ Controls

| Key | Action |
|-----|--------|
| **WASD** / **Arrow Keys** | Move player around the map |
| **Click** / **Space** | Interact with restaurants and NPCs |
| **I** | Open/Close Investigation Notebook |
| **H** | Open/Close Help menu |
| **ESC** | Close dialogs and menus |

## 🎯 How to Play

1. **Move Around** - Use WASD or arrow keys to explore the town
2. **Visit Restaurants** - Click on restaurant buildings or get close and press Space
3. **Talk to People** - Each restaurant owner and customer has unique information
4. **Collect Clues** - Important information gets added to your Investigation Notebook
5. **Review Progress** - Press 'I' to check your clues and piece together the mystery
6. **Solve the Case** - Use the information you've gathered to understand what happened

## 🏗️ Technical Architecture

### Core Technologies
- **React** - UI components and state management
- **PIXI.js** - 2D game rendering and sprite management
- **SQL.js** - Client-side SQLite database for game data
- **Zustand** - Lightweight state management
- **Vite** - Build tool and development server

### File Structure
```
src/
├── App.jsx              # Main React application
├── main.jsx             # Application entry point
├── engine/
│   └── scenes.js        # Scene management and initialization
├── render/
│   └── pixiApp.js       # PIXI.js renderer and game loop
├── systems/
│   ├── identity.js      # Game state management
│   └── dialogManager.js # Dialog and narrative system
├── ui/                  # React UI components
│   ├── DialogBox.jsx    # Conversation interface
│   ├── InventoryPanel.jsx # Investigation notebook
│   ├── HUD.jsx          # Game HUD
│   ├── LoadingScreen.jsx # Loading interface
│   └── ControlsHelp.jsx # Help menu
└── data/
    └── sqlite.js        # Database management
```

This is a narrative-focused detective game that emphasizes story over mechanics, with simple controls and an approachable interface suitable for players of all skill levels.
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
