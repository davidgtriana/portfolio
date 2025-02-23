import {DiceRoller} from "./dice-roller.js";

export class GameConfig {

    // 3 Bet Boxes w/ 3 Players
    // Seed: 1287203866
    // --- Dealer Busts with 7 cards if played perfectly
    // Seed: 2720374580
    // --- Box 3 has Pocket Aces
    // Seed: 2664819274
    // --- All boxes can be doubled if played perfectly
    // Seed: 4226777415
    // --- Blazing 9's on Box 1 and Pocket 6's on Box 3
    // Seed: 2910211537
    // --- Soft Total on Box 1 and BJ on Box 2
    // Seed: 1026684650
    // --- BJ on Box 3 an Dealer 6

    // 2 Bet Boxes w/ 2 players
    // Seed: 4147411243
    // --- 6/6 in Box 1 - 10/10 in Box 2 and Dealer 10
    // 2169519979 KK candidate
    static die: DiceRoller = new DiceRoller();

    static DEBUG_MODE: boolean = true;
    // Timer
    static DEAL_CARD_DELAY: number = 250;
    static PLACE_CHIP_DELAY: number = 250;

    // Table Rules
    static MAX_HANDS_PER_BOX: number = 4;
    static MAX_BET_BOXES: number = 9;
    static MAX_BET_BOXES_PER_PLAYER: number = 2;
    static BET_BOXES_AMOUNT: number = 9;
    static DECKS_PER_SHOE: number = 9;
    static DECK_PENETRATION: number = 0.75;
    static MAX_BET: number = 750;
    static MIN_BET: number = 25;
        
    static IS_EUROPEAN_NO_HOLE_CARD: boolean = true;
    static IS_ORIGINAL_BET_ONLY: boolean = true;
    static IS_6TO5: boolean = false;

    static IS_DEALER_HIT_ON_17: boolean = true;
    static IS_ALLOWED_SURRENDER: boolean = true;
    static IS_ALLOWED_DOUBLE_AFTER_SPLIT: boolean = true;
    static IS_ALLOWED_RESPLIT_ACES: boolean = false;
    
}