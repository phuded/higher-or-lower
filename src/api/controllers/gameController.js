import {getGames as sGetGames, getGame as sGetGame, createGame as sCreateGame} from "../services/gameService";

export function getGame(req, res) {

    const id = req.params.id;

    if(!id){

        return new res.status(400).send({error: "Invalid parameters"});
    }

    return sGetGame(id, res);

};

export function getGames(req, res) {

    return sGetGames(req, res);

};

export function createGame(req, res) {

    let gameBody = req.body;

    if(!gameBody.players || !gameBody.drinkType || !gameBody.remove){

        return new res.status(400).send({error: "Invalid parameters"});
    }

    return sCreateGame(gameBody, res);

};

export function updateGame(req, res) {

    let turnBody = req.body;

    if(!turnBody.guess || !turnBody.bet){

        return new res.status(400).send({error: "Invalid parameters"});
    }

    const turnRes = game.playTurn(turnBody.guess, turnBody.bet);

    return res.status(200).send(turnRes);
};

// export function deletePlayer(req, res) {
//
//     return sDeletePlayer(req, res);
// };