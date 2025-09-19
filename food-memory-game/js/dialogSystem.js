// DialogSystem.js - Manages all dialog interactions and conversations
class DialogSystem {
    constructor() {
        this.currentDialog = null;
        this.dialogHistory = [];
        this.isDialogOpen = false;
        this.typewriterSpeed = 50; // milliseconds per character
        this.setupEventListeners();
        this.initializeDialogs();
    }

    initializeDialogs() {
        this.dialogs = {
            // Alice's dialogs (Italian food lover)
            alice: {
                initial: {
                    speaker: "Alice",
                    text: "Oh hello there! I'm so confused... I feel like I used to love food, but I can't remember what I liked to eat at all! Could you help me figure out my favorite foods?",
                    choices: [
                        { text: "I'll help you remember what you love to eat!", action: "accept_alice" },
                        { text: "What do you remember about food?", action: "alice_memories" },
                        { text: "Maybe later.", action: "close" }
                    ]
                },
                accept_alice: {
                    speaker: "Alice",
                    text: "Thank you so much! I have this strange feeling that I really enjoyed some kind of cuisine... maybe something with pasta? And I think I loved desserts too. Please investigate around town and see what you can find!",
                    choices: [
                        { text: "I'll look for clues about your food preferences.", action: "close" }
                    ]
                },
                alice_memories: {
                    speaker: "Alice",
                    text: "I have these vague memories of warm, comforting meals... something with cheese and tomatoes? And I remember feeling really happy after eating something sweet and coffee-flavored. It's all so fuzzy!",
                    choices: [
                        { text: "I'll help you remember!", action: "accept_alice" },
                        { text: "Interesting clues. Let me investigate.", action: "close" }
                    ]
                },
                clue_found: {
                    speaker: "Alice",
                    text: "Did you find something about my food preferences? I'm so eager to remember what I used to love eating!",
                    choices: [
                        { text: "Let me check my investigation notes.", action: "show_clues_alice" },
                        { text: "Still investigating. I'll be back!", action: "close" }
                    ]
                },
                solved: {
                    speaker: "Alice",
                    text: "OH MY GOODNESS! Yes! I remember now! I absolutely LOVE Italian food! Pasta carbonara, margherita pizza, and tiramisu are my favorites! Thank you so much for helping me remember. I feel like myself again!",
                    choices: [
                        { text: "I'm so happy you remembered! Enjoy your Italian food!", action: "close" }
                    ]
                }
            },

            // Bob's dialogs (Chinese and Mexican food lover)
            bob: {
                initial: {
                    speaker: "Bob",
                    text: "Hey there! Man, this is so weird... I know I used to be really passionate about food, but I can't remember any of my favorites. I think I liked spicy stuff and maybe some international cuisines?",
                    choices: [
                        { text: "I can help you rediscover your favorite foods!", action: "accept_bob" },
                        { text: "Tell me more about what you might remember.", action: "bob_memories" },
                        { text: "Sorry, I'm busy right now.", action: "close" }
                    ]
                },
                accept_bob: {
                    speaker: "Bob",
                    text: "That would be awesome! I have this feeling I loved trying different flavors from around the world. Maybe something with rice? And I remember liking things wrapped in tortillas or served with peppers. Can you investigate for me?",
                    choices: [
                        { text: "I'll search for clues about your food preferences.", action: "close" }
                    ]
                },
                bob_memories: {
                    speaker: "Bob",
                    text: "I remember really enjoying meals that had a lot of flavor and spice. Something tells me I liked food that came with fortune cookies, and also food that was served with guacamole. Does that ring any bells?",
                    choices: [
                        { text: "Those are great clues! I'll investigate.", action: "accept_bob" },
                        { text: "Interesting... let me look around town.", action: "close" }
                    ]
                },
                clue_found: {
                    speaker: "Bob",
                    text: "Hey! Any luck finding information about what I used to love eating? I'm really hoping to remember my favorite flavors!",
                    choices: [
                        { text: "Let me show you what I've discovered.", action: "show_clues_bob" },
                        { text: "Still gathering evidence. Be right back!", action: "close" }
                    ]
                },
                solved: {
                    speaker: "Bob",
                    text: "WOW! That's it! I remember now! I love Chinese food - especially sweet and sour pork and kung pao chicken! And Mexican food too - chicken burritos and fresh guacamole! Thanks for helping me remember my favorites!",
                    choices: [
                        { text: "Great! Now you can enjoy your favorite cuisines again!", action: "close" }
                    ]
                }
            },

            // Carol's dialogs (American food lover)
            carol: {
                initial: {
                    speaker: "Carol",
                    text: "Hi! I'm feeling so lost... I know I used to have favorite comfort foods, but I can't remember what they were. I think I liked classic, hearty meals. Can you help me figure out what I enjoyed eating?",
                    choices: [
                        { text: "I'd be happy to help you remember!", action: "accept_carol" },
                        { text: "What kind of comfort foods do you think you liked?", action: "carol_memories" },
                        { text: "Not right now, sorry.", action: "close" }
                    ]
                },
                accept_carol: {
                    speaker: "Carol",
                    text: "Thank you! I have this feeling I really enjoyed classic American dishes. Maybe something with beef patties? And I think I loved crispy, salty sides and cold, creamy drinks. Please see what you can find!",
                    choices: [
                        { text: "I'll investigate and find your favorite comfort foods.", action: "close" }
                    ]
                },
                carol_memories: {
                    speaker: "Carol",
                    text: "I remember really enjoying meals that were satisfying and familiar. Something tells me I loved food that came with pickles, and drinks that were thick and sweet. And maybe something with buffalo sauce?",
                    choices: [
                        { text: "Those sound like American classics! I'll investigate.", action: "accept_carol" },
                        { text: "Let me look around for those kinds of foods.", action: "close" }
                    ]
                },
                clue_found: {
                    speaker: "Carol",
                    text: "Did you find anything about my food preferences? I'm really hoping to remember what comfort foods I used to love!",
                    choices: [
                        { text: "I found some interesting information for you.", action: "show_clues_carol" },
                        { text: "Still investigating! I'll come back soon.", action: "close" }
                    ]
                },
                solved: {
                    speaker: "Carol",
                    text: "YES! I remember everything now! I love classic American food - cheeseburgers, buffalo wings, french fries, and chocolate milkshakes! These are my ultimate comfort foods. Thank you so much for helping me remember!",
                    choices: [
                        { text: "Perfect! Now you can enjoy your comfort foods again!", action: "close" }
                    ]
                }
            },

            // David's dialogs (Indian food lover)
            david: {
                initial: {
                    speaker: "David",
                    text: "Hello! I'm in quite a predicament. I know I used to be passionate about richly spiced cuisine, but I can't remember which one. I think I loved complex flavors and aromatic dishes. Could you help me remember?",
                    choices: [
                        { text: "I'll help you rediscover your favorite cuisine!", action: "accept_david" },
                        { text: "Tell me about the spiced food you remember.", action: "david_memories" },
                        { text: "I can't help right now.", action: "close" }
                    ]
                },
                accept_david: {
                    speaker: "David",
                    text: "Wonderful! I recall loving dishes with incredible depth of flavor - lots of spices and herbs. I think I enjoyed creamy sauces with tender meat, and maybe some yogurt-based drinks? Please investigate for me!",
                    choices: [
                        { text: "I'll search for information about your spiced cuisine.", action: "close" }
                    ]
                },
                david_memories: {
                    speaker: "David",
                    text: "I remember dishes that had curry-like sauces and fragrant rice. I think I really enjoyed food that was served with various spices and maybe some flatbreads. And I recall loving a sweet, creamy drink with fruit.",
                    choices: [
                        { text: "Those sound like Indian cuisine clues! I'll investigate.", action: "accept_david" },
                        { text: "Let me look for restaurants with those dishes.", action: "close" }
                    ]
                },
                clue_found: {
                    speaker: "David",
                    text: "Have you discovered anything about my favorite spiced cuisine? I'm very curious to remember what dishes I used to love!",
                    choices: [
                        { text: "I have some findings to share with you.", action: "show_clues_david" },
                        { text: "Still researching! Almost done.", action: "close" }
                    ]
                },
                solved: {
                    speaker: "David",
                    text: "INCREDIBLE! Yes, that's exactly right! I absolutely love Indian food! Chicken tikka masala, vegetable biryani, samosas, and mango lassi are my favorites! The spices, the flavors - I remember it all now. Thank you for helping me rediscover my passion!",
                    choices: [
                        { text: "Excellent! Now you can enjoy those amazing Indian flavors again!", action: "close" }
                    ]
                }
            },

            // Eve's dialogs (Diverse taste lover)
            eve: {
                initial: {
                    speaker: "Eve",
                    text: "Oh hello! I'm having the strangest experience. I feel like I used to love exploring different types of food from all over the world, but I can't remember any specific preferences. I think I was quite adventurous with my eating habits!",
                    choices: [
                        { text: "I'll help you remember your food adventures!", action: "accept_eve" },
                        { text: "What do you recall about your adventurous eating?", action: "eve_memories" },
                        { text: "Maybe another time.", action: "close" }
                    ]
                },
                accept_eve: {
                    speaker: "Eve",
                    text: "That's wonderful! I have this strong feeling that I didn't stick to just one type of cuisine. I think I enjoyed trying dishes from many different cultures - Italian, Chinese, Mexican, American, Indian... all of them! Can you investigate my diverse food history?",
                    choices: [
                        { text: "I'll look into your multicultural food preferences.", action: "close" }
                    ]
                },
                eve_memories: {
                    speaker: "Eve",
                    text: "I remember feeling excited about trying new flavors and cuisines. I think I was the type of person who would order something different every time, exploring tastes from around the world. I loved the adventure of discovering new dishes!",
                    choices: [
                        { text: "What an exciting food journey! I'll investigate.", action: "accept_eve" },
                        { text: "Sounds like you have diverse tastes to rediscover.", action: "close" }
                    ]
                },
                clue_found: {
                    speaker: "Eve",
                    text: "Have you learned anything about my food adventures? I'm excited to remember all the different cuisines I used to explore!",
                    choices: [
                        { text: "I've gathered quite a bit of evidence about your food journey.", action: "show_clues_eve" },
                        { text: "Still collecting data on your diverse tastes!", action: "close" }
                    ]
                },
                solved: {
                    speaker: "Eve",
                    text: "OH WOW! That's perfect! I remember now - I love trying EVERYTHING! Italian carbonara, Chinese sweet and sour pork, Mexican burritos, American cheeseburgers, and Indian tikka masala! I'm a culinary explorer who loves discovering flavors from all around the world. Thank you for helping me remember my adventurous spirit!",
                    choices: [
                        { text: "Amazing! Now you can continue your culinary world tour!", action: "close" }
                    ]
                }
            },

            // Tutorial/Introduction dialog
            intro: {
                initial: {
                    speaker: "Food Detective",
                    text: "Welcome to the Great Food Amnesia investigation! A mysterious event has caused everyone in town to forget their favorite foods. As a food detective, you must help them remember by investigating restaurants and gathering clues about their past dining preferences.",
                    choices: [
                        { text: "I'm ready to help restore everyone's food memories!", action: "close" }
                    ]
                }
            }
        };
    }

    setupEventListeners() {
        // Dialog close button
        document.getElementById('dialog-close')?.addEventListener('click', () => {
            this.closeDialog();
        });

        // Dialog continue button
        document.getElementById('dialog-continue')?.addEventListener('click', () => {
            this.continueDialog();
        });

        // ESC key to close dialog
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isDialogOpen) {
                this.closeDialog();
            }
        });
    }

    // Start a dialog with an NPC
    startDialog(npcId, dialogKey = 'initial') {
        const npcDialogs = this.dialogs[npcId];
        if (!npcDialogs) return;

        // Check if customer is already solved
        const customerStatus = window.gameClueSystem.getCustomerStatus(npcId);
        if (customerStatus.solved) {
            dialogKey = 'solved';
        } else if (customerStatus.cluesFound > 0) {
            dialogKey = 'clue_found';
        }

        const dialog = npcDialogs[dialogKey];
        if (!dialog) return;

        this.currentDialog = {
            npcId: npcId,
            dialogKey: dialogKey,
            dialog: dialog
        };

        this.showDialog(dialog);
        this.playDialogSound();
    }

    // Display the dialog on screen
    showDialog(dialog) {
        const container = document.getElementById('dialog-container');
        const speakerName = document.getElementById('speaker-name');
        const dialogText = document.getElementById('dialog-text');
        const dialogChoices = document.getElementById('dialog-choices');
        const continueBtn = document.getElementById('dialog-continue');

        if (!container || !speakerName || !dialogText || !dialogChoices) return;

        container.classList.remove('hidden');
        this.isDialogOpen = true;

        speakerName.textContent = dialog.speaker;

        // Clear previous content
        dialogText.textContent = '';
        dialogChoices.innerHTML = '';
        continueBtn.classList.add('hidden');

        // Typewriter effect for dialog text
        this.typeWriterEffect(dialogText, dialog.text, () => {
            this.showChoices(dialog.choices);
        });
    }

    // Typewriter effect for dialog text
    typeWriterEffect(element, text, callback) {
        let i = 0;
        const timer = setInterval(() => {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
            } else {
                clearInterval(timer);
                if (callback) callback();
            }
        }, this.typewriterSpeed);
    }

    // Show dialog choices
    showChoices(choices) {
        const dialogChoices = document.getElementById('dialog-choices');
        if (!dialogChoices) return;

        choices.forEach(choice => {
            const button = document.createElement('button');
            button.className = 'dialog-choice';
            button.textContent = choice.text;
            button.addEventListener('click', () => {
                this.handleChoice(choice.action);
            });
            dialogChoices.appendChild(button);
        });
    }

    // Handle choice selection
    handleChoice(action) {
        if (action === 'close') {
            this.closeDialog();
        } else if (action.startsWith('show_clues_')) {
            const customerKey = action.replace('show_clues_', '');
            this.showCluesForCustomer(customerKey);
        } else {
            // Navigate to another dialog
            const npcId = this.currentDialog.npcId;
            this.startDialog(npcId, action);
        }
    }

    // Show available clues for a customer
    showCluesForCustomer(customerKey) {
        const availableClues = window.gameClueSystem.getCluesForCustomer(customerKey);
        const customerStatus = window.gameClueSystem.getCustomerStatus(customerKey);

        if (availableClues.length === 0) {
            this.showDialog({
                speaker: "Food Detective",
                text: `I haven't found enough clues about ${customerKey}'s food preferences yet. I need to investigate more restaurants around town to gather evidence.`,
                choices: [
                    { text: "I'll continue investigating.", action: "close" }
                ]
            });
            return;
        }

        // Show clue selection dialog
        let clueText = `I found some interesting information about ${customerKey}'s food preferences!\n\n`;
        clueText += `Progress: ${customerStatus.cluesFound}/${customerStatus.cluesNeeded} clues found\n\n`;
        clueText += "Evidence discovered:\n";

        availableClues.forEach((clue, index) => {
            clueText += `${index + 1}. ${clue.title}\n`;
        });

        const choices = availableClues.map((clue, index) => ({
            text: `Use Evidence: ${clue.title}`,
            action: `use_clue_${clue.id}`
        }));

        choices.push({ text: "Save evidence for later", action: "close" });

        this.showDialog({
            speaker: "Food Detective",
            text: clueText,
            choices: choices
        });

        // Add special handling for clue usage
        this.setupClueUsageHandlers(customerKey);
    }

    setupClueUsageHandlers(customerKey) {
        // Override choice handler temporarily for clue usage
        const originalHandler = this.handleChoice.bind(this);
        this.handleChoice = (action) => {
            if (action.startsWith('use_clue_')) {
                const clueId = action.replace('use_clue_', '');
                this.useClueForCustomer(customerKey, clueId);
            } else {
                originalHandler(action);
            }
        };
    }

    useClueForCustomer(customerKey, clueId) {
        const customerId = window.gameClueSystem.getCustomerIdByName(customerKey);
        const success = window.gameClueSystem.useClueForCustomer(customerId, clueId);

        if (success) {
            const customerStatus = window.gameClueSystem.getCustomerStatus(customerKey);

            if (customerStatus.solved) {
                this.showDialog({
                    speaker: "Food Detective",
                    text: `Perfect! The evidence helped ${customerKey} remember their food preferences completely! They now recall all their favorite dishes.`,
                    choices: [
                        { text: "Excellent! Let me tell them the good news.", action: "close" }
                    ]
                });
            } else {
                this.showDialog({
                    speaker: "Food Detective",
                    text: `Good progress! The evidence helped ${customerKey} remember more about their food preferences. Progress: ${customerStatus.cluesFound}/${customerStatus.cluesNeeded} clues found. I need to find ${customerStatus.cluesNeeded - customerStatus.cluesFound} more clue(s).`,
                    choices: [
                        { text: "I'll continue investigating for more evidence.", action: "close" }
                    ]
                });
            }
        } else {
            this.showDialog({
                speaker: "Food Detective",
                text: `This evidence doesn't seem to help ${customerKey} remember their food preferences. I should look for more relevant clues.`,
                choices: [
                    { text: "I'll find better evidence.", action: "close" }
                ]
            });
        }

        // Restore original handler
        this.handleChoice = this.handleChoice.bind(this);
    }

    // Close the dialog
    closeDialog() {
        const container = document.getElementById('dialog-container');
        if (container) {
            container.classList.add('hidden');
        }
        this.isDialogOpen = false;
        this.currentDialog = null;
    }

    continueDialog() {
        // Implementation for continuing dialog if needed
        this.closeDialog();
    }

    // Play dialog sound effect
    playDialogSound() {
        const sound = document.getElementById('dialog-beep');
        if (sound) sound.play().catch(e => console.log('Audio play failed:', e));
    }

    // Show tutorial dialog
    showTutorial() {
        this.startDialog('intro', 'initial');
    }

    // Get current dialog state
    getCurrentDialog() {
        return this.currentDialog;
    }

    // Check if dialog is currently open
    isOpen() {
        return this.isDialogOpen;
    }
}

// Create global dialog system instance
window.gameDialogSystem = new DialogSystem();
