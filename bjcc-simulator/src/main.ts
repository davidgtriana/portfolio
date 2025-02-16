import {DiceRoller} from "./blackjack/dice-roller.js";
import {Hand} from "./blackjack/hand.js"
import {Player} from "./blackjack/player.js"
import {BetBox} from "./blackjack/bet-box.js"
import { GameConfig } from "./config.js";
import * as Game from "./blackjack/card-game.js";

declare const gsap: any; // 👈 This tells TypeScript to ignore the missing import

let DEBUG_MODE: boolean = true;
let audioCtx = new window.AudioContext();

class BlackjackGame {
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
    die: DiceRoller = new DiceRoller();

    shoe!: Game.StackCard;
    discard_pile!: Game.StackCard;

    dealerHand!: Hand;
    players: Player[] = [];

    bet_boxes: BetBox[] = [];
    active_hands: Hand[] = [];
    current_hand_playing_index: number = 0;
    

    constructor(){
        if (DEBUG_MODE) console.log("Seed: "+ this.die.getSeed());
        
        // Start the table
        this.instantiateTableGame();

        // Start New Shoe
        this.startNewShoe();

        // Sit the players
        this.seatPlayers();

        // Place the initial bets
        this.placeBets();        
    }

    public instantiateTableGame(){
        // Instantiate Table Game Objects
        this.dealerHand = new Hand(0,0);
        this.discard_pile = new Game.StackCard(0);

        // Create the Shoe Preview Area
        const element_shoe_preview_area = document.getElementById("shoe-preview-area")!;
        element_shoe_preview_area.innerHTML = "";
        const element_cards = document.createElement("div");
        element_cards.className = "cards";
        element_shoe_preview_area.append(element_cards);

        // Getting Dealer Area Element
        const element_dealer_area = document.getElementById("dealer-area")!;
        element_dealer_area.innerHTML = "";

        // Create Hand Element of the Dealer
        const element_dealer_hand = document.createElement("div");
        element_dealer_hand.className = "hand";
        element_dealer_area.appendChild(element_dealer_hand);

        // Create Value Element of the Dealer
        const element_dealer_value = document.createElement("div");
        element_dealer_value.className = "value";
        element_dealer_value.append(this.dealerHand.getHandTotal());
        element_dealer_hand.append(element_dealer_value);

        // Create Card Container Element of the Dealer
        const element_dealer_cards = document.createElement("div");
        element_dealer_cards.className = "cards";
        element_dealer_hand.appendChild(element_dealer_cards);

        // Bet Boxes Area
        const element_bet_boxes_area = document.getElementById("bet-boxes-area")!;
        element_bet_boxes_area.innerHTML = "";
        
        // -- Create the Bet Boxes
        for(let currentBetBox = 0; currentBetBox < GameConfig.BET_BOXES_AMOUNT; currentBetBox++){
            // Instantiate Bet Box Object
            const betbox = new BetBox( currentBetBox + 1 );
            // Add Bet Box Object to the List of Bet Boxes
            this.bet_boxes.push(betbox);

            // Create Bet Box HTML Element
            const element_betbox = document.createElement("div");
            element_betbox.className = "bet-box " + "bet-box-"+betbox.id;
            element_bet_boxes_area.append(element_betbox);

            // Instantiate Hand Object
            const hand = new Hand(1, currentBetBox + 1);
            // Add Hand Object to the list of Hands of this Bet Box
            betbox.hands.push(hand);

            // Create and Add HTML Element of the Hand to the Current Bet Box Element
            element_betbox.appendChild(this.createHandElement(hand));
        }
    }

    public seatPlayers() {

        // Create Players
        this.players.push(new Player("Juan"));
        this.players.push(new Player("David"));
        this.players.push(new Player("Godoy"));
        this.players.push(new Player("Triana"));
        this.players.push(new Player("Daiki"));
        this.players.push(new Player("Kazuma"));
        this.players.push(new Player("Yuki"));
        this.players.push(new Player("Yoshida"));
        this.players.push(new Player("Yamada"));

        // Assigning a player per Bet Box
        this.bet_boxes.forEach((betbox,index) => {
            if (index >= this.players.length) return;
            betbox.player = this.players[index];
        });

    }

    public placeBets() {
        for(let betbox of this.bet_boxes){
            if (betbox.player == null) continue;
            betbox.placeBet(25);

            // Showing HTML Elements of the Hand
            const element_betbox = document.querySelector(".bet-box-"+betbox.id)!;
            const element_hand = element_betbox.querySelector(".hand-1")!;
            const element_hand_value = element_hand.querySelector(".value")! as HTMLElement;
            element_hand_value.style.visibility = "visible";
            element_hand_value.innerHTML="0";
            const element_hand_bet = element_hand.querySelector(".bet")! as HTMLElement;
            element_hand_bet.innerHTML = betbox.hands[0].primary_bet.toString();
            element_hand_bet.style.visibility = "visible";
        }
    }

    public startNewShoe() {
        
        // -- Prepare the Shoe
        this.shoe = new Game.StackCard(GameConfig.DECKS_PER_SHOE);
        this.shoe.shuffle(this.die);

        // Adds the Cards to the Shoe preview on top of the page
        const element_cards = document.getElementById("shoe-preview-area")!.querySelector(".cards")!;
        this.shoe.cards.forEach( (card, currentCard)=>{
            const element_card = this.createCardElement(card, currentCard + 1)!;
            element_cards.append(element_card);
        });

        // -- Burning Card
        this.discard_pile.add(this.shoe.draw()!);

        // Update the Show Preview
        element_cards.firstChild!.remove();
    }

    public async initialDealOut(){
        this.current_hand_playing_index = 0;

        // Track Active Hands
        for (let betbox of this.bet_boxes){
            const hand = betbox.hands[0];
            if (hand.primary_bet == 0) continue;
            hand.isActive = true;
            this.active_hands.push(hand);
        }

        // Activate Dealer Hand
        this.dealerHand.isActive = true;

        // Deal the Primary Card to Players
        for (let hand of this.active_hands)
            await this.hitHand(hand);
            

        // Deal the Primary Card to Dealer
        await this.hitHand(this.dealerHand,"dealer");

        // Deal the Secondary Card to Players
        for (let hand of this.active_hands)
            await this.hitHand(hand);
            
        // Deal the Secondary Card to Dealer
        //if (!this.IS_EUROPEAN_NO_HOLE_CARD) this.dealerHand.hit(this.shoe.draw()!);

        this.courseOfPlay();
    }

    public async hitHand(hand: Hand, entity: string = "player") {
        await delay(GameConfig.DEAL_CARD_DELAY);

        // Play Deal Sound
        playDealSound();  
        
        // Get the Card out of the Shoe
        const card = this.shoe.draw()!
        
        // Update the Shoe Preview
        let element_cards = document.getElementById("shoe-preview-area")!.querySelector(".cards")!;
        element_cards.firstChild!.remove();

        // Add the Object card to the list of cards of the Hand Object
        hand.addCard(card);

        // Select the Parent Element of the Hand Element
        const element_area = entity == "dealer" ? document.getElementById("dealer-area")! : document.querySelector(".bet-box-"+hand.betbox_id)!;

        // Selects the Hand Element of the Parent Element
        const element_hand = element_area.querySelector(".hand" + (entity=="dealer"?"":"-"+hand.id.toString()))!;

        // Update Hand Value
        const element_hand_value = element_hand.querySelector(".value")!;
        element_hand_value.textContent = hand.getHandTotal();

        // Selects the Cards Container of that Hand
        element_cards = element_hand.querySelector(".cards")!;

        // Creates the HTML Card Element
        const card_id = hand.cards.length - 1;
        const element_card = this.createCardElement(card, card_id + 1);

        // Appends the Card Element to the Cards Container
        element_cards.appendChild(element_card);

        // Animate the Card Element
        const top_offset = 90;
        if(entity=="player"){
            gsap.set(element_card,{
                position: "absolute",
                top: "-400px",
                left: "0px",
                opacity: 0,
                rotation: gsap.utils.random(-100, 100),
            });
            gsap.to(element_card, {
                position: "absolute",
                duration: 0.7,
                opacity: 1,
                top: `${-top_offset + card_id * -30}px`,
                left: `${card_id * 35}px`,
                rotation: 0,
                ease: "power2.out"
            });
        }

        if(entity=="double"){
            gsap.set(element_card,{
                position: "absolute",
                top: "-400px",
                left: "0px",
                opacity: 0,
                rotation: gsap.utils.random(-100, 100),
            });
            gsap.to(element_card, {
                position: "absolute",
                duration: 0.7,
                opacity: 1,
                top: `${-top_offset + card_id * -50}px`,
                left: `${card_id * 15}px`,
                rotation: 90,
                onUpdate: function() {
                    const shadowY = gsap.utils.interpolate(5, -5, this.progress()); // Animate Y-offset
                    element_card.style.boxShadow = `5px ${shadowY}px 5px rgba(0, 0, 0, 0.25)`;
                },
                ease: "power2.out"
            });
        }

        if(entity=="dealer"){
            gsap.set(element_card,{
                position: "absolute",
                top: "-100px",
                left: "200px",
                opacity: 0,
                scale: 1,
                rotation: gsap.utils.random(-100, 100),
            });
            gsap.to(element_card, {
                position: "relative",
                duration: 0.7,
                opacity: 1,
                top: 0,
                left: 0,
                rotation: 0,
                ease: "power2.out"
            });
        }


        //if(DEBUG_MODE) game.active_hands.forEach( hand => hand.print());
    }    
    
    public courseOfPlay() {
        this.playNextHand();
    }

    public async playNextHand(){
        // Check if all hands have been played
        if(this.current_hand_playing_index >= this.active_hands.length){
            if(DEBUG_MODE) console.log("All hands have been played. Dealer's turn...");

            // Play the Dealer's Hand Recursively
            this.playDealerHand();
            this.dealerHand.isActive = false;
            this.dealerHand.isFinished = true;
            
            if (this.dealerHand.isSoft()){
                const element_dealer_area = document.getElementById("dealer-area")!;
                const element_hand_value = element_dealer_area.querySelector(".hand .value")!;
                element_hand_value.textContent = this.dealerHand.getHandTotal();
            }
            return;
        }

        // Select the current hand to play
        const hand = this.active_hands[this.current_hand_playing_index];
        if(DEBUG_MODE) console.log("Current Hand Playing: " + (this.current_hand_playing_index+1));

        // Highlight the current hand in the UI
        const element_betbox = document.querySelector(".bet-box-"+hand.betbox_id)!;
        const element_hand = element_betbox?.querySelector(".hand-"+hand.id)!;
        element_hand.classList.add("current_turn");

        if(hand.cards.length == 1)
            await this.hitHand(hand);

        if(hand.total == 21 && hand.cards.length == 2){
            if(DEBUG_MODE) console.log("Blackjack!");
            this.finishHand();
            return;
        }

        if(DEBUG_MODE) console.log("Waiting for playing action...");
        hand.print();
    }

    /**
     * Controls the dealer's actions according to standard blackjack rules.
     * This function is recursive, meaning it calls itself until the dealer's turn is complete.
     */
    public async playDealerHand() {
        // If the dealer's total exceeds 21, they bust and stop playing.
        if (this.dealerHand.total > 21) {
            if (DEBUG_MODE) console.log("Dealer has Too Many...");
            this.dealerHand.isBusted = true;
            return;
        }
        // If the dealer has a natural blackjack (21 with exactly 2 cards), they stop.
        if (this.dealerHand.total == 21 && this.dealerHand.cards.length == 2) {
            if (DEBUG_MODE) console.log("Dealer has a Blackjack...");
            return;
        }
        // If the dealer's total is greater than 17, they must stand.
        if (this.dealerHand.total > 17) {
            if (DEBUG_MODE) console.log("Dealer stands on "+ this.dealerHand.total.toString() + "...");
            return;
        }
        // Special case: If the dealer has exactly 17
        if (this.dealerHand.total == 17) {
            // Check if the dealer has a soft 17 (contains an Ace counted as 11)
            if (this.dealerHand.isSoft()) {
                // If the game rules allow hitting on soft 17, the dealer hits.
                if (GameConfig.IS_DEALER_HIT_ON_17) {
                    if (DEBUG_MODE) console.log("Dealer hits on soft 17...");
                    await this.hitHand(this.dealerHand, "dealer");
                    this.playDealerHand(); // Recursive call to check if another hit is needed.
                    return;
                } else {
                    // Otherwise, the dealer stands on soft 17.
                    if (DEBUG_MODE) console.log("Dealer stands on soft 17...");
                    return;
                }
            }
            // If it's a hard 17 (no Ace counted as 11), the dealer must stand.
            if (DEBUG_MODE) console.log("Dealer stands on hard 17...");
            return;
        }
        // If the dealer's total is below 17, they must hit.
        if (this.dealerHand.total < 17) {
            if (DEBUG_MODE) console.log(`Dealer hits on ${this.dealerHand.total}...`);
            await this.hitHand(this.dealerHand, "dealer");
            this.playDealerHand(); // Recursive call to continue hitting until they stand or bust.
            return;
        }
    }
    
    public finishHand(){
        // Select the current hand to play
        const hand = this.active_hands[this.current_hand_playing_index];
        hand.isFinished = true;
        hand.print();

        // Select the current Hand Element
        const element_current_turn = document.querySelector(".current_turn")!;

        // Update Hand Value
        if (this.active_hands[this.current_hand_playing_index].isSoft()){
            const element_value = element_current_turn.querySelector(".value")!;
            element_value.textContent = hand.getHandTotal();
        }

        // Remove the current_turn class
        element_current_turn.classList.remove("current_turn"); 

        // Continue playing the next hand
        this.current_hand_playing_index++;
        this.playNextHand();
    }



    public payAndTake() {
        
    }

    public displayConsole(){

        // Displaying Dealer's hand in the console
        console.log("Dealer Hand: ");
        this.dealerHand.print();

        // Printing Players' Hands in the console
        for (let currentBetBox=0; currentBetBox<this.bet_boxes.length; currentBetBox++){
            const betbox = this.bet_boxes[currentBetBox];
            if (betbox.player == null) continue;
            console.log("Box No. "+(currentBetBox+1)+": Player: " + betbox.player.name);
            for (let currentHand=0; currentHand<betbox.hands.length; currentHand++){
                const hand = betbox.hands[currentHand];
                hand.print();
            }  
        }
        
    }

    public createCardElement(card: Game.Card, id: number): HTMLElement{
        // Card Images Origin h: 240 w: 160
        let cards_path: string = "./assets/cards/"
        let img_type_file: string = ".png";

        const element_card = document.createElement("img");
        element_card.className = "card card-"+id;
        element_card.src = cards_path+card.toString(false)+img_type_file; 

        return element_card;
    }
    
    public createHandElement(hand: Hand): HTMLElement{
        // Create Hand HTML Element
        const element_hand = document.createElement("div");
        element_hand.className = "hand"+" hand-" + hand.id;
       
        // Create Value, Bet and Card Container Elements of the Hand
        const element_hand_value = document.createElement("div");
        element_hand_value.className = "value";
        element_hand_value.style.visibility = "hidden";
        element_hand_value.append(hand.getHandTotal());
        element_hand.appendChild(element_hand_value);

        const element_hand_bet = document.createElement("div");
        element_hand_bet.className = "bet";
        element_hand_bet.style.visibility = "hidden";
        element_hand_bet.append(hand.primary_bet.toString());
        element_hand.appendChild(element_hand_bet);

        const element_cards = document.createElement("div");
        element_cards.className = "cards";
        element_hand.appendChild(element_cards);

        return element_hand;
    }
}
let game = new BlackjackGame();


// Setting up the hover sound for the buttons
const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
    button.addEventListener('mouseenter', function() {
        playHoverButtonSound();
    });
});
    
// Setting up the click event for the deal button
document.getElementById("btn-deal")?.addEventListener("click", () => {
    if(game.active_hands.length != 0) return; 
    game.initialDealOut();
});

document.getElementById("btn-hit")?.addEventListener("click", async () => {
    // Do nothing if there are no active hands
    if(game.active_hands.length == 0) return;
    if(game.current_hand_playing_index == game.active_hands.length) return;

    // Get the current hand
    const hand = game.active_hands[game.current_hand_playing_index];

    // Hit the hand
    await game.hitHand(hand);

    if(DEBUG_MODE) console.log("Hit button clicked for the hand No: " + hand.id + " of Bet Box: " + hand.betbox_id);

    // Check if the hand is busted
    if(hand.total > 21){
        if(DEBUG_MODE) console.log("Too Many!");
        game.finishHand();
    }
    if(hand.total == 21){
        if(DEBUG_MODE) console.log("21!! Nice Hit!");
        game.finishHand();
    }
});

document.getElementById("btn-stand")?.addEventListener("click", async () => {
    // Do nothing if there are no active hands
    if(game.active_hands.length == 0) return; 

    // Get the current hand
    const hand = game.active_hands[game.current_hand_playing_index];

    if(DEBUG_MODE) console.log("Stand button clicked for the hand No: " + hand.id + " of Bet Box: " + hand.betbox_id);

    // Stand the hand by finishing it
    game.finishHand();

});

document.getElementById("btn-double")?.addEventListener("click", async () => {
    if(game.active_hands.length == 0) return;
    
    // Get the Current Hand Object in Play
    const current_hand = game.active_hands[game.current_hand_playing_index];

    if(!current_hand.isDoubleDownEnabled) return;

    await game.hitHand(current_hand, "double");

    if(DEBUG_MODE) console.log("Doubling Down!!...");

    const current_betbox = game.bet_boxes[current_hand.betbox_id-1];

    current_hand.secondary_bet = current_hand.primary_bet;
    current_betbox.player.stack -= current_hand.secondary_bet;

    const element_bet_boxes_area = document.getElementById("bet-boxes-area")!;
    const element_betbox = element_bet_boxes_area?.querySelector(".bet-box-"+current_hand.betbox_id)!;
    const element_hand = element_betbox.querySelector(".hand-"+current_hand.id)!;
    const element_hand_bet = element_hand.querySelector(".bet")!;
    element_hand_bet.textContent = (current_hand.primary_bet+current_hand.secondary_bet).toString();

    game.finishHand();
});


document.getElementById("btn-split")?.addEventListener("click", async () => {
    if(game.active_hands.length == 0) return;

    // Get the Current Hand Object in Play
    const current_hand = game.active_hands[game.current_hand_playing_index];

    if(!current_hand.isSplitEnabled) return;

    if(DEBUG_MODE) console.log("Splitting...");

    const new_hand = current_hand.split();

    const current_betbox = game.bet_boxes[current_hand.betbox_id-1];
    current_betbox.player.stack -= new_hand.primary_bet;
    new_hand.isActive = true;

    // Add the New Hand to the list of Hands of the current BetBox
    game.bet_boxes[current_hand.betbox_id-1].hands.push(new_hand);

    // Add the New Hand to the list of Active Hands
    game.active_hands.splice(game.current_hand_playing_index + 1, 0, new_hand);


    // Find the Current Bet Box Element
    const element_bet_boxes_area = document.getElementById("bet-boxes-area")!;
    const element_betbox = element_bet_boxes_area.querySelector(".bet-box-"+current_hand.betbox_id)!;

    // Create the HTML Hand Element
    const element_new_hand = game.createHandElement(new_hand);

    // Update the New Hand Element
    const element_new_hand_value = element_new_hand.querySelector(".value")! as HTMLElement;
    element_new_hand_value.style.visibility = "visible";
    element_new_hand_value.textContent = new_hand.getHandTotal();
    const element_new_hand_bet = element_new_hand.querySelector(".bet")! as HTMLElement;
    element_new_hand_bet.textContent = new_hand.primary_bet.toString();
    element_new_hand_bet.style.visibility = "visible";
    const element_new_hand_cards = element_new_hand.querySelector(".cards")

    // Update the position of the Cards Element
    const element_current_hand = element_betbox.querySelector(".hand-"+current_hand.id)!;
    const element_current_hand_cards = element_current_hand.querySelector(".cards")!;
    const element_card = element_current_hand_cards.lastChild! as HTMLElement;
    element_card.className = "card card-1";
    element_new_hand_cards?.append(element_card);

    gsap.set(element_card,{
        position: "absolute",
        top: "0px",
        left: "100px",
        opacity: 0,
        //rotation: gsap.utils.random(-100, 100),
    });
    gsap.to(element_card, {
        position: "absolute",
        duration: 0.3,
        opacity: 1,
        top: (-90 + 0).toString()+"px",
        left: "0px",
        rotation: 0,
        ease: "power2.out"
    });

    // Add the Hand Element to the BetBox Element
    element_betbox.append(element_new_hand);

    await game.hitHand(current_hand);
});

document.getElementById("btn-surrender")?.addEventListener("click", async () => {
    if (DEBUG_MODE) console.log("Surrender button clicked...");
});

document.getElementById("btn-insurance")?.addEventListener("click", async () => {
    if (DEBUG_MODE) console.log("Insurance button clicked...");
});

document.getElementById("btn-undo")?.addEventListener("click", async () => {
    if (DEBUG_MODE) console.log("Undo button clicked...");
});

document.getElementById("btn-clear-bets")?.addEventListener("click", async () => {
    if (DEBUG_MODE) console.log("Clear Bets button clicked...");
});


document.getElementById("btn-reset-table")?.addEventListener("click", async () => {
    if (DEBUG_MODE) console.log("Create reset button clicked...");
});


document.getElementById("btn-create-table")?.addEventListener("click", async () => {
    if (DEBUG_MODE) console.log("Create table button clicked...");
});

document.getElementById("btn-next-hand")?.addEventListener("click", async () => {
    // Do nothing if there are no active hands
    if(game.active_hands.length == 0) return; 
    if(game.current_hand_playing_index != game.active_hands.length) return; 

    // Resets the Dealer hand
    game.dealerHand.reset();

    // Update Dealer Value
    const element_dealer_area = document.getElementById("dealer-area")!;
    const element_dealer_value = element_dealer_area.querySelector(".hand .value") as HTMLElement;
    element_dealer_value.innerHTML = "0";

    // Resets the hands in the table
    game.bet_boxes.forEach(betbox => { 
        if (betbox.hands.length > 1)
            betbox.hands = [betbox.hands[0]];
        betbox.hands[0].reset();
    });

    // Clean the Active Hands Tracker
    game.active_hands = [];

    const element_bet_boxes_area = document.getElementById("bet-boxes-area")!;
    
    let element_cards_list = element_dealer_area.querySelectorAll(".cards")!;
    element_cards_list.forEach(element_cards =>{
        element_cards.innerHTML = "";
    });

    element_cards_list = element_bet_boxes_area.querySelectorAll(".cards")!;
    element_cards_list.forEach(element_cards =>{
        element_cards.innerHTML = "";
    });

    // Erase Hands Element of any previous split hand leaving only the first one
    const element_bet_boxes_list = element_bet_boxes_area.querySelectorAll(".bet-box")!;
    element_bet_boxes_list.forEach(element_betbox =>{
        while(element_betbox.children.length > 1)
            element_betbox.removeChild(element_betbox.lastChild!);
    });

    // Place new Bets
    game.placeBets();

    console.table(game.bet_boxes);
});



function playDealSound() {
    fetch("./assets/sounds/dealing_card.mp3")
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => audioCtx.decodeAudioData(arrayBuffer))
        .then(audioBuffer => {
            let source = audioCtx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioCtx.destination);
            source.start(0);
        })
        .catch(error => console.error("Error playing sound:", error));
}

function playHoverButtonSound() {
    fetch("./assets/sounds/hover_button.wav")
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => audioCtx.decodeAudioData(arrayBuffer))
        .then(audioBuffer => {
            let source = audioCtx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioCtx.destination);
            source.start(0);
        })
        .catch(error => console.error("Error playing sound:", error));
}

function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}