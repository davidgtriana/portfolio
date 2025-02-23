export var GameState;
(function (GameState) {
    GameState[GameState["Betting"] = 0] = "Betting";
    GameState[GameState["InitialDealOut"] = 1] = "InitialDealOut";
    GameState[GameState["CourseOfPlay"] = 2] = "CourseOfPlay";
    GameState[GameState["LastHand"] = 3] = "LastHand";
    GameState[GameState["PayAndTake"] = 4] = "PayAndTake";
})(GameState || (GameState = {}));
