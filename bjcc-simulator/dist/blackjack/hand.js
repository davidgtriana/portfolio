import { GameConfig } from "../config.js";
export class Hand {
    parent_box;
    cards = [];
    id = 0;
    primary_bet;
    secondary_bet;
    ace_count;
    total;
    isOnTheTable; // Is the hand still on the table?
    isBusted; // Is the hand total higher than 21?
    isBlackJack; // Is the hand a blackjack?
    isFinished; // Has the hand finish its turn?
    isSplitted; // Is the hand splitted? (More hands in the same betbox)
    canSplit; // Does the hand have 2 cards and are both the same point value?
    isDoubled; // Has the hand been doubled?
    canDouble; // Does the hand have only 2 cards?
    isSurrendered; // Has the hand been surrendered?
    canSurrender; // Has there been any action on the hand?
    // Special Cases:
    //  - A hand may be busted but active at the same time.
    constructor(parent_box) {
        this.primary_bet = 0;
        this.secondary_bet = 0;
        this.ace_count = 0;
        this.total = 0;
        this.isOnTheTable = true;
        this.isBusted = false;
        this.isBlackJack = false;
        this.isFinished = false;
        this.isSplitted = false;
        this.canSplit = false;
        this.isDoubled = false;
        this.canDouble = true;
        this.isSurrendered = false;
        this.canSurrender = true;
        if (!parent_box)
            return;
        this.parent_box = parent_box;
        this.id = this.parent_box.hands.length + 1;
        this.parent_box.hands.push(this);
    }
    get print_id() {
        return "BB" + this.betbox_id + "H" + this.id + ":";
    }
    get betbox_id() {
        return this.parent_box ? this.parent_box.id : 0;
    }
    get isDealers() {
        return !(this.parent_box) ? true : false;
    }
    hit(card) {
        if (GameConfig.DEBUG_MODE)
            console.log(this.print_id + " Hits");
        // Add card to the list of cards of the hand
        this.cards.push(card);
        // Add the value of the card to the hand value
        if (card.value == 1) { // ACE
            this.ace_count++;
            this.total += 11;
        }
        else if (card.value >= 10) { // Face Card
            this.total += 10;
        }
        else { // Number Cards (2-9)
            this.total += card.value;
        }
        // Adjust for Aces if total exceeds 21
        if (this.total > 21 && this.ace_count > 0) {
            this.total -= 10;
            this.ace_count--;
        }
        if (this.cards.length == 2) {
            if (this.total == 21) {
                this.isFinished = true;
                this.canDouble = false;
                this.canSurrender = false;
                if (!this.isSplitted)
                    this.isBlackJack = true;
                return;
            }
            // Check if it can be splittable
            if (this.areCardsSamePointValue()) {
                if (!this.parent_box)
                    return;
                if (this.parent_box.hands.length < GameConfig.MAX_HANDS_PER_BOX)
                    this.canSplit = true;
                return;
            }
        }
        if (this.cards.length >= 3) {
            // Disable double down and surrender if hand has 3 cards or more
            this.canDouble = false;
            this.canSurrender = false;
            if (this.total >= 21) {
                this.isFinished = true;
                if (this.total > 21)
                    this.isBusted = true;
            }
        }
    }
    stand() {
        if (GameConfig.DEBUG_MODE)
            console.log(this.print_id + " Stands");
        this.isFinished = true;
        this.canSplit = false;
        this.canDouble = false;
        this.canSurrender = false;
    }
    double() {
        if (!this.parent_box) {
            console.log("Dealer can't Double");
            return;
        }
        if (GameConfig.DEBUG_MODE)
            console.log(this.print_id + " Doubles");
        this.isDoubled = true;
        this.secondary_bet = this.primary_bet;
        this.parent_box.player.stack -= this.secondary_bet;
        this.stand();
    }
    split() {
        if (!this.parent_box) {
            console.log("Dealer can't Split");
            return undefined;
        }
        if (GameConfig.DEBUG_MODE)
            console.log(this.print_id + " Splits");
        this.isSplitted = true;
        this.canSplit = false;
        this.canSurrender = false;
        const new_hand = new Hand(this.parent_box);
        new_hand.hit(this.removeCard());
        new_hand.primary_bet = this.primary_bet;
        this.parent_box.player.stack -= new_hand.primary_bet;
        new_hand.isSplitted = true;
        new_hand.canSurrender = false;
        return new_hand;
    }
    removeCard() {
        // Remove the cards of the list of cards
        const card = this.cards.pop();
        // Face Card (J, Q, K)
        if (card.value >= 10) {
            this.total -= 10;
            // Number Cards (1-9)
        }
        else {
            this.total -= card.value;
        }
        return card;
    }
    print() {
        console.log("BB" + this.betbox_id +
            "H" + this.id +
            ": A?" + this.isOnTheTable +
            " B?" + this.isBusted +
            " BJ?" + this.isBlackJack +
            " pBJ?" + this.isTherePotentialForBJ() +
            " F?" + this.isFinished +
            " SpH?" + this.isSplitted +
            " SpE?" + this.canSplit +
            " DDH?" + this.isDoubled +
            " DDE?" + this.canDouble +
            " SrH?" + this.isSurrendered +
            " Sr?" + this.canSurrender +
            " TT" + this.getHandTotal() +
            " #A" + this.ace_count +
            " B1$" + this.primary_bet + " B2$" + this.secondary_bet +
            " C: " + this.cards.map(card => card.toString(true)).join(" | "));
    }
    getHandTotal() {
        if (this.cards.length == 0)
            return "0";
        if (this.total > 21)
            return "💥";
        if (this.isBlackJack) {
            return "BJ";
        }
        else if (this.id > 1) {
            return this.total.toString();
        }
        if (this.isSoft() && !this.isFinished) {
            return this.total.toString() + "/" + (this.total - 10).toString();
        }
        else {
            return this.total.toString();
        }
    }
    isSoft() {
        return this.total <= 21 && this.ace_count > 0;
    }
    reset() {
        this.cards = [];
        this.primary_bet = 0;
        this.secondary_bet = 0;
        this.total = 0;
        this.ace_count = 0;
        this.isOnTheTable = false;
        this.isBusted = false;
        this.isBlackJack = false;
        this.isFinished = false;
        this.isSplitted = false;
        this.canSplit = false;
        this.isDoubled = false;
        this.canDouble = true;
        this.isSurrendered = false;
        this.canSurrender = true;
    }
    get primary_card() { return this.cards[0]; }
    get secondary_card() { return this.cards[1]; }
    areCardsSamePointValue() {
        return (this.primary_card.value >= 10 && this.secondary_card.value >= 10) || (this.primary_card.value == this.secondary_card.value);
    }
    isTherePotentialForBJ() {
        if (this.cards.length == 0)
            return false;
        return this.primary_card.value >= 10 || this.primary_card.value == 1;
    }
}
