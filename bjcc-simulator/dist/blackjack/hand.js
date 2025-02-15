export class Hand {
    id = 0;
    betbox_id = 0;
    cards = [];
    bet = 0;
    // Are buttons enabled for this hand?
    isActive = false;
    isDoubleDownEnabled = false;
    isSplitEnabled = false;
    isSurrenderEnabled = false;
    total = 0;
    ace_count = 0;
    constructor(bet, id, betbox_id) {
        this.bet = bet;
        this.id = id;
        this.betbox_id = betbox_id;
    }
    hit(card) {
        // Add card to the list of cards of the hand
        this.cards.push(card);
        if (this.cards.length == 3)
            this.isDoubleDownEnabled = false;
        // Add the value of the card to the hand value
        if (card.value == 1) { // ACE
            this.ace_count++;
            this.total += 11;
        }
        else if (card.value >= 10) { // Face Card
            this.total += 10;
        }
        else {
            this.total += card.value;
        }
        // Adjust for Aces if total exceeds 21
        while (this.total > 21 && this.ace_count > 0) {
            this.total -= 10;
            this.ace_count--;
        }
    }
    print() {
        console.log("Hand No. " + (this.id ? this.id : 0) + ": Active: " + this.isActive + " Total: " + this.getHandValue() + " Bet: $" + this.bet + " Cards: " + this.cards.map(card => card.toString(true)).join(" | "));
    }
    placeBet(bet) {
        this.bet = bet;
        this.isActive = true;
        this.isDoubleDownEnabled = true;
    }
    getHandValue() {
        if (this.cards.length == 0)
            return "0";
        if (this.total > 21)
            return "💥";
        if (this.total == 21 && this.cards.length == 2) {
            return "BJ";
        }
        else if (this.id > 1) {
            return this.total.toString();
        }
        if (this.isSoft() && this.isActive) {
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
        this.total = 0;
        this.ace_count = 0;
        this.bet = 0;
        this.isActive = false;
    }
}
