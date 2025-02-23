import { GameConfig } from "../config.js";
import { BetBox } from "./bet-box.js";
import * as Game from "./card-game.js";

export class Hand{
    parent_box?: BetBox;
    cards: Game.Card[] = [];

    id: number = 0;
    
    primary_bet: number;
    secondary_bet: number;
    ace_count: number;
    total: number;

    isOnTheTable: boolean; // Is the hand still on the table?
    isBusted: boolean; // Is the hand total higher than 21?
    isBlackJack: boolean; // Is the hand a blackjack?
    isFinished: boolean; // Has the hand finish its turn?
    isSplitted: boolean; // Is the hand splitted? (More hands in the same betbox)
    canSplit: boolean; // Does the hand have 2 cards and are both the same point value?
    isDoubled: boolean; // Has the hand been doubled?
    canDouble: boolean; // Does the hand have only 2 cards?
    isSurrendered: boolean; // Has the hand been surrendered?
    canSurrender: boolean; // Has there been any action on the hand?

    // Special Cases:
    //  - A hand may be busted but active at the same time.

    constructor(parent_box?: BetBox){
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

        if(!parent_box) return;

        this.parent_box = parent_box;
        this.id = this.parent_box.hands.length + 1;
        this.parent_box.hands.push(this);
    }

    get print_id(): string{
        return "BB" + this.betbox_id + "H"+ this.id + ":";
    }
    get betbox_id(): number{
        return this.parent_box?this.parent_box.id : 0;
    }
    get isDealers(): boolean{
        return !(this.parent_box)?true:false;
    }

    public hit(card:Game.Card): void{
        if(GameConfig.DEBUG_MODE) console.log(this.print_id + " Hits");
        // Add card to the list of cards of the hand
        this.cards.push(card);

        // Add the value of the card to the hand value
        if(card.value == 1){ // ACE
            this.ace_count++;
            this.total += 11;
        } else if (card.value >= 10){ // Face Card
            this.total += 10;
        } else { // Number Cards (2-9)
            this.total += card.value;
        }

        // Adjust for Aces if total exceeds 21
        if (this.total > 21 && this.ace_count > 0){
            this.total -= 10;
            this.ace_count--;
        }

        if (this.cards.length == 2){
            if(this.total == 21){
                this.isFinished = true;
                this.canDouble = false;
                this.canSurrender = false;
                if(!this.isSplitted) this.isBlackJack = true;
                return;
            }

            // Check if it can be splittable
            if(this.areCardsSamePointValue()){
                if (!this.parent_box) return;
                if(this.parent_box.hands.length < GameConfig.MAX_HANDS_PER_BOX)
                    this.canSplit = true;
                return;
            }
        }

        if (this.cards.length >= 3) {
            // Disable double down and surrender if hand has 3 cards or more
            this.canDouble = false;
            this.canSurrender = false;

            if (this.total >= 21){
                this.isFinished = true;
                if(this.total > 21)
                    this.isBusted = true;
            }
        }
    }

    public stand(): void{
        if(GameConfig.DEBUG_MODE) console.log(this.print_id + " Stands");
        this.isFinished = true;
        this.canSplit = false;
        this.canDouble = false;
        this.canSurrender = false;
    }

    public double(): void{
        if (!this.parent_box){
            console.log("Dealer can't Double"); 
            return;
        }
        if(GameConfig.DEBUG_MODE) console.log(this.print_id + " Doubles");

        this.isDoubled = true;
        this.secondary_bet = this.primary_bet;
        this.parent_box.player.stack -= this.secondary_bet;
        this.stand();
    }

    public split(): Hand | undefined{
        if (!this.parent_box){
            console.log("Dealer can't Split");
            return undefined;
        }
        if(GameConfig.DEBUG_MODE) console.log(this.print_id + " Splits");

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

    public removeCard(): Game.Card{

        // Remove the cards of the list of cards
        const card = this.cards.pop()!;
        
        // Face Card (J, Q, K)
        if (card.value >= 10) { 
            this.total -= 10;
            
        // Number Cards (1-9)
        } else { 
            this.total -= card.value;
        }

        return card;
    }

    public print(){
        console.log(
            "BB" + this.betbox_id +
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
            " Sr?"+ this.canSurrender + 
            " TT" + this.getHandTotal() + 
            " #A" + this.ace_count + 
            " B1$" + this.primary_bet + " B2$" + this.secondary_bet + 
            " C: " + this.cards.map(card => card.toString(true)).join(" | "));
    }
    
    public getHandTotal():string{
        if (this.cards.length == 0) return "0";

        if (this.total > 21) return "💥";

        if (this.isBlackJack){
            return "BJ";
        }else if(this.id > 1){
            return this.total.toString();
        }
        if (this.isSoft() && !this.isFinished) {
            return this.total.toString() + "/" + (this.total - 10).toString();
        } else {
            return this.total.toString();
        }
    }

    public isSoft():boolean{
        return this.total <= 21 && this.ace_count > 0;
    }

    public reset() : void{
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

    get primary_card(): Game.Card{ return this.cards[0];}
    get secondary_card(): Game.Card{ return this.cards[1];}

    public areCardsSamePointValue(): boolean{
        return (this.primary_card.value >= 10 && this.secondary_card.value >= 10) || (this.primary_card.value == this.secondary_card.value);
    }
    public isTherePotentialForBJ(): boolean{
        if (this.cards.length == 0) return false;
        return this.primary_card.value >= 10 || this.primary_card.value == 1;
    }
}

