import * as Game from "./blackjack/card-game.js";
import { Hand } from "./blackjack/hand.js";
import { BlackjackGame } from "./blackjack/blackjack.js";
import { GameConfig } from "./config.js";
import { GameState } from "./blackjack/game-state.js";

declare const gsap: any; // 👈 This tells TypeScript to ignore the missing import

let audioCtx = new window.AudioContext();

export class UserInterface {
    game: BlackjackGame;
    lbls = new Map<string,HTMLElement>();
    btns = new Map<string,HTMLElement>();

    constructor(game: BlackjackGame){
        this.game = game; 
        this.game.ui = this;
    }

    /**
    * Creates the Element needed to run the table
    */
    public initializeTableGameUI(){

        // DONT FORGET TO ERASE ALL CARDS FIRST
        this.lbls.clear();
        this.btns.clear();


        // Setting up Shoe Preview Area
        this.lbls.set("shoe-preview-area", document.getElementById("shoe-preview-area")!);
        this.lbls.get("shoe-preview-area")!.append(this.createElement("div", "cards"));
        
        // Setting up Dealers Area
        this.lbls.set("dealer-area", document.getElementById("dealer-area")!);
        const element_hand = this.createHandElement();
        element_hand.querySelector(".bets")?.remove();
        this.lbls.get("dealer-area")!.append(element_hand);

        // Setting up Boxes Area
        this.lbls.set("bet-boxes-area", document.getElementById("bet-boxes-area")!);
        
        // Create the Bet Boxes Elements
        this.game.bet_boxes.forEach( (betbox, index) =>{
            const element_betbox = this.createElement("div", "bet-box" + " bet-box-"+ betbox.id);
            element_betbox.style.zIndex = (this.game.bet_boxes.length - index).toString();
            element_betbox.addEventListener("click", async () => this.actionBetBox(element_betbox));
            this.lbls.get("bet-boxes-area")?.append(element_betbox);
        });

        // Setting Up the Buttons Area
        const buttonConfig: Record<string, { label: string; action: () => void }> = {
            "btn-deal": { label: "Deal", action: () => this.game.actionDeal() },
            "btn-hit": { label: "Hit", action: () => this.game.actionHit() },
            "btn-stand": { label: "Stand", action: () => this.game.actionStand() },
            "btn-double": { label: "Double", action: () => this.game.actionDouble() },
            "btn-split": { label: "Split", action: () => this.game.actionSplit() },
            "btn-surrender": { label: "Surrender", action: () => this.game.actionSurrender() },
            "btn-insurance": { label: "Insurance", action: () => this.game.actionInsurance() },
            "btn-clear-bets": { label: "Clear Bets", action: () => this.game.actionClearBets() },
            "btn-undo": { label: "Undo", action: () => this.game.actionUndo() },
            "btn-reset-table": { label: "Reset Table", action: () => this.game.actionResetTable() },
            "btn-create-table": { label: "Create Table", action: () => this.game.actionCreateTable() },
            "btn-next-hand": { label: "Next Hand", action: () => this.game.actionNextHand() }
        };

        this.lbls.set("buttons-area", document.getElementById("buttons-area")!);

        Object.entries(buttonConfig).forEach(([key, { label, action }]) => {
            const btn =  this.createElement("button", "btn " + key, label);
            btn.addEventListener("click", async () =>{ action(); });
            btn.style.display = "none";
            this.lbls.get("buttons-area")?.append(btn);
            this.btns.set(key,btn);
        });

        

        // Setting up the hover sound for the buttons
        const buttons = document.querySelectorAll('.btn');
        buttons.forEach(button => {
            button.addEventListener('mouseenter', () => {
                this.playHoverButtonSound();
            });
        });
    }

    public startNewHand(){
        const element_cards_list = document.querySelectorAll(".cards")!;
        element_cards_list.forEach(element_cards => {
            const element_cards_parent = element_cards.parentElement;
            if (!element_cards_parent || element_cards_parent.id === "shoe-preview-area") return;
        
            // Stop all animations
            gsap.killTweensOf([...element_cards.querySelectorAll("*")]);
        
            // Clear the cards
            element_cards.innerHTML = "";
        
            // Remove any inline styles applied by GSAP
            element_cards.querySelectorAll("*").forEach(child => {
                (child as HTMLElement).style.cssText = "";
            });
        
            // Force a reflow (tricks the browser into re-rendering)
            (element_cards as HTMLElement).style.display = "none";
            (element_cards as HTMLElement).offsetHeight; // Trigger reflow
            (element_cards as HTMLElement).style.display = ""; // Restore display
        });

        const element_bet_boxes_area = document.getElementById("bet-boxes-area")!;
        const element_bet_boxes_list = element_bet_boxes_area.querySelectorAll(".bet-box")!;
        element_bet_boxes_list.forEach(element_betbox =>{
            element_betbox.innerHTML = "";
            element_betbox.classList.add("available");
        });

        // Enable the buttons needed before starting the game
        this.btns.get("btn-deal")!.style.display = "flex";
        this.btns.get("btn-clear-bets")!.style.display = "flex";
        this.btns.get("btn-undo")!.style.display = "flex";
        this.btns.get("btn-reset-table")!.style.display = "flex";
    }

    public addCardsToTheShoePreviewArea(){
        this.game.shoe.cards.forEach( (card, index)=>{
            this.lbls.get("shoe-preview-area")?.querySelector(".cards")?.append(this.createCardElement(card, index + 1));
        });
    }

    public removeCardToTheShoePreviewArea(){
        this.lbls.get("shoe-preview-area")?.querySelector(".cards")!.firstChild?.remove();
    }
    
    public removeAllAvailableHighlight(){
        const element_betbox_unselected_list = document.querySelectorAll(".available");
        element_betbox_unselected_list.forEach(element_betbox => { element_betbox.classList.remove("available");});
    }

    public hideAllButtons(){
        this.btns.forEach(( btn, key) => { btn.style.display = "none";});
    }

    /**
     * Updates the UI so the current Hand is highlighted 
     * @param hand 
     */
    public highlightHandinTurn(hand: Hand){
        // Highlight the current hand in the UI
        const element_betbox = document.querySelector(".bet-box-"+hand.betbox_id)!;
        const element_hand = element_betbox?.querySelector(".hand-"+hand.id)!;
        element_hand.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
        element_hand.classList.add("current_turn");
    }

    /**
     * 
     * @param hand 
     */
    public removeHighlightHandinTurn(hand: Hand){
        // Highlight the current hand in the UI
        const element_betbox = document.querySelector(".bet-box-"+hand.betbox_id)!;
        const element_hand = element_betbox?.querySelector(".hand-"+hand.id)!;
        element_hand.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
        element_hand.classList.remove("current_turn");
    }

    public updateButtonStates(hand: Hand){
        this.hideAllButtons();

        // Keep Showing Hit and Stand
        this.btns.get("btn-hit")!.style.display = "flex";
        this.btns.get("btn-stand")!.style.display = "flex";

        // Update Button States
        if (hand.canDouble) this.btns.get("btn-double")!.style.display = "flex";
        if (hand.canSplit) this.btns.get("btn-split")!.style.display = "flex";
        if (hand.canSurrender) this.btns.get("btn-surrender")!.style.display = "flex";
    }

    /**
     * Creates an HTMLElement with the childrens of a Hand Element in it such as Value, Cards and Bet.
     * @param hand 
     * @returns element_hand
     */
    public createHandElement(): HTMLElement {
        const element_hand = document.createElement("div");
        element_hand.className = "hand";
        element_hand.appendChild(this.createElement("div", "value", "0"));
        element_hand.appendChild(this.createElement("div", "bets"));
        element_hand.appendChild(this.createElement("div", "cards"));
        return element_hand;
    }

    public async createSplitHandElement(current_hand:Hand, new_hand:Hand){
        if(current_hand.isDealers) return;

        // Find the Current Bet Box Element
        const element_bet_boxes_area = this.lbls.get("bet-boxes-area")!;
        const element_betbox = element_bet_boxes_area.querySelector(".bet-box-"+current_hand.betbox_id)!;

        const element_new_hand = this.createHandElement();
        element_new_hand.className = "hand hand-" + new_hand.id;
        element_betbox.append(element_new_hand);
        
        const element_current_hand = element_betbox.querySelector(".hand-" + current_hand.id)!;
        const element_current_hand_cards = element_current_hand.querySelector(".cards")!;
        const element_card = element_current_hand_cards.lastChild! as HTMLElement;
        element_card.className = "card card-1";
        const element_new_hand_cards = this.updateHandData(new_hand, element_new_hand);

        await this.addBet(new_hand, element_new_hand);
        await this.animateSplitCard(element_card, element_new_hand_cards);

        
    }

    /**
     * Creates an HTMLImageElement of a Card and assigns its image path.
     * @param card A card of a Card Game
     * @param id The position of the cards in the Cards Container starting from 1
     * @returns Returns an HTMLImageElement
     */
    public createCardElement(card: Game.Card, id: number): HTMLElement{
        // Card Images Origin h: 240 w: 160
        let cards_path: string = "./assets/cards/"
        let img_type_file: string = ".png";
        const element_card = this.createElement("img", "card card-"+id);
        (element_card as HTMLImageElement).src = cards_path + card.toString(false) + img_type_file; 
        return element_card;
    }

    public async addBet(hand:Hand,  element_hand?:Element){
        await this.delay(GameConfig.PLACE_CHIP_DELAY);
        this.playCasinoChipSound();

        if(!element_hand){
            const element_bet_boxes_area = this.lbls.get("bet-boxes-area")!;
            const element_betbox = element_bet_boxes_area?.querySelector(".bet-box-"+ hand.betbox_id)!;
            element_hand = element_betbox.querySelector(".hand-"+ hand.id)!;
        }

        const element_bets = element_hand.querySelector(".bets")!;
        const chip_id = element_bets.children.length;
        const element_chip = this.createElement(
            "div",
            "bet bet-" + (chip_id+1).toString(),
            chip_id == 0 ? hand.primary_bet.toString():hand.secondary_bet.toString())!;
        element_bets.append(element_chip);

        // Animate the Chip Element
        gsap.set(element_chip, {
            position: "absolute",
            opacity: 0,
            top: (((chip_id) * 30)-15).toString()+"px",
            left: "100px",
        });

        gsap.to(element_chip, {
            left: "-15px",
            opacity: 1,
            duration: 0.3,
            ease: "power2.out",
        });
    }
    
    /**
     * Creates an HTMLElement with a given tag and ClassName, it may not have a TextContent
     * @param tag 
     * @param className 
     * @param textContent 
     * @returns 
     */
    private createElement(tag: string, className: string, textContent?: string): HTMLElement {
        const element = document.createElement(tag);
        element.className = className;
        if (textContent) element.textContent = textContent;
        return element;
    }

    public async dealCard(card: Game.Card, hand: Hand, isDouble: boolean) {
        // Select the Parent Element of the Hand Element (If it doesn't have a parent, it is the dealer hand)
        const element_parent = hand.isDealers
            ?   this.lbls.get("dealer-area")
            :   document.querySelector(".bet-box-" + hand.betbox_id);

        const element_hand = element_parent?.querySelector(".hand" + (hand.isDealers?"":"-"+hand.id.toString()))!;
        const element_cards = this.updateHandData(hand, element_hand);
        const element_card = this.createCardElement(card, hand.cards.length);
        
        await this.animateDealCard(element_card, element_cards, !hand.isDealers, isDouble);
    }

    /**
     * It updates the value of the hand and returns the container of the cards of this hand
     * @param hand 
     * @param element_hand 
     * @returns element_cards 
     */
    public updateHandData(hand: Hand, element_hand?:Element): Element{
        if(!element_hand){
            if(hand.isDealers){
                const element_dealer_area = this.lbls.get("dealer-area")!;
                element_hand = element_dealer_area.querySelector(".hand")!;

            }else{
                const element_bet_boxes_area = this.lbls.get("bet-boxes-area")!;
                const element_betbox = element_bet_boxes_area.querySelector(".bet-box-" + hand.betbox_id)!;
                element_hand = element_betbox.querySelector(".hand-" + hand.id)!;
            }
        }
        const element_hand_value = element_hand.querySelector(".value")!;
        element_hand_value.textContent = hand.getHandTotal();
        if(hand.isBlackJack) element_hand_value.className = "value blackjack";
        if(hand.isBusted) element_hand_value.className = "value busted";

        const element_cards = element_hand.querySelector(".cards")!;
        // element_cards.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
        return element_cards;
    }

    public async animateDealCard(element_card:Element, element_cards:Element, isPlayer: boolean, isDouble: boolean){
        await this.delay(GameConfig.DEAL_CARD_DELAY);
        this.playDealSound();
        let classes = element_card?.classList; // Get all classes
        let element_betbox_class_selected = [...classes].find(cls => cls.startsWith("card-"))!;
        let card_id = parseInt(element_betbox_class_selected.split("-")[1]);
        element_cards.append(element_card);

        // Animate the Card Element
        const top_offset = -80;
        const left_offset = -5;
        gsap.set(element_card,{
            position: "absolute",
            opacity: 0,
            top: isPlayer?"-400px":"-100px",
            left: isPlayer?"0px":"200px",
            rotation: gsap.utils.random(-100, 100),
        });
        gsap.to(element_card, {
            position: isPlayer?"absolute":"relative",
            top: isPlayer?`${top_offset + (card_id-1) * (isDouble?-50:-30)}px`:0,
            left: isPlayer?`${left_offset + (card_id-1) * (isDouble?9:25)}px`:0,
            opacity: 1,
            rotation: isDouble? 90:0,
            duration: 0.7,
            ease: "power2.out",
            ...(isDouble && {
                onUpdate: function () {
                    const shadowY = gsap.utils.interpolate(5, -5, this.progress()); // Animate Y-offset
                    (element_card as HTMLElement).style.boxShadow = `5px ${shadowY}px 5px rgba(0, 0, 0, 0.25)`;
                }
            })
        });
    }

    public async animateSplitCard(element_card:Element, element_cards:Element){
        await this.delay(GameConfig.DEAL_CARD_DELAY);
        this.playDealSound();
        element_cards.append(element_card);
        const top_offset = -80;
        const left_offset = -5;
        gsap.set(element_card,{
            position: "absolute",
            top: "0px",
            left: "100px",
            opacity: 0,
            rotation: gsap.utils.random(-100, 100),
        });
        gsap.to(element_card, {
            position: "absolute",
            top: `${top_offset}px`,
            left: `${left_offset}px`,
            duration: 0.7,
            opacity: 1,
            rotation: 0,
            ease: "power2.out"
        });
    }

    public showCutCard(){
        document.querySelector(".last-hand")!.textContent = "Last Hand";
    }

    public async actionBetBox(element_betbox: Element){
        if(this.game.state != GameState.Betting) return;
        if(!element_betbox.classList.contains("available")) return;

        // Find out which BetBox was Clicked
        let classes = element_betbox?.classList; // Get all classes
        let element_betbox_class_selected = [...classes].find(cls => cls.startsWith("bet-box-"))!;
        let betbox_id = parseInt(element_betbox_class_selected.split("-")[2]);

        // Place the Bet and Create the Hand
        const hand = this.game.placeBet(betbox_id, 25);

        element_betbox.classList.remove("available");
        
        const element_hand = this.createHandElement();
        element_hand.className = "hand hand-1";
        element_betbox.appendChild(element_hand);

        await this.addBet(hand, element_hand);

        document.querySelector(".stack-amount")!.textContent = this.game.players[0].stack.toString();
        this.playCasinoChipSound();
    }

    playCasinoChipSound() {
        fetch("./assets/sounds/casino_chip.wav")
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
    playHoverButtonSound() {
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
    playDealSound() {
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
    delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}



