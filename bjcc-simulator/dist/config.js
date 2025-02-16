export class GameConfig {
    // Timer
    static DEAL_CARD_DELAY = 250;
    // Table Rules
    static MAX_HANDS = 4;
    static MAX_BET_BOXES = 9;
    static MAX_BET_BOXES_PER_PLAYER = 2;
    static BET_BOXES_AMOUNT = 9;
    static DECKS_PER_SHOE = 6;
    static DECK_PENETRATION = 0.50;
    static MAX_BET = 750;
    static MIN_BET = 25;
    static IS_EUROPEAN_NO_HOLE_CARD = true;
    static IS_ORIGINAL_BET_ONLY = true;
    static IS_DEALER_HIT_ON_17 = true;
    static IS_ALLOWED_SURRENDER = true;
    static IS_ALLOWED_DOUBLE_AFTER_SPLIT = true;
    static IS_ALLOWED_RESPLIT_ACES = false;
    constructor() { }
}
