import {Hand} from "./hand.js"
import {Player} from "./player.js"

export class BetBox{
    id!: number;
    player!: Player;
    hands: Hand[] = [];

    constructor(id:number){
        this.id=id;
    }

    public placeBet(bet: number){
        this.hands.push(new Hand(bet,1,this.id));
        this.player.stack -= bet;
    }
}
