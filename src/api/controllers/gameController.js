import {getGames as sGetGames, getGame as sGetGame, createGame as sCreateGame, updateGame as sUpdateGame, deleteGame as sDeleteGame} from "../services/gameService";

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

    if(!gameBody.players || !gameBody.drinkType || (gameBody.remove == null)){

        return new res.status(400).send({error: "Invalid parameters"});
    }

    const players = [];

    gameBody.players.forEach(function (playerName) {

        players.push({name: playerName, stats: []})
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


export function deleteGame(req, res) {

    const id = req.params.id;

    if(!id){

        return res.status(400).send({error: "Invalid parameters: no ID specified."});
    }

    return sDeleteGame(id, res);
};