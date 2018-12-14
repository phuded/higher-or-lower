export function Game(players, drinkType, remove){

    this._id

    this.players = players;

    this.currentPlayer = 0;

    this.cards = newPack();

    this.remove = remove;

    this.currentCard = getCard(this);

    this.bet = 0;

    this.drinkType = drinkType;

    this.cardsLeft = this.cards.length;

    this.toJSON = function() {

        return {
            _id: this._id,
            players: this.players,
            currentPlayer: this.players[this.currentPlayer],
            remove: this.remove,
            currentCard: this.currentCard,
            bet: this.bet,
            drinkType: this.drinkType,
            cardsLeft: this.cardsLeft
        };
    };

};

function TurnResponse(status, nextCard, nextPlayer, bet, fingersToDrink, cardsLeft){

    this.status = status;

    this.nextCard = nextCard;

    this.nextPlayer = nextPlayer;

    this.bet = bet;

    this.fingersToDrink = fingersToDrink;

    this.cardsLeft = cardsLeft;
}


function newPack(){

    let cards = [];

    for(let i = 2; i < 15; i++){
        cards.push(new Card("hearts", i));
        cards.push(new Card("diamonds", i));
        cards.push(new Card("clubs", i));
        cards.push(new Card("spades", i));
    }

    return cards;
}

function Card(suit, value){

    this.suit = suit;

    this.value = value;
}

export function playTurn(game, guess, bet){

    const currentCardValue = game.currentCard.value;

    const nextCard = getCard(game);

    const guessedHigher = guess && (nextCard.value >= currentCardValue);
    const guessedLower = !guess && (currentCardValue >= nextCard.value);

    let status = false;

    let fingersToDrink = null;

    if(guessedHigher || guessedLower){

        status = true;

        game.bet += bet;
    }
    else{

        fingersToDrink = game.bet + bet;

        game.bet = 0

    }
    
    // Next player
    game.currentPlayer++;

    game.cardsLeft = game.cards.length;

    // Return: status, next card, next player, current bet, fingers to drink
    return new TurnResponse(status, nextCard, game.players[game.currentPlayer], game.bet, fingersToDrink, game.cardsLeft)
};

function getCard(game){

    const card = game.cards[Math.floor(Math.random() * game.cards.length)];

    if(game.remove){

        game.cards.remove(game.cards.indexOf(card));
    }

    game.currentCard = card;

    return card;
};

Array.prototype.remove = function(from, to) {
    var rest = this.slice((to || from) + 1 || this.length);
    this.length = from < 0 ? this.length + from : from;
    return this.push.apply(this, rest);
};