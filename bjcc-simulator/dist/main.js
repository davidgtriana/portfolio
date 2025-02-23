import { GameConfig } from "./config.js";
import { BlackjackGame } from "./blackjack/blackjack.js";
import { UserInterface } from "./user-interface.js";
if (GameConfig.DEBUG_MODE)
    console.log("Seed: " + GameConfig.die.getSeed());
const game = new BlackjackGame();
const ui = new UserInterface(game);
game.init();
