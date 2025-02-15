export class BetBox {
    id;
    player;
    hands = [];
    constructor(id) {
        this.id = id;
    }
    placeBet(bet) {
        this.hands[0].placeBet(bet);
        this.player.stack -= bet;
    }
}
