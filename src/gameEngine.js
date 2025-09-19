// GameEngine.js - Main game logic and state management
class GameEngine {
    constructor() {
        this.gameState = 'loading';
        this.currentView = 'town-center';
        this.currentRestaurant = null;
        this.gameStarted = false;
        this.musicEnabled = true;
        this.soundEnabled = true;

        this.initializeGame();
        this.setupEventListeners();
    }

    initializeGame() {
        // Wait for DOM to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.startGame();
            });
        } else {
            this.startGame();
        }
    }

    startGame() {
        this.showLoadingScreen();

        // Simulate loading time and initialize all systems
        setTimeout(() => {
            this.initializeGameSystems();
            this.hideLoadingScreen();
            this.gameState = 'playing';
            this.gameStarted = true;
            this.showTutorial();
        }, 2000);
    }

    initializeGameSystems() {
        // Initialize background music
        this.setupAudio();

        // Set up periodic progress checks
        setInterval(() => {
            this.checkGameProgress();
        }, 1000);

        console.log('Food Memory Game initialized successfully!');
    }

    setupEventListeners() {
        // Show inventory button
        document.getElementById('show-inventory')?.addEventListener('click', () => {
            this.toggleInventory();
        });

        // Close inventory button
        document.getElementById('close-inventory')?.addEventListener('click', () => {
            this.closeInventory();
        });

        // Back to town button
        document.getElementById('back-to-town')?.addEventListener('click', () => {
            this.returnToTown();
        });

        // Toggle music button
        document.getElementById('toggle-music')?.addEventListener('click', () => {
            this.toggleMusic();
        });

        // Save game button
        document.getElementById('save-game')?.addEventListener('click', () => {
            this.saveGame();
        });

        // ESC key for various actions
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (this.isInventoryOpen()) {
                    this.closeInventory();
                } else if (this.currentView === 'restaurant') {
                    this.returnToTown();
                }
            } else if (e.key === 'i' || e.key === 'I') {
                this.toggleInventory();
            } else if (e.key === 'm' || e.key === 'M') {
                this.toggleMusic();
            }
        });
    }

    setupAudio() {
        const bgMusic = document.getElementById('background-music');
        if (bgMusic && this.musicEnabled) {
            bgMusic.volume = 0.3;
            bgMusic.play().catch(e => console.log('Music autoplay prevented:', e));
        }
    }

    showLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.display = 'flex';
        }
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
    }

    showTutorial() {
        if (window.gameDialogSystem) {
            window.gameDialogSystem.showTutorial();
        }
    }

    // Restaurant investigation system
    enterRestaurant(restaurantType) {
        const restaurantData = this.getRestaurantData(restaurantType);
        if (!restaurantData) return;

        this.currentRestaurant = restaurantType;
        this.currentView = 'restaurant';

        // Mark restaurant as visited
        if (window.gamePlayer) {
            window.gamePlayer.visitRestaurant(restaurantType);
        }

        this.showRestaurantView(restaurantData);
        this.investigateRestaurant(restaurantData.id);
    }

    getRestaurantData(restaurantType) {
        const restaurants = window.gameDatabase.getAllRestaurants();
        const cuisineMap = {
            italian: 'italian',
            chinese: 'chinese',
            mexican: 'mexican',
            american: 'american',
            indian: 'indian',
            korean: 'korean',
            vietnamese: 'vietnamese',
            greek: 'greek',
            brazilian: 'brazilian',
            french: 'french',
            lebanese: 'lebanese',
            german: 'german',
            nigerian: 'nigerian',
            japanese: 'japanese',
            polish: 'polish',
            egyptian: 'egyptian',
            thai: 'thai',
            russian: 'russian'
        };

        return restaurants.find(r => r.cuisine_type === cuisineMap[restaurantType]);
    }

    showRestaurantView(restaurant) {
        // Hide town center, show restaurant interior
        document.getElementById('town-center').classList.remove('active');
        document.getElementById('town-center').classList.add('hidden');
        document.getElementById('restaurant-interior').classList.remove('hidden');
        document.getElementById('restaurant-interior').classList.add('active');

        // Generate restaurant investigation content
        this.generateRestaurantContent(restaurant);
    }

    generateRestaurantContent(restaurant) {
        const detailsContainer = document.getElementById('restaurant-details');
        if (!detailsContainer) return;

        // Get restaurant data for investigation
        const menuItems = window.gameDatabase.getMenuItemsByRestaurant(restaurant.id);
        const orders = window.gameDatabase.getOrdersByRestaurant(restaurant.id);
        const reviews = window.gameDatabase.getReviewsByRestaurant(restaurant.id);
        const popularItems = window.gameDatabase.getRestaurantPopularItems(restaurant.id);

        // Create restaurant investigation HTML
        detailsContainer.innerHTML = `
            <div class="restaurant-info">
                <h2>🔍 Investigating: ${restaurant.name}</h2>
                <p><strong>Cuisine Type:</strong> ${this.capitalizeFirst(restaurant.cuisine_type)}</p>
                <p><strong>Address:</strong> ${restaurant.address}, ${restaurant.city}</p>
                <p><strong>Rating:</strong> ${restaurant.rating}/5.0 ⭐</p>
                <p><strong>Phone:</strong> ${restaurant.phone}</p>
                <p><strong>Delivery Fee:</strong> $${restaurant.delivery_fee}</p>
                <p><strong>Estimated Delivery Time:</strong> ${restaurant.delivery_time_estimate} minutes</p>
            </div>

            <div class="investigation-section">
                <h3>📋 Menu Items Analysis</h3>
                <p>Examining the menu to understand what types of food this restaurant serves...</p>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Item Name</th>
                            <th>Category</th>
                            <th>Price</th>
                            <th>Vegetarian</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${menuItems.map(item => `
                            <tr>
                                <td><strong>${item.name}</strong></td>
                                <td>${this.capitalizeFirst(item.category)}</td>
                                <td>$${item.price}</td>
                                <td>${item.is_vegetarian ? '🌱 Yes' : '🍖 No'}</td>
                                <td>${item.description}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <div class="investigation-section">
                <h3>📊 Popular Items Analysis</h3>
                <p>Analyzing order patterns to identify the most popular dishes...</p>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Menu Item</th>
                            <th>Times Ordered</th>
                            <th>Popularity</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${popularItems.map(item => `
                            <tr>
                                <td><strong>${item.name}</strong></td>
                                <td>${item.count}</td>
                                <td>${this.getPopularityLevel(item.count)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <div class="investigation-section">
                <h3>🛍️ Order History Investigation</h3>
                <p>Examining past orders to identify customer preferences and patterns...</p>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Order #</th>
                            <th>Customer</th>
                            <th>Items Ordered</th>
                            <th>Total Amount</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${orders.map(order => {
            const customer = window.gameDatabase.getUserById(order.customer_id);
            const orderItems = window.gameDatabase.getOrderItemsByOrder(order.id);
            const itemNames = orderItems.map(item => {
                const menuItem = menuItems.find(mi => mi.id === item.menu_item_id);
                return menuItem ? menuItem.name : 'Unknown Item';
            }).join(', ');

            return `
                                <tr>
                                    <td><strong>${order.order_number}</strong></td>
                                    <td>${customer ? customer.first_name + ' ' + customer.last_name : 'Unknown'}</td>
                                    <td>${itemNames}</td>
                                    <td>$${order.total_amount}</td>
                                    <td>${this.getStatusEmoji(order.status)} ${this.capitalizeFirst(order.status)}</td>
                                </tr>
                            `;
        }).join('')}
                    </tbody>
                </table>
            </div>

            <div class="investigation-section">
                <h3>💬 Customer Reviews Analysis</h3>
                <p>Reading customer feedback to understand food preferences and satisfaction...</p>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Customer</th>
                            <th>Rating</th>
                            <th>Review</th>
                            <th>Sentiment</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${reviews.map(review => {
            const customer = window.gameDatabase.getUserById(review.customer_id);
            return `
                                <tr>
                                    <td><strong>${customer ? customer.first_name : 'Unknown'}</strong></td>
                                    <td>${'⭐'.repeat(review.rating)} (${review.rating}/5)</td>
                                    <td>${review.review_text}</td>
                                    <td>${this.getSentimentEmoji(review.review_text)}</td>
                                </tr>
                            `;
        }).join('')}
                    </tbody>
                </table>
            </div>

            <div class="investigation-section">
                <h3>🔍 Investigation Summary</h3>
                <div style="background: rgba(52, 152, 219, 0.2); padding: 15px; border-radius: 8px; margin-top: 10px;">
                    <p><strong>Total Orders Found:</strong> ${orders.length}</p>
                    <p><strong>Total Reviews:</strong> ${reviews.length}</p>
                    <p><strong>Average Rating:</strong> ${this.calculateAverageRating(reviews)}/5.0</p>
                    <p><strong>Most Popular Item:</strong> ${popularItems.length > 0 ? popularItems[0].name : 'None'}</p>
                    <p><strong>Regular Customers:</strong> ${this.getRegularCustomers(orders).join(', ')}</p>
                </div>
            </div>
        `;
    }

    investigateRestaurant(restaurantId) {
        // Generate clues from restaurant investigation
        const clues = window.gameClueSystem.investigateRestaurant(restaurantId);

        if (clues.length > 0) {
            let newCluesFound = 0;
            clues.forEach(clue => {
                const added = window.gameClueSystem.addClue(clue);
                if (added) newCluesFound++;
            });

            if (newCluesFound > 0) {
                this.showInvestigationResults(newCluesFound, clues);
            }
        }
    }

    showInvestigationResults(newCluesFound, clues) {
        if (newCluesFound > 0 && clues.length > 0) {
            // Show the enhanced clue discovery modal for the first clue found
            this.showEnhancedClueModal(clues[0], newCluesFound);
        } else {
            // Fallback to dialog system if no new clues
            const resultText = "I've already investigated this location thoroughly. No new evidence found here.";
            
            if (window.gameDialogSystem) {
                window.gameDialogSystem.showDialog({
                    speaker: "Food Detective",
                    text: resultText,
                    choices: [
                        { text: "Continue investigating elsewhere", action: "close" }
                    ]
                });
            }
        }
    }

    showEnhancedClueModal(clue, totalNewClues = 1) {
        const modal = document.getElementById('enhanced-clue-modal');
        const restaurant = window.gameDatabase.getRestaurantById(clue.restaurantId);
        
        if (!modal || !restaurant) return;

        // Update modal content
        const clueTitle = modal.querySelector('#clue-title');
        const clueIcon = modal.querySelector('.clue-icon');
        const clueDescription = modal.querySelector('#clue-description');
        const metadataType = modal.querySelector('#clue-type-value');
        const metadataLocation = modal.querySelector('#clue-location-value');
        const metadataRelevance = modal.querySelector('#clue-relevance-stars');
        const progressText = modal.querySelector('.progress-text');
        const progressBarFill = modal.querySelector('.progress-bar-fill');

        // Set content
        if (clueTitle) clueTitle.textContent = clue.title;
        if (clueIcon) clueIcon.textContent = this.getClueIcon(clue.type);
        if (clueDescription) clueDescription.textContent = clue.description;
        if (metadataType) metadataType.textContent = this.formatClueType(clue.type);
        if (metadataLocation) metadataLocation.textContent = restaurant.name;
        
        // Set relevance stars based on clue quality
        if (metadataRelevance) {
            const relevance = this.calculateClueRelevance(clue);
            metadataRelevance.innerHTML = this.generateStarsHTML(relevance);
        }

        // Update progress
        const stats = window.gameClueSystem.getGameStats();
        if (progressText) {
            progressText.textContent = `${stats.totalClues}/${stats.maxClues} clues discovered`;
        }
        if (progressBarFill) {
            const percentage = (stats.totalClues / stats.maxClues) * 100;
            progressBarFill.style.width = `${percentage}%`;
        }

        // Add particles effect
        this.createParticlesEffect(modal);

        // Set up event listeners for action buttons
        this.setupClueModalActions(clue, modal);

        // Show modal
        modal.style.display = 'flex';
    }

    getClueIcon(clueType) {
        const icons = {
            'customer_history': '📋',
            'reviews': '⭐',
            'popularity': '🔥',
            'menu_analysis': '📜',
            'staff_notes': '📝',
            'default': '🔍'
        };
        return icons[clueType] || icons.default;
    }

    formatClueType(clueType) {
        const types = {
            'customer_history': 'Customer Orders',
            'reviews': 'Customer Reviews',
            'popularity': 'Popular Items',
            'menu_analysis': 'Menu Analysis',
            'staff_notes': 'Staff Notes',
            'default': 'Evidence'
        };
        return types[clueType] || types.default;
    }

    calculateClueRelevance(clue) {
        // Calculate relevance based on number of relevant customers and data quality
        const relevantCustomers = clue.relevantCustomers ? clue.relevantCustomers.length : 0;
        const dataPoints = clue.data ? clue.data.length : 0;
        
        if (relevantCustomers >= 3 || dataPoints >= 5) return 5;
        if (relevantCustomers >= 2 || dataPoints >= 3) return 4;
        if (relevantCustomers >= 1 || dataPoints >= 1) return 3;
        return 2;
    }

    generateStarsHTML(count) {
        let stars = '';
        for (let i = 0; i < 5; i++) {
            if (i < count) {
                stars += `<span class="star" style="--i: ${i}">★</span>`;
            } else {
                stars += `<span class="star" style="--i: ${i}; opacity: 0.3;">☆</span>`;
            }
        }
        return stars;
    }

    createParticlesEffect(modal) {
        const particlesContainer = modal.querySelector('.particles');
        if (!particlesContainer) return;

        // Clear existing particles
        particlesContainer.innerHTML = '';

        // Create 20 particles
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 6 + 's';
            particle.style.animationDuration = (3 + Math.random() * 3) + 's';
            particlesContainer.appendChild(particle);
        }
    }

    setupClueModalActions(clue, modal) {
        const notebookBtn = modal.querySelector('#add-to-notebook');
        const backMapBtn = modal.querySelector('#return-to-map');
        const continueBtn = modal.querySelector('#continue-investigating');

        // Remove existing listeners
        const newNotebookBtn = notebookBtn.cloneNode(true);
        const newBackMapBtn = backMapBtn.cloneNode(true);
        const newContinueBtn = continueBtn.cloneNode(true);
        
        notebookBtn.parentNode.replaceChild(newNotebookBtn, notebookBtn);
        backMapBtn.parentNode.replaceChild(newBackMapBtn, backMapBtn);
        continueBtn.parentNode.replaceChild(newContinueBtn, continueBtn);

        // Add to notebook
        newNotebookBtn.addEventListener('click', () => {
            this.closeEnhancedClueModal();
            this.showInventory();
        });

        // Back to map
        newBackMapBtn.addEventListener('click', () => {
            this.closeEnhancedClueModal();
            this.returnToTown();
        });

        // Continue investigating
        newContinueBtn.addEventListener('click', () => {
            this.closeEnhancedClueModal();
        });

        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeEnhancedClueModal();
            }
        });
    }

    closeEnhancedClueModal() {
        const modal = document.getElementById('enhanced-clue-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    returnToTown() {
        this.currentView = 'town-center';
        this.currentRestaurant = null;

        // Show town center, hide restaurant interior
        document.getElementById('restaurant-interior').classList.remove('active');
        document.getElementById('restaurant-interior').classList.add('hidden');
        document.getElementById('town-center').classList.remove('hidden');
        document.getElementById('town-center').classList.add('active');
    }

    // Inventory management
    toggleInventory() {
        const inventory = document.getElementById('inventory');
        if (inventory) {
            if (inventory.classList.contains('hidden')) {
                this.showInventory();
            } else {
                this.closeInventory();
            }
        }
    }

    showInventory() {
        const inventory = document.getElementById('inventory');
        const clueList = document.getElementById('clue-list');

        if (inventory && clueList) {
            inventory.classList.remove('hidden');
            this.updateInventoryContent();
        }
    }

    updateInventoryContent() {
        const clueList = document.getElementById('clue-list');
        if (!clueList) return;

        const allClues = window.gameClueSystem.getAllClues();

        if (allClues.length === 0) {
            clueList.innerHTML = `
                <div class="clue-item">
                    <div class="clue-title">No Evidence Found Yet</div>
                    <div class="clue-description">Visit restaurants around town to investigate and gather evidence about people's food preferences.</div>
                </div>
            `;
            return;
        }

        clueList.innerHTML = allClues.map(clue => `
            <div class="clue-item ${clue.used ? 'used' : ''}">
                <div class="clue-title">${clue.used ? '✅ ' : '🔍 '}${clue.title}</div>
                <div class="clue-description">${clue.description}</div>
                <div class="clue-data">
                    Type: ${clue.type.replace('_', ' ')} | 
                    Relevant to: ${clue.relevantCustomers.join(', ')} | 
                    ${clue.used ? 'Used' : 'Available'}
                </div>
                ${clue.used ? '<div class="clue-used-marker">Evidence already used to help someone remember</div>' : ''}
            </div>
        `).join('');
    }

    closeInventory() {
        const inventory = document.getElementById('inventory');
        if (inventory) {
            inventory.classList.add('hidden');
        }
    }

    isInventoryOpen() {
        const inventory = document.getElementById('inventory');
        return inventory && !inventory.classList.contains('hidden');
    }

    // Audio controls
    toggleMusic() {
        const bgMusic = document.getElementById('background-music');
        const musicBtn = document.getElementById('toggle-music');

        if (bgMusic && musicBtn) {
            if (this.musicEnabled) {
                bgMusic.pause();
                musicBtn.textContent = '🔇 Music';
                this.musicEnabled = false;
            } else {
                bgMusic.play().catch(e => console.log('Music play failed:', e));
                musicBtn.textContent = '🎵 Music';
                this.musicEnabled = true;
            }
        }
    }

    // Game progress checking
    checkGameProgress() {
        if (!this.gameStarted) return;

        // Check if player should unlock new restaurants
        if (window.gamePlayer) {
            window.gamePlayer.checkProgressAndUnlockRestaurants();
        }
    }

    // Save/Load game
    saveGame() {
        try {
            const gameData = {
                clueSystem: window.gameClueSystem.saveGame(),
                player: window.gamePlayer ? window.gamePlayer.saveState() : null,
                gameState: this.gameState,
                currentView: this.currentView,
                musicEnabled: this.musicEnabled,
                timestamp: new Date().toISOString()
            };

            // Save to memory (localStorage not supported)
            window.fullGameSave = gameData;

            this.showSaveConfirmation();
            return true;
        } catch (error) {
            console.error('Save failed:', error);
            this.showSaveError();
            return false;
        }
    }

    loadGame() {
        try {
            const gameData = window.fullGameSave;
            if (!gameData) return false;

            // Load clue system
            if (window.gameClueSystem && gameData.clueSystem) {
                window.gameClueSystem.loadGame();
            }

            // Load player state
            if (window.gamePlayer && gameData.player) {
                window.gamePlayer.loadState(gameData.player);
            }

            // Restore game settings
            this.gameState = gameData.gameState || this.gameState;
            this.currentView = gameData.currentView || this.currentView;
            this.musicEnabled = gameData.musicEnabled !== undefined ? gameData.musicEnabled : this.musicEnabled;

            return true;
        } catch (error) {
            console.error('Load failed:', error);
            return false;
        }
    }

    showSaveConfirmation() {
        this.showNotification('💾 Game saved successfully!');
    }

    showSaveError() {
        this.showNotification('❌ Failed to save game!');
    }

    showNotification(message) {
        // Use the same notification system as Player
        if (window.gamePlayer) {
            window.gamePlayer.showNotification(message);
        }
    }

    // Utility methods
    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    getPopularityLevel(count) {
        if (count >= 3) return '🔥 Very Popular';
        if (count >= 2) return '👍 Popular';
        return '⭐ Occasional';
    }

    getStatusEmoji(status) {
        const statusEmojis = {
            'pending': '⏳',
            'confirmed': '✅',
            'preparing': '👨‍🍳',
            'ready': '🛎️',
            'delivered': '📦',
            'cancelled': '❌'
        };
        return statusEmojis[status] || '❓';
    }

    getSentimentEmoji(reviewText) {
        const lowerText = reviewText.toLowerCase();
        if (lowerText.includes('love') || lowerText.includes('amazing') || lowerText.includes('perfect') || lowerText.includes('best')) {
            return '😍 Very Positive';
        }
        if (lowerText.includes('great') || lowerText.includes('good') || lowerText.includes('delicious')) {
            return '😊 Positive';
        }
        if (lowerText.includes('okay') || lowerText.includes('decent')) {
            return '😐 Neutral';
        }
        return '🙂 Positive';
    }

    calculateAverageRating(reviews) {
        if (reviews.length === 0) return '0.0';
        const total = reviews.reduce((sum, review) => sum + review.rating, 0);
        return (total / reviews.length).toFixed(1);
    }

    getRegularCustomers(orders) {
        const customerCounts = {};
        orders.forEach(order => {
            const customer = window.gameDatabase.getUserById(order.customer_id);
            if (customer) {
                const name = customer.first_name;
                customerCounts[name] = (customerCounts[name] || 0) + 1;
            }
        });

        return Object.entries(customerCounts)
            .filter(([name, count]) => count > 1)
            .map(([name, count]) => name)
            .slice(0, 3); // Show top 3
    }

    // Get current game state
    getGameState() {
        return {
            state: this.gameState,
            view: this.currentView,
            restaurant: this.currentRestaurant,
            started: this.gameStarted
        };
    }
}

// Create global game engine instance
window.gameEngine = new GameEngine();
