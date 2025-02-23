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
        const suitLetters = ["0", "S", "D", "C", "H"];
        const suitSymbols = ["0", "♠", "♦", "♣", "♥"];
        return (valueLetters[this.value] || this.value) + (type ? suitSymbols[this.suit] : suitLetters[this.suit]);
    }
    get isCutCard() {
        return this.suit == 0 && this.value == 0;
    }
}
export class StackCard {
    cards = [];
    amount_of_decks;
    constructor(amount_of_decks) {
        this.amount_of_decks = amount_of_decks;
        for (let i = 0; i < this.amount_of_decks; i++)
            this.createDeck();
    }
    get amount_of_cards() {
        return this.cards.length;
    }
    get amount_of_cards_used() {
        return (this.amount_of_decks * 52) - this.amount_of_cards;
    }
    createDeck() {
        for (let currentSuit = 1; currentSuit <= 4; currentSuit++)
            for (let currentValue = 1; currentValue <= 13; currentValue++)
                this.cards.push(new Card(currentSuit, currentValue));
    }
    static getPredeterminedDeck() {
        const new_deck = new StackCard(0);
        new_deck.cards = [
            new Card(1, 1), new Card(1, 1), new Card(1, 4), new Card(1, 10), new Card(1, 8), new Card(2, 1), new Card(1, 4), new Card(1, 10), new Card(3, 9), new Card(4, 9),
            new Card(1, 9), new Card(2, 9), new Card(3, 9), new Card(4, 5), new Card(2, 5), new Card(2, 6), new Card(2, 7), new Card(2, 8), new Card(2, 9), new Card(2, 10),
            new Card(2, 1), new Card(2, 2), new Card(2, 3), new Card(2, 4), new Card(2, 5), new Card(2, 6), new Card(2, 7), new Card(2, 8), new Card(2, 9), new Card(2, 10),
        ];
        return new_deck;
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
        return this.cards.shift();
    }
    // Adds the card to the stack from up-down
    add(card) {
        this.cards.unshift(card);
    }
    print() {
        console.log("Printing Deck: Amount of Cards: " + this.amount_of_cards + "  Amount of Cards Used: " + this.amount_of_cards_used);
        console.log(this.cards.map(card => card.toString(true)).join(" | "));
    }
}
