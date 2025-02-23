 /* SUIT: 
    - 1 == ♠ SPADES
    - 2 == ♦ DIAMONDS
    - 3 == ♣ CLUBS
    - 4 == ♥ HEARTS

      VALUE:
    - 1 == (A) ACE
    - 2 - 9 == ITS Value
    - 10 == (T) TEN
    - 11 == (J) JACK
    - 12 == (Q) QUEEN
    - 13 == (K) KING
    */
import {DiceRoller} from "../dice-roller.js";

export class Card {
  suit: number;
  value: number;
  constructor(suit: number, value: number){
    this.suit = suit;
    this.value = value;
  }

  toString(type:boolean): string{
    // Type: (true) Symbols, (false) Letters 
    const valueLetters: { [key: number]: string } = { 1: "A", 10: "T", 11: "J", 12: "Q", 13: "K" };
    const suitLetters = ["0","S","D","C","H"];
    const suitSymbols = ["0","♠","♦","♣","♥"];
    return (valueLetters[this.value]||this.value)+(type?suitSymbols[this.suit]:suitLetters[this.suit]);
  }
  get isCutCard() : boolean{
    return this.suit == 0 && this.value == 0;
  }
}

export class StackCard {
  cards: Card[] = [];
  amount_of_decks: number;

  constructor(amount_of_decks:number) {
    this.amount_of_decks = amount_of_decks;
    for (let i = 0; i < this.amount_of_decks; i++)
      this.createDeck();
  }

  get amount_of_cards(): number{
    return this.cards.length;
  }
  get amount_of_cards_used():number{
    return (this.amount_of_decks * 52) - this.amount_of_cards;
  }

  private createDeck(){
    for (let currentSuit = 1; currentSuit <= 4 ; currentSuit++)											
      for (let currentValue = 1; currentValue <=13 ; currentValue++)
        this.cards.push(new Card( currentSuit, currentValue));
  }

  static getPredeterminedDeck(): StackCard{
    const new_deck: StackCard = new StackCard(0);
    new_deck.cards = [
      new Card(1,1),new Card(1,1),new Card(1,4),new Card(1,10),new Card(1,8),new Card(2,1),new Card(1,4),new Card(1,10),new Card(3,9),new Card(4,9),
      new Card(1,9),new Card(2,9),new Card(3,9),new Card(4,5),new Card(2,5),new Card(2,6),new Card(2,7),new Card(2,8),new Card(2,9),new Card(2,10),
      new Card(2,1),new Card(2,2),new Card(2,3),new Card(2,4),new Card(2,5),new Card(2,6),new Card(2,7),new Card(2,8),new Card(2,9),new Card(2,10),];
    return new_deck;
  }

  public shuffle (die:DiceRoller): void{
    /* Fisher-Yates Modern Version */
    let last_index:number = this.cards.length-1;
    
    while (last_index > 0){
      let rand_index = die.roll(last_index+1);
      [this.cards[last_index], this.cards[rand_index]] = [this.cards[rand_index], this.cards[last_index]];
      last_index -= 1;
    }
  }

  // Returns the first card of the stack from up-down and removes it from the stack
  public draw(): Card | undefined {
    return this.cards.shift();
  }

  // Adds the card to the stack from up-down
  public add(card:Card){
    this.cards.unshift(card);
  }

  public print(){
    console.log("Printing Deck: Amount of Cards: " + this.amount_of_cards + "  Amount of Cards Used: " + this.amount_of_cards_used);
    console.log(this.cards.map(card => card.toString(true)).join(" | "));
  }
}


