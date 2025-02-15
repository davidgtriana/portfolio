import { DiceRoller } from "./blackjack/dice-roller.js";
import { Hand } from "./blackjack/hand.js";
import { Player } from "./blackjack/player.js";
import { BetBox } from "./blackjack/bet-box.js";
import { GameConfig } from "./config.js";
import * as Game from "./blackjack/card-game.js";
let DEBUG_MODE = true;
let audioCtx = new window.AudioContext();
class BlackjackGame {
    // 3 Bet Boxes w/ 3 Players
    // Seed: 1287203866
    // --- Dealer Busts with 7 cards if played perfectly
    // Seed: 2720374580
    // --- Box 3 has Pocket Aces
    // Seed: 2664819274
    // --- All boxes can be doubled if played perfectly
    // Seed: 4226777415
    // --- Blazing 9's on Box 1 and Pocket 6's on Box 3
    // Seed: 2910211537
    // --- Soft Total on Box 1 and BJ on Box 2
    // Seed: 1026684650
    // --- BJ on Box 3 an Dealer 6
    // 2 Bet Boxes w/ 2 players
    // Seed: 4147411243
    // --- 6/6 in Box 1 - 10/10 in Box 2 and Dealer 10
    die = new DiceRoller(4147411243);
    shoe;
    discard_pile;
    dealerHand;
    players = [];
    bet_boxes = [];
    active_hands = [];
    current_hand_playing_index = 0;
    constructor() {
        if (DEBUG_MODE)
            console.log("Seed: " + this.die.getSeed());
        // Start the table
        //this.instantiateTableGame();
        // Start New Shoe
        this.startNewShoe();
        // Sit the players
        this.seatPlayers();
        // Place the initial bets
        this.placeBets();
    }
    instantiateTableGame() {
        // Instantiate Table Game Objects
        this.dealerHand = new Hand(0, 0, 0);
        this.discard_pile = new Game.StackCard(0);
        // Create the Shoe Preview Area
        const element_shoe_preview_area = document.getElementById("shoe-preview-area");
        element_shoe_preview_area.innerHTML = "";
        const element_cards = document.createElement("div");
        element_cards.className = "cards";
        element_shoe_preview_area.append(element_cards);
        // Getting Dealer Area Element
        const element_dealer_area = document.getElementById("dealer-area");
        element_dealer_area.innerHTML = "";
        // Create Hand Element of the Dealer
        const element_dealer_hand = document.createElement("div");
        element_dealer_hand.className = "hand";
        element_dealer_area.appendChild(element_dealer_hand);
        // Create Value Element of the Dealer
        const element_dealer_value = document.createElement("div");
        element_dealer_value.className = "value";
        element_dealer_value.append(this.dealerHand.getHandValue());
        element_dealer_hand.append(element_dealer_value);
        // Create Card Container Element of the Dealer
        const element_dealer_cards = document.createElement("div");
        element_dealer_cards.className = "cards";
        element_dealer_hand.appendChild(element_dealer_cards);
        // Bet Boxes Area
        const element_bet_boxes_area = document.getElementById("bet-boxes-area");
        element_bet_boxes_area.innerHTML = "";
        // -- Create the Bet Boxes
        for (let currentBetBox = 0; currentBetBox < GameConfig.BET_BOXES_AMOUNT; currentBetBox++) {
            // Instantiate Bet Box Object
            const betbox = new BetBox(currentBetBox + 1);
            // Create Bet Box HTML Element
            const element_betbox = document.createElement("div");
            element_betbox.className = "bet-box " + "bet-box-" + betbox.id;
            element_bet_boxes_area.append(element_betbox);
            // Add Bet Box Object to the List of Bet Boxes
            this.bet_boxes.push(betbox);
            // Instantiate Hand Object
            const hand = new Hand(0, 1, currentBetBox + 1);
            // Create Hand HTML Element
            const element_hand = document.createElement("div");
            element_hand.className = "hand" + " hand-1";
            element_betbox.appendChild(element_hand);
            // Add Hand Object to the List of hands of this Bet Box
            betbox.hands.push(hand);
            // Create Value, Bet and Card Container Elements of the Hand
            const element_hand_value = document.createElement("div");
            element_hand_value.className = "value";
            element_hand_value.style.visibility = "hidden";
            element_hand_value.append(hand.getHandValue());
            element_hand.appendChild(element_hand_value);
            const element_hand_bet = document.createElement("div");
            element_hand_bet.className = "bet";
            element_hand_bet.style.visibility = "hidden";
            element_hand_bet.append(hand.bet.toString());
            element_hand.appendChild(element_hand_bet);
            const element_cards = document.createElement("div");
            element_cards.className = "cards";
            element_hand.appendChild(element_cards);
        }
    }
    seatPlayers() {
        // Create Players
        this.players.push(new Player("Juan"));
        this.players.push(new Player("David"));
        this.players.push(new Player("Godoy"));
        this.players.push(new Player("Triana"));
        this.players.push(new Player("Daiki"));
        this.players.push(new Player("Kazuma"));
        this.players.push(new Player("Yuki"));
        this.players.push(new Player("Yoshida"));
        this.players.push(new Player("Yamada"));
        // Assigning a player per Bet Box
        this.bet_boxes.forEach((betbox, index) => {
            if (index >= this.players.length)
                return;
            betbox.player = this.players[index];
        });
    }
    placeBets() {
        for (let betbox of this.bet_boxes) {
            if (betbox.player == null)
                continue;
            betbox.placeBet(25);
            // Showing HTML Elements of the Hand
            const element_betbox = document.querySelector(".bet-box-" + betbox.id);
            const element_hand = element_betbox.querySelector(".hand-1");
            const element_hand_value = element_hand.querySelector(".value");
            element_hand_value.style.visibility = "visible";
            element_hand_value.innerHTML = "0";
            const element_hand_bet = element_hand.querySelector(".bet");
            element_hand_bet.innerHTML = betbox.hands[0].bet.toString();
            element_hand_bet.style.visibility = "visible";
        }
    }
    startNewShoe() {
        // -- Prepare the Shoe
        this.shoe = new Game.StackCard(GameConfig.DECKS_PER_SHOE);
        this.shoe.shuffle(this.die);
        // Adds the Cards to the Shoe preview on top of the page
        const element_cards = document.getElementById("shoe-preview-area").querySelector(".cards");
        this.shoe.cards.forEach((card, currentCard) => {
            const element_card = this.createCardImgElement(card, currentCard + 1);
            element_cards.append(element_card);
        });
        // -- Burning Card
        this.discard_pile.add(this.shoe.draw());
        // Update the Show Preview
        element_cards.firstChild.remove();
    }
    async initialDealOut() {
        this.current_hand_playing_index = 0;
        // Track Active Hands
        for (let betbox of this.bet_boxes) {
            const hand = betbox.hands[0];
            if (!hand.isActive)
                continue;
            this.active_hands.push(hand);
        }
        // Activate Dealer Hand
        this.dealerHand.isActive = true;
        // Deal the Primary Card to Players
        for (let hand of this.active_hands)
            await this.hitHand(hand);
        // Deal the Primary Card to Dealer
        await this.hitHand(this.dealerHand, "dealer");
        // Deal the Secondary Card to Players
        for (let hand of this.active_hands)
            await this.hitHand(hand);
        // Deal the Secondary Card to Dealer
        //if (!this.IS_EUROPEAN_NO_HOLE_CARD) this.dealerHand.hit(this.shoe.draw()!);
        if (DEBUG_MODE)
            this.displayConsole();
        this.courseOfPlay();
    }
    async hitHand(hand, entity = "player") {
        await delay(GameConfig.DEAL_CARD_DELAY);
        // Play Deal Sound
        playDealSound();
        // Get the Card out of the Shoe
        const card = this.shoe.draw();
        // Update the Show Preview
        let element_cards = document.getElementById("shoe-preview-area").querySelector(".cards");
        element_cards.firstChild.remove();
        // Add the Object card to the list of cards of the hand 
        hand.hit(card);
        // Select the Parent Element of the Hand Element
        const element_area = entity == "dealer" ? document.getElementById("dealer-area") : document.querySelector(".bet-box-" + hand.betbox_id);
        // Selects the element of the Element Area
        const element_hand = element_area.querySelector(".hand" + (entity == "dealer" ? "" : "-" + hand.id.toString()));
        // Update Hand Value
        const element_value = element_hand.querySelector(".value");
        element_value.textContent = hand.getHandValue();
        // Selects the Cards Container of that Hand
        element_cards = element_area.querySelector(".cards");
        // Creates the HTML Card Element
        const card_id = hand.cards.length - 1;
        const element_card = this.createCardImgElement(card, card_id + 1);
        // Appends the Card Element to the Cards Container
        element_cards.appendChild(element_card);
        // Animate the Card Element
        const top_offset = 90;
        if (entity == "player") {
            gsap.set(element_card, {
                position: "absolute",
                top: "-400px",
                left: "0px",
                opacity: 0,
                rotation: gsap.utils.random(-100, 100),
            });
            gsap.to(element_card, {
                position: "absolute",
                duration: 0.7,
                opacity: 1,
                top: `${-top_offset + card_id * -30}px`,
                left: `${card_id * 35}px`,
                rotation: 0,
                ease: "power2.out"
            });
        }
        if (entity == "double") {
            gsap.set(element_card, {
                position: "absolute",
                top: "-400px",
                left: "0px",
                opacity: 0,
                rotation: gsap.utils.random(-100, 100),
            });
            gsap.to(element_card, {
                position: "absolute",
                duration: 0.7,
                opacity: 1,
                top: `${-top_offset + card_id * -30}px`,
                left: `${card_id * 35}px`,
                rotation: 90,
                ease: "power2.out"
            });
        }
        if (entity == "dealer") {
            gsap.set(element_card, {
                position: "absolute",
                top: "-100px",
                left: "200px",
                opacity: 0,
                scale: 1,
                rotation: gsap.utils.random(-100, 100),
            });
            gsap.to(element_card, {
                position: "relative",
                duration: 0.7,
                opacity: 1,
                top: 0,
                left: 0,
                rotation: 0,
                ease: "power2.out"
            });
        }
    }
    courseOfPlay() {
        this.playNextHand();
    }
    playNextHand() {
        // Check if all hands have been played
        if (this.current_hand_playing_index >= this.active_hands.length) {
            if (DEBUG_MODE)
                console.log("All hands have been played. Dealer's turn...");
            // Play the Dealer's Hand Recursively
            this.playDealerHand();
            this.dealerHand.isActive = false;
            if (this.dealerHand.isSoft()) {
                const element_dealer_area = document.getElementById("dealer-area");
                const element_hand_value = element_dealer_area.querySelector(".hand .value");
                element_hand_value.textContent = this.dealerHand.getHandValue();
            }
            return;
        }
        // Select the current hand to play
        const hand = this.active_hands[this.current_hand_playing_index];
        if (DEBUG_MODE)
            console.log("Current Hand Playing: " + (this.current_hand_playing_index + 1));
        // Highlight the current hand in the UI
        const element_betbox = document.querySelector(".bet-box-" + hand.betbox_id);
        const element_hand = element_betbox?.querySelector(".hand-" + hand.id);
        element_hand.classList.add("current_turn");
        if (hand.total == 21 && hand.cards.length == 2) {
            if (DEBUG_MODE)
                console.log("Blackjack!");
            this.finishHand();
            return;
        }
        if (DEBUG_MODE)
            console.log("Waiting for playing action...");
    }
    /**
     * Controls the dealer's actions according to standard blackjack rules.
     * The dealer will:
     * - Stand on 17 or higher (unless hitting on soft 17 is enabled).
     * - Hit on totals below 17.
     * - Stop if they bust (total over 21).
     * - Stop if they have a natural blackjack (21 with only two cards).
     *
     * This function is recursive, meaning it calls itself until the dealer's turn is complete.
     */
    async playDealerHand() {
        // If the dealer's total exceeds 21, they bust and stop playing.
        if (this.dealerHand.total > 21) {
            if (DEBUG_MODE)
                console.log("Dealer has Too Many...");
            return;
        }
        // If the dealer has a natural blackjack (21 with exactly 2 cards), they stop.
        if (this.dealerHand.total == 21 && this.dealerHand.cards.length == 2) {
            if (DEBUG_MODE)
                console.log("Dealer has a Blackjack...");
            return;
        }
        // If the dealer's total is greater than 17, they must stand.
        if (this.dealerHand.total > 17) {
            if (DEBUG_MODE)
                console.log("Dealer stands on " + this.dealerHand.total.toString() + "...");
            return;
        }
        // Special case: If the dealer has exactly 17
        if (this.dealerHand.total == 17) {
            // Check if the dealer has a soft 17 (contains an Ace counted as 11)
            if (this.dealerHand.isSoft()) {
                // If the game rules allow hitting on soft 17, the dealer hits.
                if (GameConfig.IS_DEALER_HIT_ON_17) {
                    if (DEBUG_MODE)
                        console.log("Dealer hits on soft 17...");
                    await this.hitHand(this.dealerHand, "dealer");
                    this.playDealerHand(); // Recursive call to check if another hit is needed.
                    return;
                }
                else {
                    // Otherwise, the dealer stands on soft 17.
                    if (DEBUG_MODE)
                        console.log("Dealer stands on soft 17...");
                    return;
                }
            }
            // If it's a hard 17 (no Ace counted as 11), the dealer must stand.
            if (DEBUG_MODE)
                console.log("Dealer stands on hard 17...");
            return;
        }
        // If the dealer's total is below 17, they must hit.
        if (this.dealerHand.total < 17) {
            if (DEBUG_MODE)
                console.log(`Dealer hits on ${this.dealerHand.total}...`);
            await this.hitHand(this.dealerHand, "dealer");
            this.playDealerHand(); // Recursive call to continue hitting until they stand or bust.
            return;
        }
    }
    finishHand() {
        // Select the current hand to play
        const hand = this.active_hands[this.current_hand_playing_index];
        // Make this hand inactive
        hand.isActive = false;
        // Select the current Hand Element
        const element_current_turn = document.querySelector(".current_turn");
        // Update Hand Value
        if (this.active_hands[this.current_hand_playing_index].isSoft()) {
            const element_value = element_current_turn.querySelector(".value");
            element_value.textContent = hand.getHandValue();
        }
        // Remove the current_turn class
        element_current_turn.classList.remove("current_turn");
        // Continue playing the next hand
        this.current_hand_playing_index++;
        this.playNextHand();
    }
    payAndTake() {
    }
    displayConsole() {
        // Displaying Dealer's hand in the console
        console.log("Dealer Hand: ");
        this.dealerHand.print();
        // Printing Players' Hands in the console
        for (let currentBetBox = 0; currentBetBox < this.bet_boxes.length; currentBetBox++) {
            const betbox = this.bet_boxes[currentBetBox];
            if (betbox.player == null)
                continue;
            console.log("Box No. " + (currentBetBox + 1) + ": Player: " + betbox.player.name);
            for (let currentHand = 0; currentHand < betbox.hands.length; currentHand++) {
                const hand = betbox.hands[currentHand];
                hand.print();
            }
        }
    }
    createCardImgElement(card, id) {
        // Card Images Origin h: 240 w: 160
        let cards_path = "./assets/cards/";
        let img_type_file = ".png";
        const cardImg = document.createElement("img");
        cardImg.className = "card card-" + id;
        cardImg.src = cards_path + card.toString(false) + img_type_file;
        return cardImg;
    }
}
let game = new BlackjackGame();
// Setting up the hover sound for the buttons
const buttons = document.querySelectorAll('.btn');
buttons.forEach(button => {
    button.addEventListener('mouseenter', function () {
        playHoverButtonSound();
    });
});
// Setting up the click event for the deal button
document.getElementById("btn-deal")?.addEventListener("click", () => {
    if (game.active_hands.length != 0)
        return;
    game.initialDealOut();
});
document.getElementById("btn-hit")?.addEventListener("click", async () => {
    // Do nothing if there are no active hands
    if (game.active_hands.length == 0)
        return;
    // Get the current hand
    const hand = game.active_hands[game.current_hand_playing_index];
    // Hit the hand
    await game.hitHand(hand);
    if (DEBUG_MODE)
        console.log("Hit button clicked for the hand No: " + hand.id + " of Bet Box: " + hand.betbox_id);
    if (DEBUG_MODE)
        hand.print();
    // Check if the hand is busted
    if (hand.total > 21) {
        if (DEBUG_MODE)
            console.log("Too Many!");
        game.finishHand();
    }
    if (hand.total == 21) {
        if (DEBUG_MODE)
            console.log("21!! Nice Hit!");
        game.finishHand();
    }
});
document.getElementById("btn-stand")?.addEventListener("click", async () => {
    // Do nothing if there are no active hands
    if (game.active_hands.length == 0)
        return;
    // Get the current hand
    const hand = game.active_hands[game.current_hand_playing_index];
    if (DEBUG_MODE)
        console.log("Stand button clicked for the hand No: " + hand.id + " of Bet Box: " + hand.betbox_id);
    // Stand the hand by finishing it
    game.finishHand();
});
document.getElementById("btn-double")?.addEventListener("click", async () => {
    if (game.active_hands.length == 0)
        return;
    // Get the current hand
    const hand = game.active_hands[game.current_hand_playing_index];
    if (hand.isDoubleDownEnabled) {
        // Hit the hand
        await game.hitHand(hand, "double");
        if (DEBUG_MODE)
            console.log("Double Down button clicked for the hand No: " + hand.id + " of Bet Box: " + hand.betbox_id);
        if (DEBUG_MODE)
            hand.print();
        hand.bet += hand.bet;
        const element_bet_boxes_area = document.getElementById("bet-boxes-area");
        const element_betbox = element_bet_boxes_area?.querySelector(".bet-box-" + hand.betbox_id);
        const element_hand = element_betbox.querySelector(".hand-" + hand.id);
        const element_hand_bet = element_hand.querySelector(".bet");
        element_hand_bet.textContent = hand.bet.toString();
        game.finishHand();
    }
    else {
        if (DEBUG_MODE)
            console.log("Double Down not Allowed");
    }
});
document.getElementById("btn-split")?.addEventListener("click", async () => {
    if (DEBUG_MODE)
        console.log("Split button clicked...");
});
document.getElementById("btn-surrender")?.addEventListener("click", async () => {
    if (DEBUG_MODE)
        console.log("Surrender button clicked...");
});
document.getElementById("btn-insurance")?.addEventListener("click", async () => {
    if (DEBUG_MODE)
        console.log("Insurance button clicked...");
});
document.getElementById("btn-undo")?.addEventListener("click", async () => {
    if (DEBUG_MODE)
        console.log("Undo button clicked...");
});
document.getElementById("btn-clear-bets")?.addEventListener("click", async () => {
    if (DEBUG_MODE)
        console.log("Clear Bets button clicked...");
});
document.getElementById("btn-reset-table")?.addEventListener("click", async () => {
    if (DEBUG_MODE)
        console.log("Create reset button clicked...");
});
document.getElementById("btn-create-table")?.addEventListener("click", async () => {
    if (DEBUG_MODE)
        console.log("Create table button clicked...");
});
document.getElementById("btn-next-hand")?.addEventListener("click", async () => {
    // Do nothing if there are no active hands
    if (game.active_hands.length == 0)
        return;
    if (game.current_hand_playing_index != game.active_hands.length)
        return;
    // Resets the Dealer hand
    game.dealerHand.reset();
    // Update Dealer Value
    const element_dealer_area = document.getElementById("dealer-area");
    const element_dealer_value = element_dealer_area.querySelector(".hand .value");
    element_dealer_value.innerHTML = "0";
    // Resets the first hand objects of each betbox
    game.bet_boxes.forEach(betbox => { betbox.hands[0].reset(); });
    // Clean the Active Hands Tracker
    game.active_hands = [];
    let element_cards_list = document.getElementById("dealer-area").querySelectorAll(".cards");
    element_cards_list.forEach(element_cards => {
        element_cards.innerHTML = "";
    });
    element_cards_list = document.getElementById("bet-boxes-area").querySelectorAll(".cards");
    element_cards_list.forEach(element_cards => {
        element_cards.innerHTML = "";
    });
    // Place new Bets
    game.placeBets();
});
function playDealSound() {
    fetch("./assets/sounds/dealing_card.mp3")
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => audioCtx.decodeAudioData(arrayBuffer))
        .then(audioBuffer => {
        let source = audioCtx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioCtx.destination);
        source.start(0);
    })
        .catch(error => console.error("Error playing sound:", error));
}
function playHoverButtonSound() {
    fetch("./assets/sounds/hover_button.wav")
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => audioCtx.decodeAudioData(arrayBuffer))
        .then(audioBuffer => {
        let source = audioCtx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioCtx.destination);
        source.start(0);
    })
        .catch(error => console.error("Error playing sound:", error));
}
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
