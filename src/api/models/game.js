
export default function Game(players, drinkType, remove){

    this._id

    this.players = players;

    this.currentPlayer = 0;

    this.cards = newPack();

    this.remove = remove;

    this.getCard = function(){

        const card = this.cards[Math.floor(Math.random() * this.cards.length)];

        if(this.remove){

            this.cards.remove(this.cards.indexOf(card));
        }

        this.currentCard = card;

        return card;
    };

    this.currentCard = this.getCard();

    this.bet = 0;

    this.drinkType = drinkType;

    this.playTurn = function(guess, bet){

        const currentCardValue = this.currentCard.value;

        const nextCard = this.getCard();

        const guessedHigher = guess && (nextCard.value >= currentCardValue);
        const guessedLower = !guess && (currentCardValue >= nextCard.value);

        let status = false;

        let fingersToDrink = null;

        if(guessedHigher || guessedLower){

            status = true;

            this.bet += bet;
        }
        else{

            fingersToDrink = this.bet + bet;

            this.bet = 0

        }


        // Next player
        this.currentPlayer++;


        // Return: status, next card, next player, current bet, fingers to drink
        return new TurnResponse(status, nextCard, this.players[this.currentPlayer], this.bet, fingersToDrink)
    };

    this.toJSON = function() {

        return {
            _id: this._id,
            players: this.players,
            currentPlayer: this.players[this.currentPlayer],
            remove: this.remove,
            currentCard: this.currentCard,
            bet: this.bet,
            drinkType: this.drinkType
        };
    };

};

function TurnResponse(status, nextCard, nextPlayer, bet, fingersToDrink){

    this.status = status;

    this.nextCard = nextCard;

    this.nextPlayer = nextPlayer;

    this.bet = bet;

    this.fingersToDrink = fingersToDrink;

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

Array.prototype.remove = function(from, to) {
    var rest = this.slice((to || from) + 1 || this.length);
    this.length = from < 0 ? this.length + from : from;
    return this.push.apply(this, rest);
};