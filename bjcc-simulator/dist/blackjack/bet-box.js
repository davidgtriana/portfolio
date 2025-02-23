export class BetBox {
    id;
    player;
    hands = [];
    isAvailable;
    constructor(id) {
        this.id = id;
        this.isAvailable = true;
    }
    get original_bet() {
        return this.hands.length > 0 ? this.hands[0].primary_bet : 0;
    }
    placeBet(bet) {
        this.hands[0].primary_bet = bet;
        this.player.stack -= bet;
    }
    print() {
        console.log("Printing BB" + this.id);
        this.hands.forEach(hand => hand.print());
    }
}
