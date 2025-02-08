export class Card {
    suit;
    value;
    constructor(suit, value) {
        this.suit = suit;
        this.value = value;
    }
    toString(type) {
        // Type: (true) Symbols, (false) Letters 
        const valueLetters = { 1: "A", 10: "T", 11: "J", 12: "Q", 13: "K" };
        const suitLetters = ["S", "D", "C", "H"];
        const suitSymbols = ["♠", "♦", "♣", "♥"];
        return (valueLetters[this.value] || this.value) + (type ? suitSymbols[this.suit] : suitLetters[this.suit]);
    }
}
export class StackCard {
    cards = [];
    amount_of_cards;
    amount_of_cards_used;
    amount_of_decks;
    constructor(amount_of_decks) {
        this.amount_of_decks = amount_of_decks;
        for (let i = 0; i < this.amount_of_decks; i++)
            this.createDeck();
        this.amount_of_cards = this.cards.length;
        this.amount_of_cards_used = 0;
    }
    createDeck() {
        for (let currentSuit = 0; currentSuit <= 3; currentSuit++)
            for (let currentValue = 1; currentValue <= 13; currentValue++)
                this.cards.push(new Card(currentSuit, currentValue));
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
    // Returns the first card of the stack from up-down and removes it from the stack
    draw() {
        this.amount_of_cards -= 1;
        this.amount_of_cards_used += 1;
        return this.cards.shift();
    }
    // Adds the card to the stack from up-down
    add(card) {
        this.amount_of_cards += 1;
        this.cards.unshift(card);
    }
    print() {
        console.log("Printing Deck: Amount of Cards: " + this.amount_of_cards + "  Amount of Cards Used: " + this.amount_of_cards_used);
        console.log(this.cards.map(card => card.toString(true)).join(" | "));
    }
}
