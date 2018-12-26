import {getGames as sGetGames, getGame as sGetGame, createGame as sCreateGame, updateGame as sUpdateGame, updateGamePlayers as sUpdateGamePlayers, deleteGame as sDeleteGame} from "../services/gameService";
import GamePlayer from "../models/gamePlayer";

export function getGame(req, res) {

    const id = req.params.id;

    if(!id){

        return new res.status(400).send({error: "Invalid parameters: no ID specified."});
    }

    return sGetGame(id, res);

};

export function getGames(req, res) {

    return sGetGames(req, res);

};

export function createGame(req, res) {

    let gameBody = req.body;

    if(!gameBody.name || !gameBody.owner || !gameBody.players || !gameBody.drinkType || (gameBody.remove == null) || (gameBody.wholePack == null) || (gameBody.betAnyCard == null)){

        return res.status(400).send({error: "Invalid parameters"});
    }

    const players = [];

    gameBody.players.forEach(function (playerName) {

        players.push(new GamePlayer(playerName));
    });

    gameBody.players = players;

    return sCreateGame(gameBody, res);

};

export function updateGame(req, res) {

    const id = req.params.id;

    if(!id){

        return res.status(400).send({error: "Invalid parameters: no ID specified."});
    }

    let turnBody = req.body;

    if((turnBody.guess == null) || (turnBody.bet == null) || !turnBody.playerName){

        return res.status(400).send({error: "Invalid parameters"});
    }

    return sUpdateGame(id, turnBody.playerName, (turnBody.guess == "true"), parseInt(turnBody.bet), res);
};

export function updateGamePlayers(req, res) {

    const id = req.params.id;

    if(!id){

        return res.status(400).send({error: "Invalid parameters: no ID specified."});
    }

    let turnBody = req.body;

    if(!turnBody.players && !turnBody.playersToRemove){

        return res.status(400).send({error: "Invalid parameters"});
    }

    return sUpdateGamePlayers(id, turnBody.players, turnBody.playersToRemove, res);
};


export function deleteGame(req, res) {

    const id = req.params.id;

    if(!id){

        return res.status(400).send({error: "Invalid parameters: no ID specified."});
    }

    return sDeleteGame(id, res);
};