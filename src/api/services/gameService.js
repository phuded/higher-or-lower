import Game, {Card, GamePlayer} from "../models/game";
import {updatePlayer} from "./playerService";


function notifyClients(gameId, game, prevPlayer, playerUpdates){

    // Web Socket Push to relevant clients
    let wsClients = global.clients[gameId];

    if(wsClients){

        Object.entries(wsClients).forEach(entry => {

            let clientPlayerName = entry[0];
            let clientConnection = entry[1];

            if(clientPlayerName !== prevPlayer) {

                clientConnection.send(JSON.stringify({game: game, playerUpdates: playerUpdates}));
            }
        });
    }

}

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

    newGame.currentPlayerName = newGame.players[0].name;

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

export async function updateGame(id, playerName, loggedInPlayerName, guess, bet, res) {

    let game;

    try {

        game = await Game.findById(id);
    }
    catch (e) {

        return res.status(404).send({error: "Cannot update game: " + id + ": Not found"});
    }

    const currentPlayerName = game.currentPlayerName;

    if(!game.playAsAnyone && (currentPlayerName != playerName)){

        return res.status(400).send({error: "Cannot update game: " + id + ": Invalid current player: " + playerName});
    }

    if(game.limitBetsToOne && bet > 1){

        return res.status(400).send({error: "Cannot update game: " + id + ": Invalid bet: " + bet});
    }

    // Make changes
    const gameUpdated = playTurn(game, guess, bet);

    if(!gameUpdated){

        return res.status(400).send({error: "Cannot update game: " + id + ": Game has finished."});

    }

    if(game.cardsLeft == 0){

        game.winners = setWinners(game.players);
    }

    await game.save();

    // Notify via WS
    notifyClients(id, game, loggedInPlayerName, null);

    return res.send(game);
};

function setWinners(players){

    let winningPercentage = 0.0;
    let winners = [];

    players.forEach(function (player) {

        const percentage = parseFloat(player.stats.percentageCorrect);

        if(percentage > winningPercentage){

            winningPercentage = percentage;
            winners = [player.name];
        }
        else if(percentage === winningPercentage){

            winners.push(player.name)
        }
    });

    return winners;
}

export async function updateGamePlayers(id, newPlayers, playersToRemove, res) {

    let game;

    try {

        game = await Game.findById(id);
    }
    catch (e) {

        return res.status(404).send({error: "Cannot update game: " + id + ": Not found"});
    }

    let gameUpdated = false;

    const playerUpdates = {added: [], removed: []};

    if(newPlayers){

        newPlayers.forEach(function (newPlayer) {

            const updated = addPlayerToGame(game, newPlayer);

            if(updated){

                gameUpdated = true;

                playerUpdates.added.push(newPlayer);
            }

        });
    }

    if(playersToRemove){

        playersToRemove.forEach(function (playerToRemove) {

            const updated = removePlayerFromGame(game, playerToRemove);

            if(updated){

                gameUpdated = true;

                playerUpdates.removed.push(playerToRemove);
            }

        });
    }

    if(!gameUpdated){

        return res.status(200).send(game);
    }

    const allActivePlayers = getAllActivePlayers(game.players);

    // No Players
    if(!allActivePlayers || allActivePlayers.length == 0){

        return deleteGame(id, res);

    }

    const isCurrentPlayerActive = game.players.find(player => (player.name == game.currentPlayerName)).active;

    if(!isCurrentPlayerActive) {

        const nextPlayer = getNextPlayer(game.currentPlayerName, allActivePlayers);

        // Set next player
        game.currentPlayerName = nextPlayer.name;
    }

    await game.save();

    // Notify via WS
    notifyClients(id, game, null, playerUpdates);

    return res.send(game);
};

export async function deleteGame(id, res) {

    const result = await Game.findByIdAndDelete(id);

    if(result.deletedCount == 0){

        return res.status(500).send();
    }

    // Delete the WS map - this will kick out the last in the game
    delete global.clients[id];

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

async function playTurn(game, guess, bet){

    // Game is finished
    if(game.cardsLeft == 0){

        return false
    }

    const currentCardValue = game.currentCard.value;

    const nextCard = setCard(game);

    const guessedHigher = guess && (nextCard.value >= currentCardValue);
    const guessedLower = !guess && (currentCardValue >= nextCard.value);

    let status = false;

    // Reset fingers to drink
    let fingersToDrink = 0;

    if(guessedHigher || guessedLower){

        status = true;

        game.bet += bet;
    }
    else{

        // Set fingers to drink as current bet plus latest bet
        fingersToDrink = game.bet + bet;

        // Reset bet
        game.bet = 0

    }

    game.fingersToDrink = fingersToDrink;

    game.status = status;

    const allActivePlayers = getAllActivePlayers(game.players);

    const nextPlayer = getNextPlayer(game.currentPlayerName, allActivePlayers);

    // Set next player
    game.currentPlayerName = nextPlayer.name;

    // Set cards left over
    game.cardsLeft = game.cards.length;

    // Add stats
    await setPlayerStats(game.currentPlayerName, game.players, status, fingersToDrink);

    return true
};

async function setPlayerStats(currentPlayerName, players, status, fingersToDrink){

    const gamePlayerStats = players.find(player => (player.name == currentPlayerName)).stats;

    const guesses = gamePlayerStats.guesses;

    guesses.push(status);

    const numGuesses = guesses.length;

    let correct = 0;
    let correctStreak = 0;
    let bestCorrectStreak = 0;

    let incorrectStreak = 0;
    let bestIncorrectStreak = 0;

    guesses.forEach(function(correctGuess) {

        if(correctGuess){

            //Increase number which are correct
            correct++;

            //Increase correct streak
            correctStreak++;

            //If current correct streak is better than any previous best - store
            if(correctStreak > bestCorrectStreak){
                bestCorrectStreak = correctStreak;
            }

            //Terminate any incorrect streaks
            incorrectStreak = 0;
        }
        else{
            //Increase incorrect streak
            incorrectStreak++;

            //If current incorrect streak is better than any previous best - store
            if(incorrectStreak > bestIncorrectStreak){
                bestIncorrectStreak = incorrectStreak;
            }

            //Terminate any correct streaks
            correctStreak = 0;
        }
    });

    const percentage = numGuesses > 0 ? (correct * 100/numGuesses).toFixed(1) : 0.0;

    gamePlayerStats.numCorrectGuesses = correct;
    gamePlayerStats.numIncorrectGuesses = numGuesses - correct;
    gamePlayerStats.percentageCorrect = percentage;
    gamePlayerStats.correctGuessStreak = bestCorrectStreak;
    gamePlayerStats.incorrectGuessStreak = bestIncorrectStreak;

    // Update player stats - don't need to await
    await updatePlayer(currentPlayerName, bestCorrectStreak, bestIncorrectStreak, fingersToDrink);
}


function getAllActivePlayers(players){

    return players.filter(player => player.active);
}

function getNextPlayer(currentPlayerName, allActivePlayers){

    const currentPlayerIndex = allActivePlayers.findIndex(player => (player.name === currentPlayerName));

    let nextPlayerIndex = 0;

    if(currentPlayerIndex >= 0 && currentPlayerIndex < allActivePlayers.length - 1){

        nextPlayerIndex = currentPlayerIndex + 1;
    }

    return allActivePlayers[nextPlayerIndex];
}


function addPlayerToGame(game, playerName){

    let playerInGame = false;

    let updated = false;

    if(!game){

        return updated;
    }

    game.players.forEach(function (player) {

        if(player.name == playerName) {

            // Already in game
            playerInGame = true;

            if (!player.active){

                updated = true;

                player.active = true;
            }
        }
    });

    if(!playerInGame){

        updated = true;

        // Add
        game.players.push(new GamePlayer({name: playerName, active: true}))
    }

    return updated;
}


function removePlayerFromGame(game, playerName){

    let updated = false;

    if(!game){

        return updated;
    }

    game.players.forEach(function (player) {

        if((player.name === playerName) && player.active){

            updated = true;

            player.active = false;
        }
    });

    return updated;
}

function setCard(game){

    const card = game.cards[Math.floor(Math.random() * game.cards.length)];

    if(game.removeCards){

        game.cards.pull(card);

    }

    game.currentCard = card;

    return card;
};