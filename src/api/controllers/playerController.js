import {getPlayers as sGetPlayers, createPlayer as sCreatePlayer, updatePlayer as sUpdatePlayer, deletePlayer as sDeletePlayer} from "../services/playerService";


export async function getPlayers(req, res) {

    return sGetPlayers(req, res);

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