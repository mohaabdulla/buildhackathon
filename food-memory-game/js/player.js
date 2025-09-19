// Player.js - Manages player character and movement
class Player {
    constructor() {
        this.element = document.getElementById('player');
        this.position = { x: 50, y: 50 }; // Percentage based positioning
        this.isMoving = false;
        this.currentLocation = 'town-center';
        this.visitedRestaurants = [];
        this.unlockedRestaurants = ['italian']; // Start with Italian restaurant unlocked

        this.setupControls();
        this.setupInteractionHandlers();
        this.updatePosition();
    }

    setupControls() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (window.gameDialogSystem && window.gameDialogSystem.isOpen()) return; // Don't move during dialog

            switch(e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    this.move('up');
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    this.move('down');
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    this.move('left');
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    this.move('right');
                    break;
                case ' ':
                case 'Enter':
                    this.interact();
                    break;
            }
        });

        // Mobile touch controls (swipe gestures)
        let touchStartX = 0;
        let touchStartY = 0;

        this.element.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        });

        this.element.addEventListener('touchmove', (e) => {
            e.preventDefault();
        });

        this.element.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;

            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;

            const minSwipeDistance = 50;

            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // Horizontal swipe
                if (Math.abs(deltaX) > minSwipeDistance) {
                    if (deltaX > 0) {
                        this.move('right');
                    } else {
                        this.move('left');
                    }
                }
            } else {
                // Vertical swipe
                if (Math.abs(deltaY) > minSwipeDistance) {
                    if (deltaY > 0) {
                        this.move('down');
                    } else {
                        this.move('up');
                    }
                }
            }
        });
    }

    setupInteractionHandlers() {
        // Click handlers for NPCs
        document.querySelectorAll('.npc').forEach(npc => {
            npc.addEventListener('click', () => {
                const npcId = npc.dataset.npc;
                if (this.isNearElement(npc)) {
                    this.interactWithNPC(npcId);
                } else {
                    this.moveTowards(npc);
                }
            });
        });

        // Click handlers for restaurant entrances
        document.querySelectorAll('.restaurant-entrance').forEach(restaurant => {
            restaurant.addEventListener('click', () => {
                const restaurantType = restaurant.dataset.restaurant;
                if (this.isNearElement(restaurant)) {
                    this.interactWithRestaurant(restaurantType);
                } else {
                    this.moveTowards(restaurant);
                }
            });
        });
    }

    move(direction) {
        if (this.isMoving) return;

        const moveDistance = 5; // Percentage
        const newPosition = { ...this.position };

        switch(direction) {
            case 'up':
                newPosition.y = Math.max(10, this.position.y - moveDistance);
                break;
            case 'down':
                newPosition.y = Math.min(85, this.position.y + moveDistance);
                break;
            case 'left':
                newPosition.x = Math.max(10, this.position.x - moveDistance);
                break;
            case 'right':
                newPosition.x = Math.min(85, this.position.x + moveDistance);
                break;
        }

        this.animateMovement(newPosition);
    }

    animateMovement(newPosition) {
        this.isMoving = true;
        this.position = newPosition;

        // Add walking animation class
        this.element.classList.add('walking');

        // Animate to new position
        this.updatePosition();

        // Remove walking animation after movement
        setTimeout(() => {
            this.element.classList.remove('walking');
            this.isMoving = false;
        }, 300);
    }

    updatePosition() {
        if (this.element) {
            this.element.style.top = `${this.position.y}%`;
            this.element.style.left = `${this.position.x}%`;
        }
    }

    moveTowards(targetElement) {
        const rect = targetElement.getBoundingClientRect();
        const containerRect = document.getElementById('town-center').getBoundingClientRect();

        const targetX = ((rect.left - containerRect.left) / containerRect.width) * 100;
        const targetY = ((rect.top - containerRect.top) / containerRect.height) * 100;

        // Move closer to target (but not exactly on it)
        const deltaX = targetX - this.position.x;
        const deltaY = targetY - this.position.y;

        const moveX = deltaX > 0 ? Math.min(10, deltaX - 5) : Math.max(-10, deltaX + 5);
        const moveY = deltaY > 0 ? Math.min(10, deltaY - 5) : Math.max(-10, deltaY + 5);

        const newPosition = {
            x: Math.max(5, Math.min(90, this.position.x + moveX)),
            y: Math.max(5, Math.min(90, this.position.y + moveY))
        };

        this.animateMovement(newPosition);
    }

    isNearElement(element) {
        const rect = element.getBoundingClientRect();
        const playerRect = this.element.getBoundingClientRect();

        const distance = Math.sqrt(
            Math.pow(rect.left - playerRect.left, 2) +
            Math.pow(rect.top - playerRect.top, 2)
        );

        return distance < 100; // Within 100 pixels
    }

    interact() {
        // Find nearby interactable elements
        const npcs = document.querySelectorAll('.npc');
        const restaurants = document.querySelectorAll('.restaurant-entrance');

        // Check NPCs first
        for (let npc of npcs) {
            if (this.isNearElement(npc)) {
                const npcId = npc.dataset.npc;
                this.interactWithNPC(npcId);
                return;
            }
        }

        // Check restaurants
        for (let restaurant of restaurants) {
            if (this.isNearElement(restaurant)) {
                const restaurantType = restaurant.dataset.restaurant;
                this.interactWithRestaurant(restaurantType);
                return;
            }
        }
    }

    interactWithNPC(npcId) {
        // Start dialog with the NPC
        if (window.gameDialogSystem) {
            window.gameDialogSystem.startDialog(npcId);
        }
    }

    interactWithRestaurant(restaurantType) {
        if (!this.isRestaurantUnlocked(restaurantType)) {
            this.showLockedRestaurantMessage(restaurantType);
            return;
        }

        // Enter restaurant and investigate
        if (window.gameEngine) {
            window.gameEngine.enterRestaurant(restaurantType);
        }
    }

    isRestaurantUnlocked(restaurantType) {
        return this.unlockedRestaurants.includes(restaurantType);
    }

    unlockRestaurant(restaurantType) {
        if (!this.unlockedRestaurants.includes(restaurantType)) {
            this.unlockedRestaurants.push(restaurantType);
            this.updateRestaurantVisuals();
            this.showRestaurantUnlockedMessage(restaurantType);
        }
    }

    updateRestaurantVisuals() {
        document.querySelectorAll('.restaurant-entrance').forEach(restaurant => {
            const restaurantType = restaurant.dataset.restaurant;
            if (this.isRestaurantUnlocked(restaurantType)) {
                restaurant.classList.remove('locked');
            } else {
                restaurant.classList.add('locked');
            }
        });
    }

    showLockedRestaurantMessage(restaurantType) {
        const restaurantNames = {
            italian: 'Mama Mia\'s Italian',
            chinese: 'Golden Dragon',
            mexican: 'El Sombrero',
            american: 'Burger Palace',
            indian: 'Spice Garden'
        };

        if (window.gameDialogSystem) {
            window.gameDialogSystem.showDialog({
                speaker: "Food Detective",
                text: `${restaurantNames[restaurantType]} is currently closed. I need to make progress with the investigation before I can access this restaurant. Maybe I should talk to people and gather more clues first.`,
                choices: [
                    { text: "I'll investigate other places first.", action: "close" }
                ]
            });
        }
    }

    showRestaurantUnlockedMessage(restaurantType) {
        const restaurantNames = {
            italian: 'Mama Mia\'s Italian',
            chinese: 'Golden Dragon',
            mexican: 'El Sombrero',
            american: 'Burger Palace',
            indian: 'Spice Garden'
        };

        // Show visual notification
        this.showNotification(`🔓 ${restaurantNames[restaurantType]} is now accessible!`);
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'game-notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(46, 204, 113, 0.9);
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            font-family: inherit;
            font-weight: bold;
            z-index: 1001;
            animation: fadeInOut 3s ease-in-out;
        `;

        // Add animation keyframes if not already added
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes fadeInOut {
                    0% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
                    20% { opacity: 1; transform: translateX(-50%) translateY(0); }
                    80% { opacity: 1; transform: translateX(-50%) translateY(0); }
                    100% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(notification);

        // Remove notification after animation
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    // Restaurant unlocking logic based on progress
    checkProgressAndUnlockRestaurants() {
        const stats = window.gameClueSystem.getGameStats();

        // Unlock restaurants based on clues found or customers helped
        if (stats.totalClues >= 2 && !this.isRestaurantUnlocked('chinese')) {
            this.unlockRestaurant('chinese');
        }

        if (stats.totalClues >= 4 && !this.isRestaurantUnlocked('mexican')) {
            this.unlockRestaurant('mexican');
        }

        if (stats.totalClues >= 6 && !this.isRestaurantUnlocked('american')) {
            this.unlockRestaurant('american');
        }

        if (stats.totalClues >= 8 && !this.isRestaurantUnlocked('indian')) {
            this.unlockRestaurant('indian');
        }
    }

    // Save/Load player state
    saveState() {
        return {
            position: this.position,
            currentLocation: this.currentLocation,
            visitedRestaurants: this.visitedRestaurants,
            unlockedRestaurants: this.unlockedRestaurants
        };
    }

    loadState(state) {
        if (state) {
            this.position = state.position || this.position;
            this.currentLocation = state.currentLocation || this.currentLocation;
            this.visitedRestaurants = state.visitedRestaurants || [];
            this.unlockedRestaurants = state.unlockedRestaurants || ['italian'];

            this.updatePosition();
            this.updateRestaurantVisuals();
        }
    }

    // Get player's current position
    getPosition() {
        return this.position;
    }

    // Set player position (for game events)
    setPosition(x, y) {
        this.position = { x: x, y: y };
        this.updatePosition();
    }

    // Get unlocked restaurants
    getUnlockedRestaurants() {
        return [...this.unlockedRestaurants];
    }

    // Visit a restaurant (for tracking purposes)
    visitRestaurant(restaurantType) {
        if (!this.visitedRestaurants.includes(restaurantType)) {
            this.visitedRestaurants.push(restaurantType);
        }
    }

    // Get visited restaurants
    getVisitedRestaurants() {
        return [...this.visitedRestaurants];
    }

    // Reset player to starting position
    resetToCenter() {
        this.setPosition(50, 50);
    }

    // Check if player is in specific area
    isInArea(area) {
        // Define areas of the map
        const areas = {
            center: { x: [40, 60], y: [40, 60] },
            north: { x: [0, 100], y: [0, 40] },
            south: { x: [0, 100], y: [60, 100] },
            west: { x: [0, 40], y: [0, 100] },
            east: { x: [60, 100], y: [0, 100] }
        };

        const areaCoords = areas[area];
        if (!areaCoords) return false;

        return this.position.x >= areaCoords.x[0] &&
            this.position.x <= areaCoords.x[1] &&
            this.position.y >= areaCoords.y[0] &&
            this.position.y <= areaCoords.y[1];
    }
}

// Create global player instance
window.gamePlayer = new Player();
