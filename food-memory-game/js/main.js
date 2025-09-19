// Main.js - Entry point and initialization
class GameMain {
    constructor() {
        this.initialized = false;
        this.version = "1.0.0";
        this.debugMode = false;

        this.init();
    }

    init() {
        // Wait for DOM to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.startInitialization();
            });
        } else {
            this.startInitialization();
        }
    }

    startInitialization() {
        console.log('🎮 Initializing The Great Food Amnesia Game v' + this.version);

        // Initialize game systems in order
        this.checkDependencies();
        this.setupGlobalErrorHandling();
        this.setupPerformanceMonitoring();
        this.registerServiceWorker();
        this.setupGameHotkeys();
        this.setupMobileOptimizations();
        this.handleSpecialEvents();

        // Mark as initialized
        this.initialized = true;
        console.log('✅ Game initialization complete!');

        // Start the actual game (GameEngine handles the rest)
        this.startGameLoop();
    }

    checkDependencies() {
        const requiredSystems = [
            'gameDatabase',
            'gameClueSystem',
            'gameDialogSystem',
            'gamePlayer',
            'gameEngine'
        ];

        const missingDependencies = requiredSystems.filter(system => !window[system]);

        if (missingDependencies.length > 0) {
            console.error('❌ Missing game systems:', missingDependencies);
            this.showCriticalError('Failed to load game systems: ' + missingDependencies.join(', '));
            return false;
        }

        console.log('✅ All game systems loaded successfully');
        return true;
    }

    setupGlobalErrorHandling() {
        window.addEventListener('error', (e) => {
            console.error('🚨 Game Error:', e.error);

            if (!this.debugMode) {
                this.handleGameError(e.error);
            }
        });

        window.addEventListener('unhandledrejection', (e) => {
            console.error('🚨 Unhandled Promise Rejection:', e.reason);

            if (!this.debugMode) {
                e.preventDefault();
                this.handleGameError(e.reason);
            }
        });
    }

    setupPerformanceMonitoring() {
        // Monitor game performance
        let frameCount = 0;
        let lastTime = performance.now();

        const monitorPerformance = () => {
            frameCount++;
            const currentTime = performance.now();

            if (currentTime - lastTime >= 5000) { // Every 5 seconds
                const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));

                if (this.debugMode) {
                    console.log('📊 Performance: ~' + fps + ' FPS');
                }

                frameCount = 0;
                lastTime = currentTime;
            }

            requestAnimationFrame(monitorPerformance);
        };

        requestAnimationFrame(monitorPerformance);
    }

    registerServiceWorker() {
        // Register service worker for offline play (if available)
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./sw.js')
                .then(registration => {
                    console.log('📱 Service Worker registered for offline play');
                })
                .catch(error => {
                    console.log('Service Worker registration failed (optional feature)');
                });
        }
    }

    setupGameHotkeys() {
        document.addEventListener('keydown', (e) => {
            // Debug mode toggle (Ctrl + Shift + D)
            if (e.ctrlKey && e.shiftKey && e.key === 'D') {
                this.toggleDebugMode();
                e.preventDefault();
            }

            // Quick save (Ctrl + S)
            if (e.ctrlKey && e.key === 's') {
                if (window.gameEngine) {
                    window.gameEngine.saveGame();
                }
                e.preventDefault();
            }

            // Help/controls (F1)
            if (e.key === 'F1') {
                this.showHelpDialog();
                e.preventDefault();
            }

            // Full screen toggle (F11 alternative for web)
            if (e.key === 'F' && e.ctrlKey) {
                this.toggleFullscreen();
                e.preventDefault();
            }
        });
    }

    setupMobileOptimizations() {
        // Detect mobile device
        const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        if (isMobile) {
            document.body.classList.add('mobile-device');

            // Prevent zoom on double tap
            let lastTouchEnd = 0;
            document.addEventListener('touchend', (e) => {
                const now = new Date().getTime();
                if (now - lastTouchEnd <= 300) {
                    e.preventDefault();
                }
                lastTouchEnd = now;
            }, false);

            // Prevent context menu on long press
            document.addEventListener('contextmenu', (e) => {
                e.preventDefault();
            });

            console.log('📱 Mobile optimizations applied');
        }

        // Handle orientation changes
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.handleOrientationChange();
            }, 100);
        });
    }

    handleOrientationChange() {
        // Force layout recalculation
        const gameContainer = document.getElementById('game-container');
        if (gameContainer) {
            gameContainer.style.height = window.innerHeight + 'px';
        }

        // Update player position if needed
        if (window.gamePlayer) {
            window.gamePlayer.updatePosition();
        }
    }

    handleSpecialEvents() {
        // Handle page visibility changes (pause/resume game)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseGame();
            } else {
                this.resumeGame();
            }
        });

        // Handle window focus/blur
        window.addEventListener('blur', () => {
            this.pauseGame();
        });

        window.addEventListener('focus', () => {
            this.resumeGame();
        });

        // Handle before unload (warn about unsaved progress)
        window.addEventListener('beforeunload', (e) => {
            if (this.hasUnsavedProgress()) {
                e.preventDefault();
                e.returnValue = 'You have unsaved progress. Are you sure you want to leave?';
                return e.returnValue;
            }
        });
    }

    startGameLoop() {
        // Main game loop for updates
        const gameLoop = () => {
            if (this.initialized && window.gameEngine) {
                this.updateGame();
            }
            requestAnimationFrame(gameLoop);
        };

        requestAnimationFrame(gameLoop);
    }

    updateGame() {
        // Update game systems each frame
        const currentTime = performance.now();

        // Update any time-based game logic here
        if (this.lastUpdateTime) {
            const deltaTime = currentTime - this.lastUpdateTime;

            // Example: Update animations, check for timed events, etc.
            this.updateTimedEvents(deltaTime);
        }

        this.lastUpdateTime = currentTime;
    }

    updateTimedEvents(deltaTime) {
        // Handle any timed game events
        // This could include:
        // - Animation updates
        // - Automatic progress checks
        // - Background processes
    }

    // Game state management
    pauseGame() {
        console.log('⏸️ Game paused');
        const bgMusic = document.getElementById('background-music');
        if (bgMusic && !bgMusic.paused) {
            bgMusic.pause();
            this.musicWasPaused = true;
        }
    }

    resumeGame() {
        console.log('▶️ Game resumed');
        const bgMusic = document.getElementById('background-music');
        if (bgMusic && this.musicWasPaused && window.gameEngine && window.gameEngine.musicEnabled) {
            bgMusic.play().catch(e => console.log('Music resume failed:', e));
            this.musicWasPaused = false;
        }
    }

    hasUnsavedProgress() {
        // Check if there's unsaved progress
        if (window.gameClueSystem) {
            const stats = window.gameClueSystem.getGameStats();
            return stats.totalClues > 0 && !window.fullGameSave;
        }
        return false;
    }

    // Debug and utility functions
    toggleDebugMode() {
        this.debugMode = !this.debugMode;
        document.body.classList.toggle('debug-mode', this.debugMode);

        console.log('🐛 Debug mode:', this.debugMode ? 'ON' : 'OFF');

        if (this.debugMode) {
            this.showDebugInfo();
        } else {
            this.hideDebugInfo();
        }
    }

    showDebugInfo() {
        // Create debug overlay
        if (!document.getElementById('debug-overlay')) {
            const debugOverlay = document.createElement('div');
            debugOverlay.id = 'debug-overlay';
            debugOverlay.style.cssText = `
                position: fixed;
                top: 10px;
                left: 10px;
                background: rgba(0, 0, 0, 0.8);
                color: lime;
                font-family: monospace;
                font-size: 12px;
                padding: 10px;
                border-radius: 5px;
                z-index: 9999;
                pointer-events: none;
                max-width: 300px;
            `;
            document.body.appendChild(debugOverlay);
        }

        this.updateDebugInfo();

        // Update debug info periodically
        this.debugInterval = setInterval(() => {
            this.updateDebugInfo();
        }, 1000);
    }

    updateDebugInfo() {
        const debugOverlay = document.getElementById('debug-overlay');
        if (!debugOverlay) return;

        const stats = window.gameClueSystem ? window.gameClueSystem.getGameStats() : {};
        const playerPos = window.gamePlayer ? window.gamePlayer.getPosition() : { x: 0, y: 0 };
        const gameState = window.gameEngine ? window.gameEngine.getGameState() : {};

        debugOverlay.innerHTML = `
            <strong>DEBUG INFO</strong><br>
            Game Version: ${this.version}<br>
            Game State: ${gameState.state}<br>
            Current View: ${gameState.view}<br>
            Player Position: (${Math.round(playerPos.x)}, ${Math.round(playerPos.y)})<br>
            Total Clues: ${stats.totalClues || 0}/${stats.maxClues || 0}<br>
            Solved Customers: ${stats.solvedCustomers || 0}/${stats.totalCustomers || 0}<br>
            Memory Usage: ${this.getMemoryUsage()}<br>
            FPS: ~${this.getCurrentFPS()}<br>
        `;
    }

    hideDebugInfo() {
        const debugOverlay = document.getElementById('debug-overlay');
        if (debugOverlay) {
            debugOverlay.remove();
        }

        if (this.debugInterval) {
            clearInterval(this.debugInterval);
            this.debugInterval = null;
        }
    }

    getMemoryUsage() {
        if ('memory' in performance) {
            const mem = performance.memory;
            return Math.round(mem.usedJSHeapSize / 1024 / 1024) + ' MB';
        }
        return 'N/A';
    }

    getCurrentFPS() {
        return this.currentFPS || '60';
    }

    // Help and tutorial functions
    showHelpDialog() {
        if (window.gameDialogSystem) {
            window.gameDialogSystem.showDialog({
                speaker: "Game Help",
                text: `🎮 THE GREAT FOOD AMNESIA - CONTROLS & HELP

Movement:
• Arrow Keys or WASD - Move around town
• Click/Tap NPCs or Restaurants to interact
• Space/Enter - Interact with nearby objects

Investigation:
• Visit restaurants to gather evidence
• Talk to NPCs to learn about their memory problems
• Use your Investigation Notebook (I key) to review clues
• Match evidence with the right people to restore memories

Shortcuts:
• I - Open/Close Investigation Notebook
• M - Toggle Background Music
• Ctrl+S - Quick Save Game
• ESC - Close dialogs/Return to town
• F1 - Show this help

Goal: Help all 5 townspeople remember their favorite foods by investigating restaurants and collecting clues!`,
                choices: [
                    { text: "Got it! Let me continue investigating.", action: "close" }
                ]
            });
        }
    }

    toggleFullscreen() {
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            document.documentElement.requestFullscreen().catch(e => {
                console.log('Fullscreen not supported');
            });
        }
    }

    // Error handling
    handleGameError(error) {
        console.error('Handling game error:', error);

        // Try to recover gracefully
        const errorMessage = error.message || 'An unknown error occurred';

        // Show user-friendly error
        this.showGameError(errorMessage);
    }

    showGameError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #e74c3c;
            color: white;
            padding: 20px;
            border-radius: 10px;
            font-family: inherit;
            z-index: 10001;
            max-width: 400px;
            text-align: center;
        `;

        errorDiv.innerHTML = `
            <h3>🚨 Game Error</h3>
            <p>${message}</p>
            <button onclick="location.reload()" style="
                background: #c0392b;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
                margin-top: 10px;
            ">Restart Game</button>
        `;

        document.body.appendChild(errorDiv);
    }

    showCriticalError(message) {
        document.body.innerHTML = `
            <div style="
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                height: 100vh;
                background: linear-gradient(135deg, #e74c3c, #c0392b);
                color: white;
                font-family: 'Courier New', monospace;
                text-align: center;
                padding: 20px;
            ">
                <h1>🚨 Critical Game Error</h1>
                <p style="font-size: 18px; margin: 20px 0;">${message}</p>
                <button onclick="location.reload()" style="
                    background: rgba(255,255,255,0.2);
                    color: white;
                    border: 2px solid white;
                    padding: 15px 30px;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 16px;
                    font-family: inherit;
                ">Reload Game</button>
            </div>
        `;
    }

    // Utility methods
    getVersion() {
        return this.version;
    }

    isInitialized() {
        return this.initialized;
    }

    isDebugMode() {
        return this.debugMode;
    }
}

// Initialize the game when script loads
console.log('🎮 Starting The Great Food Amnesia...');

// Create global main game instance
window.gameMain = new GameMain();

// Add some global utility functions for console debugging
if (typeof window !== 'undefined') {
    window.gameDebug = {
        addClue: (restaurantId) => {
            const clues = window.gameClueSystem.investigateRestaurant(restaurantId);
            clues.forEach(clue => window.gameClueSystem.addClue(clue));
            console.log('Added clues for restaurant', restaurantId);
        },

        unlockAllRestaurants: () => {
            ['chinese', 'mexican', 'american', 'indian'].forEach(type => {
                window.gamePlayer.unlockRestaurant(type);
            });
            console.log('All restaurants unlocked');
        },

        solveAllCustomers: () => {
            ['alice', 'bob', 'carol', 'david', 'eve'].forEach(customer => {
                const customerId = window.gameClueSystem.getCustomerIdByName(customer);
                window.gameClueSystem.customerMemories[customer].solved = true;
                window.gameClueSystem.completeCustomerMemory(customer);
            });
            console.log('All customers solved');
        },

        getStats: () => {
            return window.gameClueSystem.getGameStats();
        }
    };
}

console.log('✅ The Great Food Amnesia is ready to play!');
