// Player.js - Manages player character and movement
class Player {
    constructor() {
        this.element = document.getElementById('player');
        this.position = { x: 50, y: 50 }; // Percentage based positioning
        this.isMoving = false;
        this.currentLocation = 'town-center';
        this.visitedRestaurants = [];
        this.unlockedRestaurants = ['italian', 'chinese', 'mexican', 'american', 'indian', 'thai']; // Start with all restaurants unlocked
        
        // Smooth movement system
        this.keysPressed = new Set();
        this.moveSpeed = 0.2; // Slower movement for better control
        this.isAnimating = false;
        this.cameraEnabled = false; // Disable camera following by default (use bigger map instead)

        this.setupControls();
        this.setupInteractionHandlers();
        this.updatePosition();
        this.updateRestaurantVisuals(); // Update restaurant visual states
        this.startSmoothMovement();
    }

    // Dynamic boundary calculation based on map size and sprite dimensions
    getBoundaries() {
        const mapElement = document.getElementById('town-center');
        const playerSize = 48; // Player sprite size in pixels
        
        if (mapElement) {
            const mapRect = mapElement.getBoundingClientRect();
            const marginX = (playerSize / 2 / mapRect.width) * 100; // Convert to percentage
            const marginY = (playerSize / 2 / mapRect.height) * 100; // Convert to percentage
            
            return {
                minX: Math.max(1, marginX),
                maxX: Math.min(99, 100 - marginX),
                minY: Math.max(1, marginY),
                maxY: Math.min(99, 100 - marginY)
            };
        }
        
        // Fallback boundaries if map element not found
        return {
            minX: 3,
            maxX: 97,
            minY: 3,
            maxY: 97
        };
    }

    setupControls() {
        // Keyboard controls for smooth movement
        document.addEventListener('keydown', (e) => {
            if (window.gameDialogSystem && window.gameDialogSystem.isOpen()) return; // Don't move during dialog

            const key = e.key.toLowerCase();
            
            // Add keys for smooth movement
            if (['arrowup', 'w', 'arrowdown', 's', 'arrowleft', 'a', 'arrowright', 'd'].includes(key)) {
                e.preventDefault();
                this.keysPressed.add(key);
            }
            
            // Interaction keys
            if (key === ' ' || key === 'enter') {
                e.preventDefault();
                this.interact();
            }
            
            // Camera toggle (C key)
            if (key === 'c') {
                e.preventDefault();
                this.toggleCamera();
            }
        });

        document.addEventListener('keyup', (e) => {
            const key = e.key.toLowerCase();
            this.keysPressed.delete(key);
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
                        this.moveDiscrete('right');
                    } else {
                        this.moveDiscrete('left');
                    }
                }
            } else {
                // Vertical swipe
                if (Math.abs(deltaY) > minSwipeDistance) {
                    if (deltaY > 0) {
                        this.moveDiscrete('down');
                    } else {
                        this.moveDiscrete('up');
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

    startSmoothMovement() {
        const updateMovement = () => {
            if (window.gameDialogSystem && window.gameDialogSystem.isOpen()) {
                requestAnimationFrame(updateMovement);
                return;
            }

            let moved = false;
            const newPosition = { ...this.position };
            
            // Get dynamic boundaries based on actual map size
            const boundaries = this.getBoundaries();
            const { minX, maxX, minY, maxY } = boundaries;

            // Check pressed keys and move smoothly
            if (this.keysPressed.has('arrowup') || this.keysPressed.has('w')) {
                newPosition.y = Math.max(minY, this.position.y - this.moveSpeed);
                moved = true;
            }
            if (this.keysPressed.has('arrowdown') || this.keysPressed.has('s')) {
                newPosition.y = Math.min(maxY, this.position.y + this.moveSpeed);
                moved = true;
            }
            if (this.keysPressed.has('arrowleft') || this.keysPressed.has('a')) {
                newPosition.x = Math.max(minX, this.position.x - this.moveSpeed);
                moved = true;
            }
            if (this.keysPressed.has('arrowright') || this.keysPressed.has('d')) {
                newPosition.x = Math.min(maxX, this.position.x + this.moveSpeed);
                moved = true;
            }

            if (moved) {
                this.position = newPosition;
                this.updatePosition();
                
                // Add walking animation
                if (!this.element.classList.contains('walking')) {
                    this.element.classList.add('walking');
                }
            } else {
                // Remove walking animation when not moving
                this.element.classList.remove('walking');
            }

            requestAnimationFrame(updateMovement);
        };
        
        updateMovement();
    }

    // Discrete movement for touch/swipe controls
    moveDiscrete(direction) {
        if (this.isMoving) return;

        const moveDistance = 5; // Increased for larger map
        const newPosition = { ...this.position };

        // Get dynamic boundaries
        const boundaries = this.getBoundaries();
        const { minX, maxX, minY, maxY } = boundaries;

        switch(direction) {
            case 'up':
                newPosition.y = Math.max(minY, this.position.y - moveDistance);
                break;
            case 'down':
                newPosition.y = Math.min(maxY, this.position.y + moveDistance);
                break;
            case 'left':
                newPosition.x = Math.max(minX, this.position.x - moveDistance);
                break;
            case 'right':
                newPosition.x = Math.min(maxX, this.position.x + moveDistance);
                break;
        }

        this.animateMovement(newPosition);
    }

    // Keep old move method for backward compatibility but update boundaries
    move(direction) {
        if (this.isMoving) return;

        const moveDistance = 5; // Increased for larger map
        const newPosition = { ...this.position };

        // Get dynamic boundaries
        const boundaries = this.getBoundaries();
        const { minX, maxX, minY, maxY } = boundaries;

        switch(direction) {
            case 'up':
                newPosition.y = Math.max(minY, this.position.y - moveDistance);
                break;
            case 'down':
                newPosition.y = Math.min(maxY, this.position.y + moveDistance);
                break;
            case 'left':
                newPosition.x = Math.max(minX, this.position.x - moveDistance);
                break;
            case 'right':
                newPosition.x = Math.min(maxX, this.position.x + moveDistance);
                break;
        }

        this.animateMovement(newPosition);
    }

    animateMovement(newPosition) {
        if (this.isAnimating) return;
        
        this.isMoving = true;
        this.isAnimating = true;
        
        const startPosition = { ...this.position };
        const deltaX = newPosition.x - startPosition.x;
        const deltaY = newPosition.y - startPosition.y;
        const duration = 200; // Smoother, faster animation
        const startTime = Date.now();

        // Add walking animation class
        this.element.classList.add('walking');

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Smooth easing function
            const easeProgress = 1 - Math.pow(1 - progress, 2);
            
            this.position.x = startPosition.x + deltaX * easeProgress;
            this.position.y = startPosition.y + deltaY * easeProgress;
            
            this.updatePosition();
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.position = newPosition; // Ensure exact final position
                this.updatePosition();
                this.element.classList.remove('walking');
                this.isMoving = false;
                this.isAnimating = false;
            }
        };
        
        animate();
    }

    updatePosition() {
        if (this.element) {
            this.element.style.top = `${this.position.y}%`;
            this.element.style.left = `${this.position.x}%`;
            
            // Update camera to follow player
            this.updateCamera();
        }
    }

    updateCamera() {
        if (!this.cameraEnabled) {
            // Reset camera position if disabled
            const townCenter = document.getElementById('town-center');
            if (townCenter) {
                townCenter.style.transform = 'translate(0px, 0px)';
            }
            return;
        }
        
        const townCenter = document.getElementById('town-center');
        if (!townCenter) return;
        
        // Calculate camera offset to keep player in view
        // Convert player position (percentage) to pixels for camera calculation
        const mapRect = townCenter.getBoundingClientRect();
        const playerX = (this.position.x / 100) * mapRect.width;
        const playerY = (this.position.y / 100) * mapRect.height;
        
        // Get viewport dimensions
        const gameWorld = document.getElementById('game-world');
        if (!gameWorld) return;
        
        const viewportRect = gameWorld.getBoundingClientRect();
        const viewportCenterX = viewportRect.width / 2;
        const viewportCenterY = viewportRect.height / 2;
        
        // Calculate desired camera position to center player
        let cameraX = viewportCenterX - playerX;
        let cameraY = viewportCenterY - playerY;
        
        // Constrain camera to map boundaries
        const maxOffsetX = Math.max(0, mapRect.width - viewportRect.width);
        const maxOffsetY = Math.max(0, mapRect.height - viewportRect.height);
        
        cameraX = Math.max(-maxOffsetX, Math.min(0, cameraX));
        cameraY = Math.max(-maxOffsetY, Math.min(0, cameraY));
        
        // Apply smooth camera movement
        townCenter.style.transform = `translate(${cameraX}px, ${cameraY}px)`;
        townCenter.style.transition = 'transform 0.1s ease-out';
    }

    // Toggle camera following
    toggleCamera() {
        this.cameraEnabled = !this.cameraEnabled;
        this.updateCamera(); // Apply the change immediately
        
        // Show notification to user
        const message = this.cameraEnabled ? 
            "📷 Camera following enabled! Map will follow player." : 
            "📷 Camera following disabled! Static map view.";
        this.showNotification(message);
        
        console.log(`Camera following: ${this.cameraEnabled ? 'enabled' : 'disabled'}`);
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

        // Get dynamic boundaries
        const boundaries = this.getBoundaries();
        const { minX, maxX, minY, maxY } = boundaries;

        const newPosition = {
            x: Math.max(minX, Math.min(maxX, this.position.x + moveX)),
            y: Math.max(minY, Math.min(maxY, this.position.y + moveY))
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
            this.unlockedRestaurants = state.unlockedRestaurants || ['italian', 'chinese', 'mexican', 'american', 'indian', 'thai'];

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

    // Cleanup method for proper memory management
    cleanup() {
        this.keysPressed.clear();
        this.element.classList.remove('walking');
    }
}

// Create global player instance
window.gamePlayer = new Player();
