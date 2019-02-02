import {getGames as sGetGames, getGame as sGetGame, createGame as sCreateGame, updateGame as sUpdateGame, updateGamePlayers as sUpdateGamePlayers, deleteGame as sDeleteGame} from "../services/gameService";

export async function getGame(req, res) {

    const id = req.params.id;

    if(!id){

        return new res.status(400).send({error: "Invalid parameters: no ID specified."});
    }

    return sGetGame(id, res);

};

export async function getGames(req, res) {

    return sGetGames(req, res);

};

export async function createGame(req, res) {

    let gameBody = req.body;

    if(!gameBody.name || !gameBody.owner || !gameBody.players || !gameBody.drinkType || (gameBody.playAsAnyone == null) || (gameBody.removeCards == null) || (gameBody.wholePack == null) || (gameBody.betAnyCard == null)){

        return res.status(400).send({error: "Invalid parameters"});
    }

    return sCreateGame(gameBody, res);

};

export async function updateGame(req, res) {

    const id = req.params.id;

    if(!id){

        return res.status(400).send({error: "Invalid parameters: no ID specified."});
    }

    let turnBody = req.body;

    if((turnBody.guess == null) || (turnBody.bet == null) || !turnBody.playerName || !turnBody.loggedInPlayerName){

        return res.status(400).send({error: "Invalid parameters"});
    }

    return sUpdateGame(id, turnBody.playerName, turnBody.loggedInPlayerName, (turnBody.guess == "true"), parseInt(turnBody.bet), res);
};

export async function updateGamePlayers(req, res) {

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


export async function deleteGame(req, res) {

    const id = req.params.id;

    if(!id){

        return res.status(400).send({error: "Invalid parameters: no ID specified."});
    }

    return sDeleteGame(id, res);
};