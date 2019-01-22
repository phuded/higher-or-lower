import atob from "atob";
import Player from "../models/player";

export async function getPlayers(req, res) {

    const orderBy = req.query["order-by"] ? req.query["order-by"] : "name";

    var dir = req.query.dir ? req.query.dir : "asc";
    (dir == "asc")? dir = 1 : dir = -1;

    const sort = {[orderBy]: dir};

    const start = req.query.start ? parseInt(req.query.start) : 0;
    const num = req.query.num ? parseInt(req.query.num) : 1000;

    const countPromise = Player.countDocuments({});

    const playersPromise = Player.find({}).sort(sort).skip(start).limit(num);

    const data = await Promise.all([playersPromise, countPromise]);

    return res.send({players: data[0], total: data[1]});
}


export async function createPlayer(req, res) {

    const newPlayer = req.body;

    let result;

    try {
        result = await Player.create(newPlayer);
    }
    catch (e) {

        return res.status(500).send({error: e.errmsg});
    }

    return res.send(result);
};

export async function updatePlayer(req, res) {

    const name = req.params.name;

    // Security Hack
    var hol = req.headers.hol;

    if(!hol){

        return res.status(500).send({error: "Invalid request."});
    }

    hol = atob(hol).split("-");

    if(hol[0] != name){

        return res.status(500).send({error: "Invalid request."});
    }

    if(hol[1] != "hol"){

        return res.status(500).send({error: "Invalid request."});
    }

    const clientTimeStamp = hol[2];

    const currrentTimeStamp = new Date().getTime();

    const diff = Math.abs(currrentTimeStamp - clientTimeStamp);

    if(diff > 300000){

        return res.status(500).send({error: "Invalid request."});
    }

    const playerUpdate = req.body;

    playerUpdate.maxCorrect = parseInt(playerUpdate.maxCorrect);
    playerUpdate.maxIncorrect = parseInt(playerUpdate.maxIncorrect);
    playerUpdate.maxFingers = parseInt(playerUpdate.maxFingers);

    let foundPlayer;

    try {

        foundPlayer = await Player.findOne({name: name});
    }
    catch (e) {

        return res.status(404).send({error: "Cannot update player: " + name + ": Not found"});
    }

    if(playerUpdate.maxCorrect > foundPlayer.maxCorrect){

        foundPlayer.maxCorrect = playerUpdate.maxCorrect;
    }

    if(playerUpdate.maxIncorrect > foundPlayer.maxIncorrect){

        foundPlayer.maxIncorrect = playerUpdate.maxIncorrect;
    }

    if(playerUpdate.maxFingers > foundPlayer.maxFingers){

        foundPlayer.maxFingers = playerUpdate.maxFingers;
    }

    foundPlayer.lastPlayed = new Date();

    await foundPlayer.save();

    return res.send(foundPlayer);
};


export async function deletePlayer(req, res) {

    const name = req.params.name;

    const result = await Player.deleteOne({name: name});

    if(result.deletedCount == 0){

        return res.status(500).send();
    }

    return res.send();
};
