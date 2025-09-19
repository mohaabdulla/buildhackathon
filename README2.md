# 🍕 The Great Food Amnesia - A Food Memory Detective Game

A dialog-focused detective game where players help townspeople recover their lost food memories by investigating restaurants and analyzing database records.

## 🎮 Game Overview

A mysterious event has caused everyone in town to forget their favorite foods! As a food detective, you must:

- **Explore** different restaurants around town
- **Investigate** order histories, reviews, and menu data
- **Talk** to NPCs who have lost their food memories
- **Collect** clues from restaurant databases
- **Match** evidence with the right people to restore their memories
- **Unlock** new areas as you make progress

## 🎯 Gameplay Features

### Dialog-Driven Investigation
- Rich conversations with 5 unique NPCs (Alice, Bob, Carol, David, Eve)
- Dynamic dialog that changes based on your progress
- Clue-sharing system to help NPCs remember their preferences

### Database Detective Work
- Investigate 5 restaurants with different cuisines (Italian, Chinese, Mexican, American, Indian)
- Analyze real database tables: Users, Restaurants, Menu Items, Orders, Order Items, Reviews
- Extract meaningful clues from order patterns, customer reviews, and purchase history

### Progressive Unlocking
- Start with 1 restaurant unlocked, earn access to more through investigation
- 14+ total clues to discover across all restaurants
- Multiple difficulty levels based on how many clues each NPC needs

### Pixelated Retro Style
- Pixel art aesthetic with SVG placeholder assets
- Retro-inspired UI with investigation notebook
- Atmospheric background music and sound effects

## 🗂️ Database Integration

The game makes full use of all database tables:

- **USERS**: NPCs with different roles (customers, restaurant owners, drivers)
- **RESTAURANTS**: 5 unique establishments with distinct cuisines and data
- **MENU_ITEMS**: 20+ food items across all restaurants
- **ORDERS**: Historical purchase data showing customer preferences
- **ORDER_ITEMS**: Detailed breakdown of what people ordered
- **REVIEWS**: Customer feedback revealing food preferences and satisfaction

## 🎮 Controls

### Desktop
- **Arrow Keys / WASD**: Move player character
- **Space / Enter**: Interact with nearby NPCs or restaurants
- **I Key**: Open/Close Investigation Notebook
- **M Key**: Toggle background music
- **Ctrl+S**: Quick save game
- **ESC**: Close dialogs or return to town
- **F1**: Show help dialog

### Mobile
- **Tap**: Move towards or interact with objects
- **Swipe**: Move player character
- **Touch Controls**: All buttons are touch-friendly

## 📁 Project Structure

```
food-memory-game/
├── index.html              # Main game page
├── README.md               # This file
├── css/
│   └── styles.css          # All game styling
├── js/
│   ├── main.js            # Game initialization and main loop
│   ├── gameEngine.js      # Core game logic and restaurant investigation
│   ├── database.js        # Simulated database with sample data
│   ├── clueSystem.js      # Clue discovery and memory restoration
│   ├── dialogSystem.js    # NPC conversations and interactions
│   └── player.js          # Player movement and interaction
└── assets/
    ├── images/            # SVG placeholder files for pixel art
    │   ├── player.svg
    │   ├── restaurants/   # Restaurant building images
    │   ├── npcs/         # Character sprites
    │   ├── ui/           # Interface elements
    │   └── background/   # Map and scenery
    └── sounds/           # Audio files
        ├── background-music.wav
        ├── dialog-beep.wav
        ├── clue-found.wav
        └── success.wav
```

## 🚀 Setup Instructions

1. **Create the directory structure:**
```bash
# Run the mkdir/touch commands from the game structure
mkdir food-memory-game
cd food-memory-game
mkdir css js assets assets/images assets/sounds
# ... (complete structure as shown above)
```

2. **Add the game files:**
    - Copy each file's content from the artifacts
    - Replace SVG placeholders with your pixel art images
    - Add audio files for sound effects and music

3. **Serve the game:**
```bash
# Using Python (if available)
python -m http.server 8000

# Using Node.js http-server (if available)  
npx http-server

# Or simply open index.html in a web browser
```

## 🎨 Asset Customization

The game uses SVG placeholders for all visual assets. Replace these with your pixel art:

### Required Images
- **Player**: 48x48px character sprite
- **NPCs**: 48x48px for each character (Alice, Bob, Carol, David, Eve)
- **Restaurants**: 64x64px building sprites for each cuisine type
- **UI Elements**: Dialog boxes, inventory backgrounds, icons
- **Background**: Town map illustration

### Audio Assets
- **Background Music**: Looping ambient track
- **Sound Effects**: Dialog beeps, success sounds, clue discovery

## 🕹️ NPCs and Their Food Preferences

- **Alice** (Italian Lover): Pasta, pizza, tiramisu - needs 3 clues
- **Bob** (Chinese & Mexican Fan): Sweet and sour dishes, burritos - needs 3 clues
- **Carol** (American Comfort Food): Burgers, wings, milkshakes - needs 2 clues
- **David** (Indian Cuisine Enthusiast): Curry, biryani, lassi - needs 2 clues
- **Eve** (Culinary Explorer): Diverse tastes, tries everything - needs 4 clues

## 🔧 Technical Features

- **Progressive Web App**: Offline play capability
- **Responsive Design**: Works on desktop and mobile
- **Save System**: Game progress persistence (in-memory)
- **Performance Monitoring**: FPS tracking and optimization
- **Error Handling**: Graceful error recovery
- **Debug Mode**: Development tools and console commands

## 🎯 Win Condition

Successfully help all 5 NPCs recover their food memories by:
1. Investigating all restaurants to gather clues
2. Matching the right evidence with each person
3. Completing their memory restoration through dialog

## 🛠️ Debug Commands

Open browser console and use:
```javascript
// Add clues for a specific restaurant
gameDebug.addClue(1); // Restaurant ID

// Unlock all restaurants
gameDebug.unlockAllRestaurants();

// Complete all customer memories (cheat)
gameDebug.solveAllCustomers();

// Check current game statistics
gameDebug.getStats();
```

## 📝 Development Notes

- Built with vanilla JavaScript (no frameworks)
- Uses modern ES6+ features
- Modular architecture with separate systems
- Browser storage not used (artifact limitation)
- Designed for educational and entertainment purposes

## 🎵 Credits

- Game concept: Food delivery database detective story
- Design: Retro pixel art aesthetic
- Programming: Modern JavaScript game architecture
- Database: Realistic food delivery simulation data

---

**Have fun helping everyone remember their favorite foods!** 🍜🍕🍜

For questions or issues, check the browser console for debug information.
