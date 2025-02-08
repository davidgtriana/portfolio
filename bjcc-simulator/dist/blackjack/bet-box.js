import { Hand } from "./hand.js";
export class BetBox {
    id;
    player;
    hands = [];
    constructor(id) {
        this.id = id;
    }
    placeBet(bet) {
        this.hands.push(new Hand(bet, 1, this.id));
        this.player.stack -= bet;
    }
}
