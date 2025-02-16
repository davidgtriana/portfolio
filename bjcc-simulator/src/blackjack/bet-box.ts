import {Hand} from "./hand.js"
import {Player} from "./player.js"

export class BetBox{
    id: number;
    player!: Player;
    hands: Hand[] = [];

    constructor(id:number){
        this.id = id;
    }

    public placeBet(bet: number){
        this.hands[0].setBet(bet);
        this.player.stack -= bet;
    }
}
