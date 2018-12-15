export function Game(players, drinkType, remove){

    this._id

    this.players = players;

    this.currentPlayerIdx = 0;

    this.currentPlayer = this.players[0];

    this.status = null;

    this.cards = newPack();

    this.remove = remove;

    this.currentCard = getCard(this);

    this.bet = 0;

    this.fingersToDrink = 0;

    this.drinkType = drinkType;

    this.cardsLeft = this.cards.length;

    this.toJSON = function() {

        return {
            _id: this._id,
            players: this.players,
            currentPlayer: this.currentPlayer,
            remove: this.remove,
            currentCard: this.currentCard,
            bet: this.bet,
            drinkType: this.drinkType,
            cardsLeft: this.cardsLeft
        };
    };

};

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

    let fingersToDrink = 0;

    if(guessedHigher || guessedLower){

        status = true;

        game.bet += bet;
    }
    else{

        fingersToDrink = game.bet + bet;

        game.bet = 0

    }

    game.fingersToDrink = fingersToDrink;

    game.status = status;

    game.players[game.currentPlayerIdx].stats.push(status);

    // Next player
    if(game.currentPlayerIdx < (game.players.length -1)) {

        game.currentPlayerIdx++;
    }
    else{
        game.currentPlayerIdx = 0;
    }

    // Set player
    game.currentPlayer = game.players[game.currentPlayerIdx];

    game.cardsLeft = game.cards.length;
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