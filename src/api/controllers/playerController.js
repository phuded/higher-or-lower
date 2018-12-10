import {getPlayers as sGetPlayers, createPlayer as sCreatePlayer, updatePlayer as sUpdatePlayer, deletePlayer as sDeletePlayer} from "../services/playerService";
import {createPlayer as mCreatePlayer, updatePlayer as mUpdatePlayer} from "../services/playerServiceMongo";

export function getPlayers(req, res) {

    return sGetPlayers(req, res);

};

export function createPlayer(req, res) {

    return mCreatePlayer(req, res);//sCreatePlayer(req, res);
};

export function updatePlayer(req, res) {

    return mUpdatePlayer(req, res);
};

export function deletePlayer(req, res) {

    return sDeletePlayer(req, res);
};