export class Card {
    constructor(suit, value) {
        this.suit = suit;
        this.value = value;
    }
    toString() {
        const valueSymbol = { 1: "A", 10: "T", 11: "J", 12: "Q", 13: "K" };
        const suitSymbols = ["♠", "♦", "♣", "♥"];
        return (valueSymbol[this.value] || this.value) + suitSymbols[this.suit];
    }
}
export class Deck {
    constructor() {
        this.cards = [];
        for (let currentSuit = 0; currentSuit <= 3; currentSuit++)
            for (let currentValue = 1; currentValue <= 13; currentValue++)
                this.cards.push(new Card(currentSuit, currentValue));
        this.amount_of_cards = this.cards.length;
        this.amount_of_cards_used = 0;
    }
    shuffle(die) {
        /* Fisher-Yates Modern Version */
        let last_index = this.cards.length - 1;
        while (last_index > 0) {
            let rand_index = die.roll(last_index + 1);
            [this.cards[last_index], this.cards[rand_index]] = [this.cards[rand_index], this.cards[last_index]];
            last_index -= 1;
        }
    }
    draw() {
        this.amount_of_cards -= 1;
        this.amount_of_cards_used += 1;
        return this.cards.shift();
    }
    print() {
        console.log("Amount of Cards: " + this.amount_of_cards);
        console.log("Amount of Cards Used: " + this.amount_of_cards_used);
        console.log(this.cards.map(card => card.toString()).join(" | "));
    }
}
export class Shoe extends Deck {
    constructor(amount_of_decks) {
        super();
        this.cards = [];
        this.amount_of_decks = amount_of_decks;
        for (let i = 0; i < this.amount_of_decks; i++) {
            let new_deck = new Deck();
            this.cards.push(...new_deck.cards);
        }
        this.amount_of_cards = this.cards.length;
    }
}
