import {Hand} from "./hand.js"
import {Player} from "./player.js"

export class BetBox{
    id: number;
    player!: Player;
    hands: Hand[] = [];

    isAvailable: boolean;

    constructor(id:number){
        this.id = id;
        this.isAvailable = true;
    }

    get original_bet(): number {
        return this.hands.length > 0 ? this.hands[0].primary_bet : 0;
    }

    public placeBet(bet: number){
        this.hands[0].primary_bet = bet;
        this.player.stack -= bet;
    }

    public print(){
        console.log("Printing BB"+ this.id);
        this.hands.forEach(hand => hand.print());
    }
}
