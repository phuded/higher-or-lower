import {getPlayers as sGetPlayers, getPlayer as sGetPlayer, createPlayer as sCreatePlayer, updatePlayer as sUpdatePlayer, deletePlayer as sDeletePlayer} from "../services/playerService";

export async function getPlayers(req, res) {

    return sGetPlayers(req, res);

};

export async function getPlayer(req, res) {

    const name = req.params.name;

    if(!name){

        return new res.status(400).send({error: "Invalid parameters: no name specified."});
    }

    return sGetPlayer(name, res);

};

export async function createPlayer(req, res) {

    return sCreatePlayer(req, res);
};

export async function updatePlayer(req, res) {

    return sUpdatePlayer(req, res);
};

export async function deletePlayer(req, res) {

    return sDeletePlayer(req, res);
};