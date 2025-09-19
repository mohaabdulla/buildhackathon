// ClueSystem.js - Manages clue discovery and customer memory restoration
class ClueSystem {
    constructor() {
        this.discoveredClues = [];
        this.customerMemories = {
            alice: { solved: false, cluesNeeded: 5, cluesFound: 0, preferredCuisine: 'italian' },
            bob: { solved: false, cluesNeeded: 4, cluesFound: 0, preferredCuisine: 'chinese' },
            carol: { solved: false, cluesNeeded: 4, cluesFound: 0, preferredCuisine: 'american' },
            david: { solved: false, cluesNeeded: 5, cluesFound: 0, preferredCuisine: 'indian' },
            eve: { solved: false, cluesNeeded: 6, cluesFound: 0, preferredCuisine: 'diverse' }
        };
        this.totalCluesFound = 0;
        this.maxClues = 42; // Total clues available with 21 restaurants (2 clues per restaurant average)
    }

    // Generate clues based on restaurant investigation
    investigateRestaurant(restaurantId) {
        const restaurant = window.gameDatabase.getRestaurantById(restaurantId);
        const clues = [];

        if (!restaurant) return clues;

        // Get restaurant statistics
        const orders = window.gameDatabase.getOrdersByRestaurant(restaurantId);
        const reviews = window.gameDatabase.getReviewsByRestaurant(restaurantId);
        const popularItems = window.gameDatabase.getRestaurantPopularItems(restaurantId);
        const menuItems = window.gameDatabase.getMenuItemsByRestaurant(restaurantId);

        // Generate different types of clues
        const customerOrderData = this.analyzeCustomerOrders(restaurantId);
        const reviewAnalysis = this.analyzeReviews(restaurantId);
        const popularityData = this.analyzePopularItems(restaurantId);

        // Create clue objects
        if (customerOrderData.length > 0) {
            clues.push({
                id: `rest_${restaurantId}_customers`,
                title: `Customer Order History - ${restaurant.name}`,
                description: `Found detailed order records showing customer preferences`,
                type: 'customer_history',
                restaurantId: restaurantId,
                data: customerOrderData,
                relevantCustomers: customerOrderData.map(c => c.customerName.toLowerCase())
            });
        }

        if (reviews.length > 0) {
            clues.push({
                id: `rest_${restaurantId}_reviews`,
                title: `Customer Reviews - ${restaurant.name}`,
                description: `Discovered customer reviews revealing food preferences`,
                type: 'reviews',
                restaurantId: restaurantId,
                data: reviewAnalysis,
                relevantCustomers: reviewAnalysis.map(r => r.customerName.toLowerCase())
            });
        }

        if (popularItems.length > 0) {
            clues.push({
                id: `rest_${restaurantId}_popular`,
                title: `Popular Menu Items - ${restaurant.name}`,
                description: `Analysis of most ordered items and customer patterns`,
                type: 'popularity',
                restaurantId: restaurantId,
                data: popularityData,
                relevantCustomers: this.getCustomersWhoOrderedPopularItems(restaurantId, popularItems)
            });
        }

        return clues;
    }

    analyzeCustomerOrders(restaurantId) {
        const orders = window.gameDatabase.getOrdersByRestaurant(restaurantId);
        const customerData = [];

        orders.forEach(order => {
            const customer = window.gameDatabase.getUserById(order.customer_id);
            const orderItems = window.gameDatabase.getOrderItemsByOrder(order.id);

            if (customer) {
                const itemNames = orderItems.map(item => {
                    const menuItem = window.gameDatabase.menu_items.find(mi => mi.id === item.menu_item_id);
                    return menuItem ? menuItem.name : 'Unknown Item';
                });

                customerData.push({
                    customerName: `${customer.first_name}`,
                    customerId: customer.id,
                    orderNumber: order.order_number,
                    items: itemNames,
                    totalAmount: order.total_amount,
                    status: order.status
                });
            }
        });

        return customerData;
    }

    analyzeReviews(restaurantId) {
        const reviews = window.gameDatabase.getReviewsByRestaurant(restaurantId);
        const reviewData = [];

        reviews.forEach(review => {
            const customer = window.gameDatabase.getUserById(review.customer_id);
            if (customer) {
                reviewData.push({
                    customerName: `${customer.first_name}`,
                    customerId: customer.id,
                    rating: review.rating,
                    reviewText: review.review_text,
                    sentiment: this.analyzeSentiment(review.review_text)
                });
            }
        });

        return reviewData;
    }

    analyzePopularItems(restaurantId) {
        const popularItems = window.gameDatabase.getRestaurantPopularItems(restaurantId);
        const restaurant = window.gameDatabase.getRestaurantById(restaurantId);

        return {
            restaurant: restaurant.name,
            cuisineType: restaurant.cuisine_type,
            popularItems: popularItems,
            totalOrders: window.gameDatabase.getOrdersByRestaurant(restaurantId).length,
            averageRating: this.calculateAverageRating(restaurantId)
        };
    }

    analyzeSentiment(reviewText) {
        const positiveWords = ['amazing', 'love', 'perfect', 'best', 'delicious', 'incredible', 'excellent', 'great', 'good'];
        const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'worst', 'disgusting'];

        const lowerText = reviewText.toLowerCase();
        const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
        const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;

        if (positiveCount > negativeCount) return 'positive';
        if (negativeCount > positiveCount) return 'negative';
        return 'neutral';
    }

    calculateAverageRating(restaurantId) {
        const reviews = window.gameDatabase.getReviewsByRestaurant(restaurantId);
        if (reviews.length === 0) return 0;

        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        return (totalRating / reviews.length).toFixed(1);
    }

    getCustomersWhoOrderedPopularItems(restaurantId, popularItems) {
        const orders = window.gameDatabase.getOrdersByRestaurant(restaurantId);
        const customerSet = new Set();

        orders.forEach(order => {
            const customer = window.gameDatabase.getUserById(order.customer_id);
            if (customer) {
                customerSet.add(customer.first_name.toLowerCase());
            }
        });

        return Array.from(customerSet);
    }

    // Add discovered clues to the collection
    addClue(clue) {
        // Check if clue already exists
        const existingClue = this.discoveredClues.find(c => c.id === clue.id);
        if (existingClue) return false;

        this.discoveredClues.push({
            ...clue,
            discoveredAt: new Date(),
            used: false
        });

        this.totalCluesFound++;
        this.updateProgress();
        this.playClueSound();
        
        // Show achievement for finding clues
        if (window.gameMain) {
            window.gameMain.updateScore(50);
            
            if (this.totalCluesFound === 1) {
                window.gameMain.showAchievement("First Clue!", "You found your first clue! Keep investigating to solve the mystery.");
            } else if (this.totalCluesFound === 5) {
                window.gameMain.showAchievement("Detective Skills", "You're getting good at this! 5 clues discovered.");
            } else if (this.totalCluesFound === 10) {
                window.gameMain.showAchievement("Master Investigator", "10 clues found! You're making excellent progress.");
            } else if (this.totalCluesFound % 5 === 0) {
                window.gameMain.showAchievement("Clue Hunter", `${this.totalCluesFound} clues discovered! The mystery is unraveling.`);
            }
        }
        
        return true;
    }

    // Use clues to help customers remember their preferences
    useClueForCustomer(customerId, clueId) {
        const clue = this.discoveredClues.find(c => c.id === clueId);
        if (!clue || clue.used) return false;

        const customer = window.gameDatabase.getUserById(customerId);
        if (!customer) return false;

        const customerKey = customer.first_name.toLowerCase();
        const customerMemory = this.customerMemories[customerKey];

        if (!customerMemory || customerMemory.solved) return false;

        // Check if clue is relevant to this customer
        if (!clue.relevantCustomers.includes(customerKey)) return false;

        clue.used = true;
        customerMemory.cluesFound++;

        // Check if customer has enough clues to remember
        if (customerMemory.cluesFound >= customerMemory.cluesNeeded) {
            customerMemory.solved = true;
            this.completeCustomerMemory(customerKey);
        }

        return true;
    }

    completeCustomerMemory(customerKey) {
        // Play success sound
        this.playSuccessSound();

        // Update UI to show customer is solved
        const npcElement = document.getElementById(`npc-${customerKey}`);
        if (npcElement) {
            npcElement.classList.add('solved');
            const indicator = npcElement.querySelector('.npc-indicator');
            if (indicator) {
                indicator.textContent = '✓';
            }
        }

        // Check if all customers are solved
        const allSolved = Object.values(this.customerMemories).every(memory => memory.solved);
        if (allSolved) {
            this.gameComplete();
        }
    }

    // Get clues relevant to a specific customer
    getCluesForCustomer(customerKey) {
        return this.discoveredClues.filter(clue =>
            !clue.used && clue.relevantCustomers.includes(customerKey)
        );
    }

    // Get customer's memory restoration status
    getCustomerStatus(customerKey) {
        return this.customerMemories[customerKey] || { solved: false, cluesNeeded: 0, cluesFound: 0 };
    }

    // Generate summary of customer preferences based on collected clues
    generateCustomerSummary(customerKey) {
        const customerId = this.getCustomerIdByName(customerKey);
        if (!customerId) return null;

        const favoriteItems = window.gameDatabase.getCustomerFavoriteItems(customerId);
        const favoriteCuisines = window.gameDatabase.getCustomerFavoriteCuisines(customerId);
        const reviews = window.gameDatabase.getReviewsByCustomer(customerId);
        const orderFrequency = window.gameDatabase.getCustomerOrderFrequency(customerId);

        return {
            name: customerKey,
            favoriteItems: favoriteItems,
            favoriteCuisines: favoriteCuisines,
            reviews: reviews,
            orderFrequency: orderFrequency,
            totalOrders: window.gameDatabase.getOrdersByCustomer(customerId).length
        };
    }

    getCustomerIdByName(customerKey) {
        const customers = window.gameDatabase.getAllCustomers();
        const customer = customers.find(c => c.first_name.toLowerCase() === customerKey);
        return customer ? customer.id : null;
    }

    // Game progression methods
    updateProgress() {
        const progressBar = document.getElementById('progress-fill');
        const clueCounter = document.getElementById('clue-count');

        if (progressBar) {
            const progressPercent = (this.totalCluesFound / this.maxClues) * 100;
            progressBar.style.width = `${progressPercent}%`;
        }

        if (clueCounter) {
            clueCounter.textContent = this.totalCluesFound;
        }
    }

    gameComplete() {
        // Show game completion dialog
        setTimeout(() => {
            alert(`🎉 Congratulations! You've helped everyone recover their food memories! 

You discovered ${this.totalCluesFound} clues and restored the food preferences of all 5 customers:
• Alice remembered her love for Italian cuisine
• Bob recalled his favorite Chinese and Mexican dishes  
• Carol remembered her American food favorites
• David recovered his passion for Indian spices
• Eve remembered her adventurous, diverse palate

The Great Food Amnesia has been cured! Thanks to your detective work, everyone can enjoy their favorite meals again.`);
        }, 500);
    }

    // Get all discovered clues
    getAllClues() {
        return this.discoveredClues;
    }

    // Get game statistics
    getGameStats() {
        const solvedCustomers = Object.values(this.customerMemories).filter(m => m.solved).length;
        const totalCustomers = Object.keys(this.customerMemories).length;

        return {
            totalClues: this.totalCluesFound,
            maxClues: this.maxClues,
            solvedCustomers: solvedCustomers,
            totalCustomers: totalCustomers,
            progressPercent: (this.totalCluesFound / this.maxClues) * 100,
            completionPercent: (solvedCustomers / totalCustomers) * 100
        };
    }

    // Audio feedback
    playClueSound() {
        const sound = document.getElementById('clue-found-sound');
        if (sound) sound.play().catch(e => console.log('Audio play failed:', e));
    }

    playSuccessSound() {
        const sound = document.getElementById('success-sound');
        if (sound) sound.play().catch(e => console.log('Audio play failed:', e));
    }

    // Save/Load system
    saveGame() {
        const saveData = {
            discoveredClues: this.discoveredClues,
            customerMemories: this.customerMemories,
            totalCluesFound: this.totalCluesFound,
            timestamp: new Date().toISOString()
        };

        try {
            // Note: Using a simple in-memory save since localStorage is not supported
            window.gameSaveData = saveData;
            return true;
        } catch (error) {
            console.error('Save failed:', error);
            return false;
        }
    }

    loadGame() {
        try {
            const saveData = window.gameSaveData;
            if (saveData) {
                this.discoveredClues = saveData.discoveredClues || [];
                this.customerMemories = saveData.customerMemories || this.customerMemories;
                this.totalCluesFound = saveData.totalCluesFound || 0;
                this.updateProgress();
                return true;
            }
        } catch (error) {
            console.error('Load failed:', error);
        }
        return false;
    }
}

// Create global clue system instance
window.gameClueSystem = new ClueSystem();
