import {getPlayers as sGetPlayers, createPlayer as sCreatePlayer, updatePlayer as sUpdatePlayer, deletePlayer as sDeletePlayer} from "../services/playerService";

export function getPlayers(req, res) {

    return sGetPlayers(req, res);

};

export function createPlayer(req, res) {

    return sCreatePlayer(req, res);
};

export function updatePlayer(req, res) {

    return sUpdatePlayer(req, res);
};

export function deletePlayer(req, res) {

    return sDeletePlayer(req, res);
};