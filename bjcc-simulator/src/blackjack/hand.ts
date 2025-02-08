import * as Game from "./card-game.js";

export class Hand{
    cards: Game.Card[] = [];
    bet: number = 0;
    id: number = 0;
    betbox_id: number = 0;

    private total: number = 0;
    private ace_count: number = 0;
    
    constructor(bet:number, id:number, betbox_id: number){
        this.bet = bet;
        this.id = id;
        this.betbox_id = betbox_id;
    }
    

    public hit(card:Game.Card): void{
        // Add card to the list of cards of the hand
        this.cards.push(card);

        // Add the value of the card to the hand value
        if(card.value == 1){ // ACE
            this.ace_count++;
            this.total += 11;
        } else if (card.value >= 10){ // Face Card
            this.total += 10;
        } else {
            this.total += card.value;
        }

        // Adjust for Aces if total exceeds 21
        while (this.total > 21 && this.ace_count >0){
            this.total -= 10;
            this.ace_count--;
        }
    }

    public stand(): void{}
    public double(): void{}
    public split(): void{}
    public surrender(): void{}
    public insurance(): void{}

    public print(id?:number){
        console.log("Hand No. "+(id?id:0)+ ": Points: " + this.getHandValue() + " Wager: $" + this.bet + " Cards: " + this.cards.map(card => card.toString(true)).join(" | "));
    }
    
    public getHandValue():string{
        if (this.cards.length == 0) return "0";
        if (this.total > 21) return "💥";
        if (this.total == 21 && this.cards.length == 2) return "BJ";
        if (this.ace_count > 0 && this.total <= 21) {
            return this.total.toString() + "/" + (this.total - 10).toString();
        } else {
            return this.total.toString();
        }
    }

}