import Game, {Card, GamePlayer} from "../models/game";

export async function getGames(req, res) {

    const orderBy = req.query["order-by"] ? req.query["order-by"] : "name";

    var dir = req.query.dir ? req.query.dir : "asc";
    (dir == "asc")? dir = 1 : dir = -1;

    const sort = {[orderBy]: dir};

    const start = req.query.start ? parseInt(req.query.start) : 0;
    const num = req.query.num ? parseInt(req.query.num) : 1000;

    const countPromise = Game.countDocuments({});

    const gamesPromise = Game.find({}).sort(sort).skip(start).limit(num);

    const data = await Promise.all([gamesPromise, countPromise]);

    return res.send({games: data[0], total: data[1]});
};

export async function getGame(id, res) {

    let game;

    try {
        game = await Game.findById(id);
    }
    catch (e) {

        return res.status(500).send({error: e.message});
    }

    if(!game){

        return res.status(404).send();

    }

    return res.send(game);

};

export async function createGame(gameBody, res) {

    let newGame = new Game(gameBody);

    const players = [];

    gameBody.players.forEach(function (playerName) {

        players.push(new GamePlayer({name: playerName}));
    });

    newGame.players = players;

    newGame.currentPlayer = newGame.players[0];

    newGame.cards = newPack(newGame.wholePack);

    setCard(newGame);

    newGame.cardsLeft = newGame.cards.length;

    let result;

    try {
        result = await newGame.save();
    }
    catch (e) {

        return res.status(500).send({error: e.errmsg});
    }

    return res.send(result);

};

export async function updateGame(id, playerName, guess, bet, res) {

    let game;

    try {

        game = await Game.findById(id);
    }
    catch (e) {

        return res.status(404).send({error: "Cannot update game: " + id + ": Not found"});
    }

    const currentPlayer = game.currentPlayer.name;

    if(!game.playAsAnyone && (currentPlayer != playerName)){

        return res.status(400).send({error: "Cannot update game: " + id + ": Invalid current player: " + playerName});
    }

    // Make changes
    const gameUpdated = playTurn(game, guess, bet);

    if(!gameUpdated){

        return res.status(400).send({error: "Cannot update game: " + id + ": Game has finished."});

    }

    await game.save();

    return res.send(game);
};



export async function updateGamePlayers(id, newPlayers, playersToRemove, res) {

    let game;

    try {

        game = await Game.findById(id);
    }
    catch (e) {

        return res.status(404).send({error: "Cannot update game: " + id + ": Not found"});
    }

    let gameUpdated = false;

    if(newPlayers){

        newPlayers.forEach(function (newPlayer) {

            const added = addPlayerToGame(game, newPlayer);

            if(added){

                gameUpdated = true;
            }

        });
    }

    if(playersToRemove){

        playersToRemove.forEach(function (playerToRemove) {

            const removed = removePlayerFromGame(game, playerToRemove);

            if(removed){

                gameUpdated = true;
            }

        });
    }

    if(!gameUpdated){

        return res.status(200).send(game);
    }

    // No Players
    if(game.players.length === 0){

        return deleteGame(id, res);

    }

    await game.save();

    return res.send(game);
};

export async function deleteGame(id, res) {

    const result = await Game.findByIdAndDelete(id);

    if(result.deletedCount == 0){

        return res.status(500).send();
    }

    return res.send();
 };


function newPack(wholePack){

    let cards = [];

    for(let i = 2; i < 15; i++){

        cards.push(new Card({suit: "hearts", value: i}));

        if(wholePack) {
            cards.push(new Card({suit: "diamonds", value: i}));
            cards.push(new Card({suit: "clubs", value: i}));
            cards.push(new Card({suit: "spades", value: i}));
        }
    }

    return cards;
}

function playTurn(game, guess, bet){

    if(game.cardsLeft == 0){

        return false
    }

    const currentCardValue = game.currentCard.value;

    const nextCard = setCard(game);

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

    return true
};

function addPlayerToGame(game, playerName){

    let inGame = false;

    if(!game){

        return inGame;
    }

    game.players.forEach(function (player) {

        if(player.name == playerName){

            inGame = true;
        }
    });

    if(!inGame){

        // Add
        game.players.push(new GamePlayer({name: playerName}))
    }

    return !inGame;
}


function removePlayerFromGame(game, playerName){

    let inGame = false;

    if(!game){

        return inGame;
    }

    let pIndex = -1;

    game.players.forEach(function (player, idx) {

        if(player.name == playerName){

            inGame = true;

            pIndex = idx;
        }
    });

    if(inGame){

        if(game.currentPlayerIdx === pIndex){

            // Next player
            if(game.currentPlayerIdx < (game.players.length -1)) {

                game.currentPlayerIdx++;
            }
            else{
                game.currentPlayerIdx = 0;
            }

            // Set player
            game.currentPlayer = game.players[game.currentPlayerIdx];
        }

        // Remove player
        game.players.splice(pIndex, 1);

        // Ensure it is not more then length of array
        if(game.currentPlayerIdx >= game.players.length){

            game.currentPlayerIdx = game.players.length - 1;
            game.currentPlayer = game.players[game.currentPlayerIdx];
        }

    }

    return inGame;
}

function setCard(game){

    const card = game.cards[Math.floor(Math.random() * game.cards.length)];

    if(game.removeCards){

        game.cards.pull(card);

    }

    game.currentCard = card;

    return card;
};

// function sanitiseGame(game){
//
//     delete game.cards;
//
//     return game;
// }