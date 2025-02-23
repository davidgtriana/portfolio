import { GameConfig } from "../config.js";
import { GameState } from "./game-state.js";
import * as Game from "./card-game.js";
import { Hand } from "./hand.js";
import { Player } from "./player.js";
import { BetBox } from "./bet-box.js";
export class BlackjackGame {
    ui;
    state;
    shoe;
    discard_pile;
    bet_boxes = [];
    active_hands = [new Hand()];
    current_active_hand = 0;
    players = [];
    running_count = 0;
    constructor() { }
    get dealer_hand() { return this.active_hands[0]; }
    init() {
        this.instantiateTableGame();
        this.startNewShoe();
        this.seatPlayers(); // Only now that we don't have the players module
        this.startNewHand();
    }
    print() { this.active_hands.forEach(hand => { hand.print(); }); }
    startNewHand() {
        this.state = GameState.Betting;
        // Resets the Dealer hand
        this.dealer_hand.reset();
        // Clean the Active Hands Tracker
        this.active_hands = this.active_hands.slice(0, 1);
        // Clean the BetBoxes' hands
        this.bet_boxes.forEach(betbox => { betbox.hands = []; });
        this.ui?.updateHandData(this.dealer_hand);
        this.ui?.startNewHand();
    }
    instantiateTableGame() {
        // Instantiate Table Game Objects
        this.discard_pile = new Game.StackCard(0);
        // Instantiate Bet Box Object
        for (let currentBetBox = 0; currentBetBox < GameConfig.BET_BOXES_AMOUNT; currentBetBox++) {
            const betbox = new BetBox(currentBetBox + 1);
            this.bet_boxes.push(betbox);
        }
        this.ui?.initializeTableGameUI();
    }
    startNewShoe() {
        // Create the Shoe
        this.shoe = new Game.StackCard(GameConfig.DECKS_PER_SHOE);
        this.shoe.shuffle(GameConfig.die);
        //this.shoe = Game.StackCard.getPredeterminedDeck();
        this.placeCutCard();
        this.ui?.addCardsToTheShoePreviewArea();
        // Burn Card 
        this.discard_pile.add(this.drawCardFromTheShoe());
    }
    placeCutCard() {
        // Places the cut card
        const cut_card = new Game.Card(0, 0);
        const half_index = this.shoe.amount_of_cards * GameConfig.DECK_PENETRATION;
        this.shoe.cards.splice(half_index, 0, cut_card);
    }
    drawCardFromTheShoe() {
        this.ui?.removeCardToTheShoePreviewArea();
        return this.shoe.draw();
    }
    seatPlayers() {
        // Create Players
        this.players.push(new Player("David"));
        // Assigning a player per Bet Box
        this.bet_boxes.forEach((betbox, index) => {
            if (index >= 9)
                return;
            betbox.player = this.players[0];
        });
    }
    /**
     * Places a bet by creating a hand in the given Bet Box.
     * @param betbox_id
     * @param bet_amount
     * @returns A reference to the hand created.
     */
    placeBet(betbox_id, bet_amount) {
        const betbox = this.bet_boxes[betbox_id - 1];
        const hand = new Hand(betbox);
        betbox.placeBet(bet_amount);
        return hand;
    }
    async initialDealOut() {
        this.state = GameState.InitialDealOut;
        this.current_active_hand = 0;
        this.ui?.hideAllButtons();
        // Track Active Hands
        for (let betbox of this.bet_boxes) {
            if (betbox.hands.length == 0)
                continue;
            const hand = betbox.hands[0];
            if (hand.isOnTheTable)
                this.active_hands.push(hand);
        }
        // Deal the Primary Card to Players
        for (let hand of this.active_hands) {
            if (hand.id == 0)
                continue;
            await this.dealCard(hand);
        }
        // Deal the Primary Card to Dealer
        await this.dealCard(this.dealer_hand);
        // Deal the Secondary Card to Players
        for (let hand of this.active_hands) {
            if (hand.id == 0)
                continue;
            await this.dealCard(hand);
        }
        // Deal the Secondary Card to Dealer
        //if (!this.IS_EUROPEAN_NO_HOLE_CARD) this.dealer_hand.hit(this.shoe.draw()!);
        this.courseOfPlay();
    }
    courseOfPlay() {
        this.state = GameState.CourseOfPlay;
        if (GameConfig.DEBUG_MODE)
            console.log("Course of play...");
        this.playNextHand();
    }
    payAndTake() {
        this.state = GameState.PayAndTake;
        this.ui.btns.get("btn-reset-table").style.display = "flex";
        this.ui.btns.get("btn-next-hand").style.display = "flex";
    }
    async playNextHand() {
        this.current_active_hand++;
        if (this.have_all_hands_been_played()) {
            if (GameConfig.DEBUG_MODE)
                console.log("All hands have been played.");
            this.print();
            this.dealerTurn();
            this.payAndTake();
            return;
        }
        // Select the current hand to play
        const current_hand = this.active_hands[this.current_active_hand];
        if (GameConfig.DEBUG_MODE)
            console.log("Current Hand Playing: " + this.current_active_hand);
        if (current_hand.cards.length == 1) {
            await this.dealCard(current_hand);
        }
        if (current_hand.isFinished) {
            if (current_hand.isBlackJack)
                if (GameConfig.DEBUG_MODE)
                    console.log("BlackJack...");
            this.finishHand();
            return;
        }
        // If the hand has to be played
        this.ui?.highlightHandinTurn(current_hand);
        this.ui?.updateButtonStates(current_hand);
        if (GameConfig.DEBUG_MODE)
            console.log("Waiting for playing action...");
    }
    have_all_hands_been_played() {
        return this.current_active_hand == this.active_hands.length;
    }
    is_there_any_hand_still_on_the_table() {
        return this.active_hands.slice(1).some(hand => hand.isOnTheTable);
    }
    is_any_hand_waiting_for_dealer_BJ() {
        return this.active_hands.some(hand => hand.isOnTheTable && (hand.isBlackJack || hand.isDoubled || hand.isSplitted));
    }
    async dealCard(hand, msg) {
        const card = this.drawCardFromTheShoe();
        hand.hit(card);
        let isDouble = false;
        if (msg && msg == "double")
            isDouble = true;
        if (!GameState.LastHand && card.isCutCard) {
            this.state = GameState.LastHand;
            this.ui?.showCutCard();
            await this.dealCard(hand);
            return;
        }
        // Show Card in the UI
        await this.ui?.dealCard(card, hand, isDouble);
        // Update the card counter if the player is a card counter
        if (card.value >= 10 || card.value == 1) {
            this.running_count--;
        }
        else if (card.value > 1 && card.value < 7) {
            this.running_count++;
        }
        const element_running_count = document.querySelector(".running-count");
        element_running_count.textContent = this.running_count.toString();
    }
    finishHand() {
        this.ui?.hideAllButtons();
        // Select the current hand to play
        const hand = this.active_hands[this.current_active_hand];
        this.ui?.removeHighlightHandinTurn(hand);
        // Check if the hand should still be on the table
        if (!this.shouldKeepHandOnTable(hand)) {
            hand.isOnTheTable = false;
            // Take hand out of the table animation
        }
        this.playNextHand();
    }
    shouldKeepHandOnTable(hand) {
        if (this.dealer_hand.isTherePotentialForBJ()) {
            return hand.isSplitted || hand.isDoubled || hand.isBlackJack || !hand.isBusted;
        }
        return !(hand.isBlackJack || hand.isBusted);
    }
    async dealerTurn() {
        if (GameConfig.DEBUG_MODE)
            console.log("Dealer's turn...");
        if (this.is_there_any_hand_still_on_the_table()) {
            if (this.dealer_hand.isTherePotentialForBJ()) {
                if (this.is_any_hand_waiting_for_dealer_BJ()) {
                    if (GameConfig.DEBUG_MODE)
                        console.log("Dealer only plays one card");
                    await this.dealCard(this.dealer_hand);
                    this.dealer_hand.stand();
                }
                else {
                    await this.playDealerHand();
                }
            }
            else {
                await this.playDealerHand();
            }
            if (this.dealer_hand.isSoft())
                this.ui?.updateHandData(this.dealer_hand);
        }
        else {
            if (GameConfig.DEBUG_MODE)
                console.log("Dealer doesn't need to play");
        }
    }
    /**
     * Controls the dealer's actions according to standard blackjack rules.
     * This function is recursive, meaning it calls itself until the dealer's turn is complete.
     */
    async playDealerHand() {
        const dealer = this.dealer_hand;
        if (dealer.isBusted)
            return console.log("Dealer has Too Many...");
        if (dealer.isBlackJack)
            return console.log("Dealer has a Blackjack...");
        if (dealer.total > 17 || (!GameConfig.IS_DEALER_HIT_ON_17 && dealer.total == 17 && dealer.isSoft())) {
            if (GameConfig.DEBUG_MODE)
                console.log("Dealer stands on " + dealer.getHandTotal() + "...");
            dealer.stand();
            return;
        }
        if (GameConfig.DEBUG_MODE)
            console.log("Dealer hits on " + dealer.getHandTotal() + "...");
        await this.dealCard(dealer);
        await this.playDealerHand();
    }
    actionDeal() {
        if (this.state != GameState.Betting)
            return;
        // Check if at least one betbox has a hand
        if (!this.bet_boxes.some(betbox => betbox.hands.length > 0))
            return;
        if (GameConfig.DEBUG_MODE)
            console.log("Initial Deal Out...");
        this.ui?.removeAllAvailableHighlight();
        this.initialDealOut();
    }
    async actionHit() {
        if (!(this.state == GameState.CourseOfPlay || this.state == GameState.LastHand))
            return;
        const current_hand = this.active_hands[this.current_active_hand];
        await this.dealCard(current_hand); // The values are updated when the card is dealt
        this.ui?.updateButtonStates(current_hand);
        if (current_hand.isFinished)
            this.finishHand();
    }
    async actionStand() {
        if (!(this.state == GameState.CourseOfPlay || this.state == GameState.LastHand))
            return;
        // Get the current hand
        const current_hand = this.active_hands[this.current_active_hand];
        current_hand.stand();
        this.ui?.updateHandData(current_hand); // Update Value manually because no card is dealt
        this.finishHand();
    }
    async actionDouble() {
        if (!(this.state == GameState.CourseOfPlay || this.state == GameState.LastHand))
            return;
        // Get the current hand
        const current_hand = this.active_hands[this.current_active_hand];
        if (!current_hand.canDouble)
            return;
        current_hand.double();
        await this.ui?.addBet(current_hand); // Add the secondary bet
        await this.dealCard(current_hand, "double"); // The values are updated when the card is dealt
        document.querySelector(".stack-amount").textContent = current_hand.parent_box?.player.stack.toString(); // Temporal
        this.finishHand();
    }
    async actionSplit() {
        if (!(this.state == GameState.CourseOfPlay || this.state == GameState.LastHand))
            return;
        // Get the current hand
        const current_hand = this.active_hands[this.current_active_hand];
        if (!current_hand.canSplit)
            return;
        const new_hand = current_hand.split();
        document.querySelector(".stack-amount").textContent = current_hand.parent_box?.player.stack.toString(); // Temporal
        // Add the New Hand Object to the list of active hands in the correspondient position
        this.active_hands.splice((((this.current_active_hand - 1) - (current_hand.id - 1)) + (current_hand.parent_box.hands.length)), 0, new_hand);
        await this.ui?.createSplitHandElement(current_hand, new_hand);
        await this.dealCard(current_hand);
        current_hand.print();
        this.ui?.updateButtonStates(current_hand);
        if (current_hand.primary_card.value == 1) {
            current_hand.isFinished = true;
            new_hand.isFinished = true;
        }
        if (current_hand.isFinished) {
            this.ui?.updateHandData(current_hand); // Update Value manually because no card is dealt
            this.finishHand();
        }
    }
    async actionSurrender() {
        if (GameConfig.DEBUG_MODE)
            console.log("Surrender button clicked...");
    }
    async actionInsurance() {
        if (GameConfig.DEBUG_MODE)
            console.log("Insurance button clicked...");
    }
    async actionUndo() {
        if (GameConfig.DEBUG_MODE)
            console.log("Undo button clicked...");
    }
    async actionClearBets() {
        if (GameConfig.DEBUG_MODE)
            console.log("Clear Bets button clicked...");
    }
    async actionResetTable() {
        if (GameConfig.DEBUG_MODE)
            console.log("Create reset button clicked...");
    }
    async actionCreateTable() {
        if (GameConfig.DEBUG_MODE)
            console.log("Create table button clicked...");
    }
    async actionNextHand() {
        if (!(this.state == GameState.PayAndTake))
            return;
        this.startNewHand();
    }
}
