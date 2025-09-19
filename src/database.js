// Database.js - Simulates the food delivery database with sample data
class Database {
    constructor() {
        this.initializeData();
    }

    initializeData() {
        // Users table data
        this.users = [
            // Customers who forgot their food preferences
            { id: 1, first_name: "Alice", last_name: "Johnson", email: "alice@email.com", role: "customer", is_active: true },
            { id: 2, first_name: "Bob", last_name: "Smith", email: "bob@email.com", role: "customer", is_active: true },
            { id: 3, first_name: "Carol", last_name: "Davis", email: "carol@email.com", role: "customer", is_active: true },
            { id: 4, first_name: "David", last_name: "Wilson", email: "david@email.com", role: "customer", is_active: true },
            { id: 5, first_name: "Eve", last_name: "Brown", email: "eve@email.com", role: "customer", is_active: true },

            // Restaurant owners
            { id: 6, first_name: "Giuseppe", last_name: "Romano", email: "giuseppe@mamiamias.com", role: "restaurant_owner", is_active: true },
            { id: 7, first_name: "Chen", last_name: "Wei", email: "chen@goldendragon.com", role: "restaurant_owner", is_active: true },
            { id: 8, first_name: "Carlos", last_name: "Rodriguez", email: "carlos@elsombrero.com", role: "restaurant_owner", is_active: true },
            { id: 9, first_name: "Jake", last_name: "Miller", email: "jake@burgerpalace.com", role: "restaurant_owner", is_active: true },
            { id: 10, first_name: "Priya", last_name: "Sharma", email: "priya@spicegarden.com", role: "restaurant_owner", is_active: true },
            // New restaurant owners for expanded gameplay
            { id: 11, first_name: "Kim", last_name: "Soo-jin", email: "kim@seoulkitchen.com", role: "restaurant_owner", is_active: true },
            { id: 12, first_name: "Nguyen", last_name: "Linh", email: "linh@phohouse.com", role: "restaurant_owner", is_active: true },
            { id: 13, first_name: "Dimitris", last_name: "Kostas", email: "dimitris@olivetree.com", role: "restaurant_owner", is_active: true },
            { id: 14, first_name: "Maria", last_name: "Santos", email: "maria@tropicana.com", role: "restaurant_owner", is_active: true },
            { id: 15, first_name: "Pierre", last_name: "Dubois", email: "pierre@bistroparis.com", role: "restaurant_owner", is_active: true },
            { id: 16, first_name: "Fatima", last_name: "Al-Zahra", email: "fatima@lebanesedelight.com", role: "restaurant_owner", is_active: true },
            { id: 17, first_name: "Raj", last_name: "Patel", email: "raj@curryexpress.com", role: "restaurant_owner", is_active: true },
            { id: 18, first_name: "Carlos", last_name: "Mendoza", email: "carlos@taqueriamaya.com", role: "restaurant_owner", is_active: true },
            { id: 19, first_name: "Hans", last_name: "Mueller", email: "hans@bavarianhof.com", role: "restaurant_owner", is_active: true },
            { id: 20, first_name: "Amara", last_name: "Okafor", email: "amara@lagoseats.com", role: "restaurant_owner", is_active: true },
            { id: 21, first_name: "Isabella", last_name: "Rossi", email: "isabella@venicecafe.com", role: "restaurant_owner", is_active: true },
            { id: 22, first_name: "Hiroshi", last_name: "Nakamura", email: "hiroshi@ramenbar.com", role: "restaurant_owner", is_active: true },
            { id: 23, first_name: "Anna", last_name: "Kowalski", email: "anna@polishkitchen.com", role: "restaurant_owner", is_active: true },
            { id: 24, first_name: "Omar", last_name: "El-Hassan", email: "omar@cairopalace.com", role: "restaurant_owner", is_active: true },
            { id: 25, first_name: "Siriporn", last_name: "Thanakit", email: "siriporn@spicemarket.com", role: "restaurant_owner", is_active: true },
            { id: 26, first_name: "Alex", last_name: "Petrov", email: "alex@borschbar.com", role: "restaurant_owner", is_active: true },

            // Drivers
            { id: 11, first_name: "Mike", last_name: "Taylor", email: "mike@delivery.com", role: "driver", is_active: true },
            { id: 12, first_name: "Sarah", last_name: "Anderson", email: "sarah@delivery.com", role: "driver", is_active: true }
        ];

        // Restaurants table data
        this.restaurants = [
            // Original restaurants
            { id: 1, owner_id: 6, name: "Mama Mia's Italian", cuisine_type: "italian", phone: "555-0101", address: "123 Little Italy St", city: "Foodtown", rating: 4.8, delivery_fee: 2.99, delivery_time_estimate: 35, is_open: true, is_active: true },
            { id: 2, owner_id: 7, name: "Golden Dragon", cuisine_type: "chinese", phone: "555-0102", address: "456 Chinatown Ave", city: "Foodtown", rating: 4.6, delivery_fee: 1.99, delivery_time_estimate: 25, is_open: true, is_active: true },
            { id: 3, owner_id: 8, name: "El Sombrero", cuisine_type: "mexican", phone: "555-0103", address: "789 Cinco de Mayo Blvd", city: "Foodtown", rating: 4.7, delivery_fee: 2.49, delivery_time_estimate: 30, is_open: true, is_active: true },
            { id: 4, owner_id: 9, name: "Burger Palace", cuisine_type: "american", phone: "555-0104", address: "321 Main Street", city: "Foodtown", rating: 4.3, delivery_fee: 1.49, delivery_time_estimate: 20, is_open: true, is_active: true },
            { id: 5, owner_id: 10, name: "Spice Garden", cuisine_type: "indian", phone: "555-0105", address: "654 Curry Lane", city: "Foodtown", rating: 4.9, delivery_fee: 3.49, delivery_time_estimate: 40, is_open: true, is_active: true },
            // New restaurants for increased difficulty
            { id: 6, owner_id: 11, name: "Seoul Kitchen", cuisine_type: "korean", phone: "555-0106", address: "234 Kimchi Lane", city: "Foodtown", rating: 4.6, delivery_fee: 2.75, delivery_time_estimate: 35, is_open: true, is_active: true },
            { id: 7, owner_id: 12, name: "Pho House", cuisine_type: "vietnamese", phone: "555-0107", address: "567 Saigon St", city: "Foodtown", rating: 4.4, delivery_fee: 2.25, delivery_time_estimate: 28, is_open: true, is_active: true },
            { id: 8, owner_id: 13, name: "Olive Tree", cuisine_type: "greek", phone: "555-0108", address: "890 Athens Ave", city: "Foodtown", rating: 4.3, delivery_fee: 3.25, delivery_time_estimate: 32, is_open: true, is_active: true },
            { id: 9, owner_id: 14, name: "Tropicana Grill", cuisine_type: "brazilian", phone: "555-0109", address: "345 Rio Road", city: "Foodtown", rating: 4.5, delivery_fee: 3.75, delivery_time_estimate: 38, is_open: true, is_active: true },
            { id: 10, owner_id: 15, name: "Bistro Paris", cuisine_type: "french", phone: "555-0110", address: "678 Champs St", city: "Foodtown", rating: 4.9, delivery_fee: 4.25, delivery_time_estimate: 45, is_open: true, is_active: true },
            { id: 11, owner_id: 16, name: "Lebanese Delight", cuisine_type: "lebanese", phone: "555-0111", address: "901 Beirut Blvd", city: "Foodtown", rating: 4.6, delivery_fee: 2.95, delivery_time_estimate: 30, is_open: true, is_active: true },
            { id: 12, owner_id: 17, name: "Curry Express", cuisine_type: "indian", phone: "555-0112", address: "123 Delhi Drive", city: "Foodtown", rating: 4.2, delivery_fee: 2.50, delivery_time_estimate: 25, is_open: true, is_active: true },
            { id: 13, owner_id: 18, name: "Taqueria Maya", cuisine_type: "mexican", phone: "555-0113", address: "456 Aztec Ave", city: "Foodtown", rating: 4.4, delivery_fee: 1.75, delivery_time_estimate: 22, is_open: true, is_active: true },
            { id: 14, owner_id: 19, name: "Bavarian Hof", cuisine_type: "german", phone: "555-0114", address: "789 Munich Mews", city: "Foodtown", rating: 4.1, delivery_fee: 3.50, delivery_time_estimate: 35, is_open: true, is_active: true },
            { id: 15, owner_id: 20, name: "Lagos Eats", cuisine_type: "nigerian", phone: "555-0115", address: "012 Abuja Alley", city: "Foodtown", rating: 4.3, delivery_fee: 2.80, delivery_time_estimate: 33, is_open: true, is_active: true },
            { id: 16, owner_id: 21, name: "Venice Cafe", cuisine_type: "italian", phone: "555-0116", address: "345 Florence St", city: "Foodtown", rating: 4.7, delivery_fee: 2.99, delivery_time_estimate: 28, is_open: true, is_active: true },
            { id: 17, owner_id: 22, name: "Ramen Bar", cuisine_type: "japanese", phone: "555-0117", address: "678 Tokyo Terrace", city: "Foodtown", rating: 4.8, delivery_fee: 3.25, delivery_time_estimate: 42, is_open: true, is_active: true },
            { id: 18, owner_id: 23, name: "Polish Kitchen", cuisine_type: "polish", phone: "555-0118", address: "901 Warsaw Way", city: "Foodtown", rating: 4.0, delivery_fee: 2.65, delivery_time_estimate: 30, is_open: true, is_active: true },
            { id: 19, owner_id: 24, name: "Cairo Palace", cuisine_type: "egyptian", phone: "555-0119", address: "234 Nile Street", city: "Foodtown", rating: 4.2, delivery_fee: 3.10, delivery_time_estimate: 35, is_open: true, is_active: true },
            { id: 20, owner_id: 25, name: "Spice Market", cuisine_type: "thai", phone: "555-0120", address: "567 Bangkok Blvd", city: "Foodtown", rating: 4.6, delivery_fee: 2.40, delivery_time_estimate: 26, is_open: true, is_active: true },
            { id: 21, owner_id: 26, name: "Borsch Bar", cuisine_type: "russian", phone: "555-0121", address: "890 Moscow Mews", city: "Foodtown", rating: 4.1, delivery_fee: 2.85, delivery_time_estimate: 31, is_open: true, is_active: true }
        ];

        // Menu items table data - Expanded for increased game difficulty
        this.menu_items = [
            // Italian Restaurant Items (Mama Mia's Italian)
            { id: 1, restaurant_id: 1, name: "Margherita Pizza", description: "Classic tomato, mozzarella, and basil pizza", price: 14.99, category: "main", is_vegetarian: true, is_available: true },
            { id: 2, restaurant_id: 1, name: "Spaghetti Carbonara", description: "Creamy pasta with eggs, cheese, and pancetta", price: 16.99, category: "main", is_vegetarian: false, is_available: true },
            { id: 3, restaurant_id: 1, name: "Caesar Salad", description: "Crisp romaine with parmesan and croutons", price: 9.99, category: "appetizer", is_vegetarian: true, is_available: true },
            { id: 4, restaurant_id: 1, name: "Tiramisu", description: "Classic Italian coffee-flavored dessert", price: 6.99, category: "dessert", is_vegetarian: true, is_available: true },

            // Chinese Restaurant Items (Golden Dragon)
            { id: 5, restaurant_id: 2, name: "Sweet and Sour Pork", description: "Tender pork with pineapple and bell peppers", price: 13.99, category: "main", is_vegetarian: false, is_available: true },
            { id: 6, restaurant_id: 2, name: "Kung Pao Chicken", description: "Spicy diced chicken with peanuts and vegetables", price: 12.99, category: "main", is_vegetarian: false, is_available: true },
            { id: 7, restaurant_id: 2, name: "Vegetable Spring Rolls", description: "Crispy rolls filled with fresh vegetables", price: 7.99, category: "appetizer", is_vegetarian: true, is_available: true },
            { id: 8, restaurant_id: 2, name: "Fried Rice", description: "Wok-fried rice with vegetables and egg", price: 8.99, category: "main", is_vegetarian: true, is_available: true },

            // Mexican Restaurant Items (El Sombrero)
            { id: 9, restaurant_id: 3, name: "Chicken Burrito", description: "Grilled chicken with rice, beans, and salsa", price: 11.99, category: "main", is_vegetarian: false, is_available: true },
            { id: 10, restaurant_id: 3, name: "Beef Tacos", description: "Three soft tacos with seasoned ground beef", price: 10.99, category: "main", is_vegetarian: false, is_available: true },
            { id: 11, restaurant_id: 3, name: "Guacamole and Chips", description: "Fresh guacamole with tortilla chips", price: 6.99, category: "appetizer", is_vegetarian: true, is_available: true },
            { id: 12, restaurant_id: 3, name: "Churros", description: "Crispy fried dough with cinnamon sugar", price: 5.99, category: "dessert", is_vegetarian: true, is_available: true },

            // American Restaurant Items (Burger Palace)
            { id: 13, restaurant_id: 4, name: "Classic Cheeseburger", description: "Beef patty with cheese, lettuce, tomato", price: 12.99, category: "main", is_vegetarian: false, is_available: true },
            { id: 14, restaurant_id: 4, name: "Buffalo Wings", description: "Spicy chicken wings with blue cheese dip", price: 9.99, category: "appetizer", is_vegetarian: false, is_available: true },
            { id: 15, restaurant_id: 4, name: "French Fries", description: "Golden crispy potato fries", price: 4.99, category: "appetizer", is_vegetarian: true, is_available: true },
            { id: 16, restaurant_id: 4, name: "Chocolate Milkshake", description: "Rich chocolate ice cream milkshake", price: 5.99, category: "drink", is_vegetarian: true, is_available: true },

            // Indian Restaurant Items (Spice Garden)
            { id: 17, restaurant_id: 5, name: "Chicken Tikka Masala", description: "Tender chicken in creamy tomato curry", price: 15.99, category: "main", is_vegetarian: false, is_available: true },
            { id: 18, restaurant_id: 5, name: "Vegetable Biryani", description: "Aromatic rice with mixed vegetables and spices", price: 13.99, category: "main", is_vegetarian: true, is_available: true },
            { id: 19, restaurant_id: 5, name: "Samosas", description: "Crispy pastries filled with spiced potatoes", price: 6.99, category: "appetizer", is_vegetarian: true, is_available: true },
            { id: 20, restaurant_id: 5, name: "Mango Lassi", description: "Sweet yogurt drink with mango", price: 3.99, category: "drink", is_vegetarian: true, is_available: true },

            // Korean Restaurant Items (Seoul Kitchen)
            { id: 21, restaurant_id: 6, name: "Bibimbap", description: "Mixed rice bowl with vegetables and beef", price: 13.99, category: "main", is_vegetarian: false, is_available: true },
            { id: 22, restaurant_id: 6, name: "Kimchi Fried Rice", description: "Spicy fermented cabbage fried rice", price: 11.99, category: "main", is_vegetarian: true, is_available: true },
            { id: 23, restaurant_id: 6, name: "Korean BBQ Bulgogi", description: "Marinated beef with vegetables", price: 16.99, category: "main", is_vegetarian: false, is_available: true },
            { id: 24, restaurant_id: 6, name: "Kimchi Pancake", description: "Savory pancake with kimchi", price: 7.99, category: "appetizer", is_vegetarian: true, is_available: true },

            // Vietnamese Restaurant Items (Pho House)
            { id: 25, restaurant_id: 7, name: "Pho Bo", description: "Traditional beef noodle soup", price: 12.99, category: "main", is_vegetarian: false, is_available: true },
            { id: 26, restaurant_id: 7, name: "Vegetarian Pho", description: "Vegetable broth with tofu and noodles", price: 11.99, category: "main", is_vegetarian: true, is_available: true },
            { id: 27, restaurant_id: 7, name: "Fresh Spring Rolls", description: "Rice paper rolls with shrimp", price: 8.99, category: "appetizer", is_vegetarian: false, is_available: true },
            { id: 28, restaurant_id: 7, name: "Banh Mi", description: "Vietnamese sandwich with pork", price: 9.99, category: "main", is_vegetarian: false, is_available: true },

            // Greek Restaurant Items (Olive Tree)
            { id: 29, restaurant_id: 8, name: "Moussaka", description: "Layered eggplant and meat casserole", price: 14.99, category: "main", is_vegetarian: false, is_available: true },
            { id: 30, restaurant_id: 8, name: "Greek Salad", description: "Tomatoes, olives, and feta cheese", price: 9.99, category: "appetizer", is_vegetarian: true, is_available: true },
            { id: 31, restaurant_id: 8, name: "Souvlaki", description: "Grilled meat skewers", price: 13.99, category: "main", is_vegetarian: false, is_available: true },
            { id: 32, restaurant_id: 8, name: "Hummus & Pita", description: "Chickpea dip with warm pita bread", price: 6.99, category: "appetizer", is_vegetarian: true, is_available: true },

            // Brazilian Restaurant Items (Tropicana Grill)
            { id: 33, restaurant_id: 9, name: "Picanha Steak", description: "Grilled Brazilian sirloin", price: 19.99, category: "main", is_vegetarian: false, is_available: true },
            { id: 34, restaurant_id: 9, name: "Feijoada", description: "Traditional black bean stew", price: 15.99, category: "main", is_vegetarian: false, is_available: true },
            { id: 35, restaurant_id: 9, name: "Pao de Acucar", description: "Brazilian cheese bread", price: 5.99, category: "appetizer", is_vegetarian: true, is_available: true },
            { id: 36, restaurant_id: 9, name: "Caipirinha", description: "Brazilian cocktail with cachaca", price: 7.99, category: "drink", is_vegetarian: true, is_available: true },

            // French Restaurant Items (Bistro Paris)
            { id: 37, restaurant_id: 10, name: "Coq au Vin", description: "Chicken braised in red wine", price: 18.99, category: "main", is_vegetarian: false, is_available: true },
            { id: 38, restaurant_id: 10, name: "Ratatouille", description: "Traditional vegetable stew", price: 13.99, category: "main", is_vegetarian: true, is_available: true },
            { id: 39, restaurant_id: 10, name: "French Onion Soup", description: "Rich onion soup with gruyere", price: 8.99, category: "appetizer", is_vegetarian: true, is_available: true },
            { id: 40, restaurant_id: 10, name: "Creme Brulee", description: "Vanilla custard with caramelized sugar", price: 7.99, category: "dessert", is_vegetarian: true, is_available: true },

            // Lebanese Restaurant Items (Lebanese Delight)
            { id: 41, restaurant_id: 11, name: "Shawarma Plate", description: "Marinated lamb with rice", price: 14.99, category: "main", is_vegetarian: false, is_available: true },
            { id: 42, restaurant_id: 11, name: "Falafel Wrap", description: "Chickpea fritters in pita", price: 10.99, category: "main", is_vegetarian: true, is_available: true },
            { id: 43, restaurant_id: 11, name: "Tabbouleh", description: "Parsley salad with bulgur", price: 7.99, category: "appetizer", is_vegetarian: true, is_available: true },
            { id: 44, restaurant_id: 11, name: "Baklava", description: "Sweet pastry with nuts and honey", price: 5.99, category: "dessert", is_vegetarian: true, is_available: true },

            // Second Indian Restaurant Items (Curry Express)
            { id: 45, restaurant_id: 12, name: "Butter Chicken", description: "Creamy tomato-based chicken curry", price: 14.99, category: "main", is_vegetarian: false, is_available: true },
            { id: 46, restaurant_id: 12, name: "Dal Tadka", description: "Lentil curry with spices", price: 10.99, category: "main", is_vegetarian: true, is_available: true },
            { id: 47, restaurant_id: 12, name: "Naan Bread", description: "Traditional Indian flatbread", price: 3.99, category: "appetizer", is_vegetarian: true, is_available: true },
            { id: 48, restaurant_id: 12, name: "Gulab Jamun", description: "Sweet milk dumplings in syrup", price: 4.99, category: "dessert", is_vegetarian: true, is_available: true },

            // Second Mexican Restaurant Items (Taqueria Maya)
            { id: 49, restaurant_id: 13, name: "Carnitas Tacos", description: "Slow-cooked pork tacos", price: 11.99, category: "main", is_vegetarian: false, is_available: true },
            { id: 50, restaurant_id: 13, name: "Elote", description: "Mexican street corn", price: 5.99, category: "appetizer", is_vegetarian: true, is_available: true },
            { id: 51, restaurant_id: 13, name: "Pozole", description: "Traditional hominy soup", price: 12.99, category: "main", is_vegetarian: false, is_available: true },
            { id: 52, restaurant_id: 13, name: "Tres Leches Cake", description: "Three-milk sponge cake", price: 6.99, category: "dessert", is_vegetarian: true, is_available: true },

            // German Restaurant Items (Bavarian Hof)
            { id: 53, restaurant_id: 14, name: "Sauerbraten", description: "Marinated roast beef", price: 16.99, category: "main", is_vegetarian: false, is_available: true },
            { id: 54, restaurant_id: 14, name: "Schnitzel", description: "Breaded cutlet with lemon", price: 15.99, category: "main", is_vegetarian: false, is_available: true },
            { id: 55, restaurant_id: 14, name: "Pretzel & Mustard", description: "Traditional German pretzel", price: 4.99, category: "appetizer", is_vegetarian: true, is_available: true },
            { id: 56, restaurant_id: 14, name: "Black Forest Cake", description: "Chocolate cake with cherries", price: 7.99, category: "dessert", is_vegetarian: true, is_available: true },

            // Nigerian Restaurant Items (Lagos Eats)
            { id: 57, restaurant_id: 15, name: "Jollof Rice", description: "Spiced rice with chicken", price: 13.99, category: "main", is_vegetarian: false, is_available: true },
            { id: 58, restaurant_id: 15, name: "Plantain & Beans", description: "Sweet plantains with black-eyed peas", price: 9.99, category: "main", is_vegetarian: true, is_available: true },
            { id: 59, restaurant_id: 15, name: "Suya Skewers", description: "Spiced grilled meat", price: 11.99, category: "appetizer", is_vegetarian: false, is_available: true },
            { id: 60, restaurant_id: 15, name: "Chin Chin", description: "Sweet fried dough cubes", price: 4.99, category: "dessert", is_vegetarian: true, is_available: true },

            // Second Italian Restaurant Items (Venice Cafe)
            { id: 61, restaurant_id: 16, name: "Osso Buco", description: "Braised veal shanks", price: 22.99, category: "main", is_vegetarian: false, is_available: true },
            { id: 62, restaurant_id: 16, name: "Risotto Primavera", description: "Creamy rice with spring vegetables", price: 14.99, category: "main", is_vegetarian: true, is_available: true },
            { id: 63, restaurant_id: 16, name: "Bruschetta", description: "Toasted bread with tomatoes", price: 7.99, category: "appetizer", is_vegetarian: true, is_available: true },
            { id: 64, restaurant_id: 16, name: "Gelato", description: "Italian ice cream", price: 5.99, category: "dessert", is_vegetarian: true, is_available: true },

            // Japanese Restaurant Items (Ramen Bar)
            { id: 65, restaurant_id: 17, name: "Tonkotsu Ramen", description: "Rich pork bone broth ramen", price: 15.99, category: "main", is_vegetarian: false, is_available: true },
            { id: 66, restaurant_id: 17, name: "Vegetable Ramen", description: "Miso-based vegetable broth", price: 13.99, category: "main", is_vegetarian: true, is_available: true },
            { id: 67, restaurant_id: 17, name: "Gyoza", description: "Pan-fried pork dumplings", price: 8.99, category: "appetizer", is_vegetarian: false, is_available: true },
            { id: 68, restaurant_id: 17, name: "Mochi Ice Cream", description: "Sweet rice cake with ice cream", price: 6.99, category: "dessert", is_vegetarian: true, is_available: true },

            // Polish Restaurant Items (Polish Kitchen)
            { id: 69, restaurant_id: 18, name: "Pierogi", description: "Dumplings with potato and cheese", price: 11.99, category: "main", is_vegetarian: true, is_available: true },
            { id: 70, restaurant_id: 18, name: "Kielbasa & Sauerkraut", description: "Polish sausage with cabbage", price: 13.99, category: "main", is_vegetarian: false, is_available: true },
            { id: 71, restaurant_id: 18, name: "Zurek Soup", description: "Sour rye soup with sausage", price: 9.99, category: "appetizer", is_vegetarian: false, is_available: true },
            { id: 72, restaurant_id: 18, name: "Sernik", description: "Polish cheesecake", price: 6.99, category: "dessert", is_vegetarian: true, is_available: true },

            // Egyptian Restaurant Items (Cairo Palace)
            { id: 73, restaurant_id: 19, name: "Koshari", description: "Mixed rice, lentils, and pasta", price: 10.99, category: "main", is_vegetarian: true, is_available: true },
            { id: 74, restaurant_id: 19, name: "Ful Medames", description: "Fava beans with vegetables", price: 8.99, category: "main", is_vegetarian: true, is_available: true },
            { id: 75, restaurant_id: 19, name: "Baba Ganoush", description: "Roasted eggplant dip", price: 6.99, category: "appetizer", is_vegetarian: true, is_available: true },
            { id: 76, restaurant_id: 19, name: "Mahalabia", description: "Rose water milk pudding", price: 4.99, category: "dessert", is_vegetarian: true, is_available: true },

            // Thai Restaurant Items (Spice Market)
            { id: 77, restaurant_id: 20, name: "Pad Thai", description: "Stir-fried noodles with shrimp", price: 12.99, category: "main", is_vegetarian: false, is_available: true },
            { id: 78, restaurant_id: 20, name: "Green Curry Tofu", description: "Spicy coconut curry with tofu", price: 11.99, category: "main", is_vegetarian: true, is_available: true },
            { id: 79, restaurant_id: 20, name: "Tom Yum Soup", description: "Spicy and sour shrimp soup", price: 8.99, category: "appetizer", is_vegetarian: false, is_available: true },
            { id: 80, restaurant_id: 20, name: "Mango Sticky Rice", description: "Sweet dessert with coconut", price: 5.99, category: "dessert", is_vegetarian: true, is_available: true },

            // Russian Restaurant Items (Borsch Bar)
            { id: 81, restaurant_id: 21, name: "Beef Stroganoff", description: "Creamy beef with mushrooms", price: 16.99, category: "main", is_vegetarian: false, is_available: true },
            { id: 82, restaurant_id: 21, name: "Borscht", description: "Traditional beet soup", price: 7.99, category: "appetizer", is_vegetarian: true, is_available: true },
            { id: 83, restaurant_id: 21, name: "Blini", description: "Thin pancakes with sour cream", price: 6.99, category: "appetizer", is_vegetarian: true, is_available: true },
            { id: 84, restaurant_id: 21, name: "Syrniki", description: "Sweet cottage cheese pancakes", price: 8.99, category: "dessert", is_vegetarian: true, is_available: true }
        ];

        // Orders table data (Historical orders before the amnesia)
        this.orders = [
            // Alice's order history - seems to love Italian food
            { id: 1, customer_id: 1, restaurant_id: 1, driver_id: 11, delivery_address: "100 Oak St", order_number: "ORD001", status: "delivered", subtotal: 23.98, delivery_fee: 2.99, total_amount: 26.97, payment_status: "paid" },
            { id: 2, customer_id: 1, restaurant_id: 1, driver_id: 12, delivery_address: "100 Oak St", order_number: "ORD002", status: "delivered", subtotal: 14.99, delivery_fee: 2.99, total_amount: 17.98, payment_status: "paid" },
            { id: 3, customer_id: 1, restaurant_id: 1, driver_id: 11, delivery_address: "100 Oak St", order_number: "ORD003", status: "delivered", subtotal: 31.97, delivery_fee: 2.99, total_amount: 34.96, payment_status: "paid" },

            // Bob's order history - loves Chinese and Mexican
            { id: 4, customer_id: 2, restaurant_id: 2, driver_id: 12, delivery_address: "200 Pine Ave", order_number: "ORD004", status: "delivered", subtotal: 20.98, delivery_fee: 1.99, total_amount: 22.97, payment_status: "paid" },
            { id: 5, customer_id: 2, restaurant_id: 3, driver_id: 11, delivery_address: "200 Pine Ave", order_number: "ORD005", status: "delivered", subtotal: 17.98, delivery_fee: 2.49, total_amount: 20.47, payment_status: "paid" },
            { id: 6, customer_id: 2, restaurant_id: 2, driver_id: 12, delivery_address: "200 Pine Ave", order_number: "ORD006", status: "delivered", subtotal: 12.99, delivery_fee: 1.99, total_amount: 14.98, payment_status: "paid" },

            // Carol's order history - American food fan
            { id: 7, customer_id: 3, restaurant_id: 4, driver_id: 11, delivery_address: "300 Elm St", order_number: "ORD007", status: "delivered", subtotal: 22.98, delivery_fee: 1.49, total_amount: 24.47, payment_status: "paid" },
            { id: 8, customer_id: 3, restaurant_id: 4, driver_id: 12, delivery_address: "300 Elm St", order_number: "ORD008", status: "delivered", subtotal: 18.97, delivery_fee: 1.49, total_amount: 20.46, payment_status: "paid" },

            // David's order history - Indian cuisine enthusiast
            { id: 9, customer_id: 4, restaurant_id: 5, driver_id: 11, delivery_address: "400 Maple Dr", order_number: "ORD009", status: "delivered", subtotal: 19.98, delivery_fee: 3.49, total_amount: 23.47, payment_status: "paid" },
            { id: 10, customer_id: 4, restaurant_id: 5, driver_id: 12, delivery_address: "400 Maple Dr", order_number: "ORD010", status: "delivered", subtotal: 28.97, delivery_fee: 3.49, total_amount: 32.46, payment_status: "paid" },

            // Eve's order history - Diverse tastes, tries everything
            { id: 11, customer_id: 5, restaurant_id: 1, driver_id: 11, delivery_address: "500 Birch Ln", order_number: "ORD011", status: "delivered", subtotal: 16.99, delivery_fee: 2.99, total_amount: 19.98, payment_status: "paid" },
            { id: 12, customer_id: 5, restaurant_id: 2, driver_id: 12, delivery_address: "500 Birch Ln", order_number: "ORD012", status: "delivered", subtotal: 13.99, delivery_fee: 1.99, total_amount: 15.98, payment_status: "paid" },
            { id: 13, customer_id: 5, restaurant_id: 3, driver_id: 11, delivery_address: "500 Birch Ln", order_number: "ORD013", status: "delivered", subtotal: 11.99, delivery_fee: 2.49, total_amount: 14.48, payment_status: "paid" },
            { id: 14, customer_id: 5, restaurant_id: 4, driver_id: 12, delivery_address: "500 Birch Ln", order_number: "ORD014", status: "delivered", subtotal: 12.99, delivery_fee: 1.49, total_amount: 14.48, payment_status: "paid" },
            { id: 15, customer_id: 5, restaurant_id: 5, driver_id: 11, delivery_address: "500 Birch Ln", order_number: "ORD015", status: "delivered", subtotal: 15.99, delivery_fee: 3.49, total_amount: 19.48, payment_status: "paid" }
        ];

        // Order items table data
        this.order_items = [
            // Alice's Italian orders
            { id: 1, order_id: 1, menu_item_id: 2, quantity: 1, unit_price: 16.99, total_price: 16.99 }, // Spaghetti Carbonara
            { id: 2, order_id: 1, menu_item_id: 4, quantity: 1, unit_price: 6.99, total_price: 6.99 },   // Tiramisu
            { id: 3, order_id: 2, menu_item_id: 1, quantity: 1, unit_price: 14.99, total_price: 14.99 }, // Margherita Pizza
            { id: 4, order_id: 3, menu_item_id: 1, quantity: 1, unit_price: 14.99, total_price: 14.99 }, // Margherita Pizza
            { id: 5, order_id: 3, menu_item_id: 2, quantity: 1, unit_price: 16.99, total_price: 16.99 }, // Spaghetti Carbonara

            // Bob's Chinese and Mexican orders
            { id: 6, order_id: 4, menu_item_id: 5, quantity: 1, unit_price: 13.99, total_price: 13.99 }, // Sweet and Sour Pork
            { id: 7, order_id: 4, menu_item_id: 7, quantity: 1, unit_price: 7.99, total_price: 7.99 },   // Spring Rolls
            { id: 8, order_id: 5, menu_item_id: 9, quantity: 1, unit_price: 11.99, total_price: 11.99 }, // Chicken Burrito
            { id: 9, order_id: 5, menu_item_id: 11, quantity: 1, unit_price: 6.99, total_price: 6.99 },  // Guacamole
            { id: 10, order_id: 6, menu_item_id: 6, quantity: 1, unit_price: 12.99, total_price: 12.99 }, // Kung Pao Chicken

            // Carol's American orders
            { id: 11, order_id: 7, menu_item_id: 13, quantity: 1, unit_price: 12.99, total_price: 12.99 }, // Cheeseburger
            { id: 12, order_id: 7, menu_item_id: 14, quantity: 1, unit_price: 9.99, total_price: 9.99 },   // Buffalo Wings
            { id: 13, order_id: 8, menu_item_id: 13, quantity: 1, unit_price: 12.99, total_price: 12.99 }, // Cheeseburger
            { id: 14, order_id: 8, menu_item_id: 16, quantity: 1, unit_price: 5.99, total_price: 5.99 },   // Chocolate Milkshake

            // David's Indian orders
            { id: 15, order_id: 9, menu_item_id: 17, quantity: 1, unit_price: 15.99, total_price: 15.99 }, // Chicken Tikka Masala
            { id: 16, order_id: 9, menu_item_id: 20, quantity: 1, unit_price: 3.99, total_price: 3.99 },   // Mango Lassi
            { id: 17, order_id: 10, menu_item_id: 18, quantity: 1, unit_price: 13.99, total_price: 13.99 }, // Vegetable Biryani
            { id: 18, order_id: 10, menu_item_id: 17, quantity: 1, unit_price: 15.99, total_price: 15.99 }, // Chicken Tikka Masala

            // Eve's diverse orders
            { id: 19, order_id: 11, menu_item_id: 2, quantity: 1, unit_price: 16.99, total_price: 16.99 }, // Spaghetti Carbonara
            { id: 20, order_id: 12, menu_item_id: 5, quantity: 1, unit_price: 13.99, total_price: 13.99 }, // Sweet and Sour Pork
            { id: 21, order_id: 13, menu_item_id: 9, quantity: 1, unit_price: 11.99, total_price: 11.99 }, // Chicken Burrito
            { id: 22, order_id: 14, menu_item_id: 13, quantity: 1, unit_price: 12.99, total_price: 12.99 }, // Cheeseburger
            { id: 23, order_id: 15, menu_item_id: 17, quantity: 1, unit_price: 15.99, total_price: 15.99 }  // Chicken Tikka Masala
        ];

        // Reviews table data
        this.reviews = [
            // Alice's reviews (Italian food lover)
            { id: 1, order_id: 1, customer_id: 1, restaurant_id: 1, rating: 5, review_text: "Amazing carbonara! The tiramisu was heavenly. This is definitely my favorite Italian spot!" },
            { id: 2, order_id: 2, customer_id: 1, restaurant_id: 1, rating: 5, review_text: "Perfect Margherita pizza as always. Can't get enough of this place!" },

            // Bob's reviews (Chinese and Mexican)
            { id: 3, order_id: 4, customer_id: 2, restaurant_id: 2, rating: 4, review_text: "Sweet and sour pork was delicious. Love the spring rolls too!" },
            { id: 4, order_id: 5, customer_id: 2, restaurant_id: 3, rating: 5, review_text: "Best chicken burrito in town! The guacamole is so fresh." },

            // Carol's reviews (American food)
            { id: 5, order_id: 7, customer_id: 3, restaurant_id: 4, rating: 4, review_text: "Great cheeseburger and those buffalo wings are spicy perfection!" },
            { id: 6, order_id: 8, customer_id: 3, restaurant_id: 4, rating: 5, review_text: "My go-to comfort food spot. Love the milkshakes!" },

            // David's reviews (Indian cuisine)
            { id: 7, order_id: 9, customer_id: 4, restaurant_id: 5, rating: 5, review_text: "Chicken Tikka Masala is incredible! The spices are perfect." },
            { id: 8, order_id: 10, customer_id: 4, restaurant_id: 5, rating: 5, review_text: "Best Indian food ever! Both the biryani and tikka masala are amazing." },

            // Eve's reviews (diverse tastes)
            { id: 9, order_id: 11, customer_id: 5, restaurant_id: 1, rating: 4, review_text: "Good carbonara, though I prefer trying different cuisines." },
            { id: 10, order_id: 12, customer_id: 5, restaurant_id: 2, rating: 4, review_text: "Nice Chinese food, but I like variety in my meals." },
            { id: 11, order_id: 13, customer_id: 5, restaurant_id: 3, rating: 4, review_text: "Solid Mexican food. I enjoy exploring different flavors." },
            { id: 12, order_id: 14, customer_id: 5, restaurant_id: 4, rating: 3, review_text: "Decent burger. I prefer more exotic cuisines usually." },
            { id: 13, order_id: 15, customer_id: 5, restaurant_id: 5, rating: 5, review_text: "Excellent Indian food! I love trying cuisines from around the world." }
        ];
    }

    // Query methods
    getUserById(id) {
        return this.users.find(user => user.id === id);
    }

    getUsersByRole(role) {
        return this.users.filter(user => user.role === role);
    }

    getRestaurantById(id) {
        return this.restaurants.find(restaurant => restaurant.id === id);
    }

    getRestaurantsByCuisine(cuisine) {
        return this.restaurants.filter(restaurant => restaurant.cuisine_type === cuisine);
    }

    getMenuItemsByRestaurant(restaurantId) {
        return this.menu_items.filter(item => item.restaurant_id === restaurantId);
    }

    getOrdersByCustomer(customerId) {
        return this.orders.filter(order => order.customer_id === customerId);
    }

    getOrdersByRestaurant(restaurantId) {
        return this.orders.filter(order => order.restaurant_id === restaurantId);
    }

    getOrderItemsByOrder(orderId) {
        return this.order_items.filter(item => item.order_id === orderId);
    }

    getReviewsByCustomer(customerId) {
        return this.reviews.filter(review => review.customer_id === customerId);
    }

    getReviewsByRestaurant(restaurantId) {
        return this.reviews.filter(review => review.restaurant_id === restaurantId);
    }

    // Advanced analytics methods for clue generation
    getCustomerFavoriteItems(customerId) {
        const customerOrders = this.getOrdersByCustomer(customerId);
        const itemCounts = {};

        customerOrders.forEach(order => {
            const orderItems = this.getOrderItemsByOrder(order.id);
            orderItems.forEach(item => {
                const menuItem = this.menu_items.find(mi => mi.id === item.menu_item_id);
                if (menuItem) {
                    itemCounts[menuItem.name] = (itemCounts[menuItem.name] || 0) + item.quantity;
                }
            });
        });

        return Object.entries(itemCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }));
    }

    getCustomerFavoriteCuisines(customerId) {
        const customerOrders = this.getOrdersByCustomer(customerId);
        const cuisineCounts = {};

        customerOrders.forEach(order => {
            const restaurant = this.getRestaurantById(order.restaurant_id);
            if (restaurant) {
                cuisineCounts[restaurant.cuisine_type] = (cuisineCounts[restaurant.cuisine_type] || 0) + 1;
            }
        });

        return Object.entries(cuisineCounts)
            .sort(([,a], [,b]) => b - a)
            .map(([cuisine, count]) => ({ cuisine, count }));
    }

    getRestaurantPopularItems(restaurantId) {
        const restaurantOrders = this.getOrdersByRestaurant(restaurantId);
        const itemCounts = {};

        restaurantOrders.forEach(order => {
            const orderItems = this.getOrderItemsByOrder(order.id);
            orderItems.forEach(item => {
                const menuItem = this.menu_items.find(mi => mi.id === item.menu_item_id);
                if (menuItem) {
                    itemCounts[menuItem.name] = (itemCounts[menuItem.name] || 0) + item.quantity;
                }
            });
        });

        return Object.entries(itemCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }));
    }

    getCustomerOrderFrequency(customerId) {
        const orders = this.getOrdersByCustomer(customerId);
        const restaurantCounts = {};

        orders.forEach(order => {
            const restaurant = this.getRestaurantById(order.restaurant_id);
            if (restaurant) {
                restaurantCounts[restaurant.name] = (restaurantCounts[restaurant.name] || 0) + 1;
            }
        });

        return restaurantCounts;
    }

    getAllCustomers() {
        return this.getUsersByRole('customer');
    }

    getAllRestaurants() {
        return this.restaurants;
    }
}

// Create global database instance
window.gameDatabase = new Database();
