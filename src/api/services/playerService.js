import Player from "../models/player";

export async function getPlayers(req, res) {

    const orderBy = req.query["order-by"] ? req.query["order-by"] : "name";

    var dir = req.query.dir ? req.query.dir : "asc";
    (dir == "asc")? dir = 1 : dir = -1;

    const sort = {[orderBy]: dir};

    const start = req.query.start ? parseInt(req.query.start) : 0;
    const num = req.query.num ? parseInt(req.query.num) : 1000;

    const countPromise = Player.countDocuments({});

    const playersPromise = Player.find({}).sort(sort).collation({ locale: "en" }).skip(start).limit(num);

    const data = await Promise.all([playersPromise, countPromise]);

    return res.send({players: data[0], total: data[1]});
}

export async function getPlayer(name, res) {

    let player;

    try {
        player = await Player.findOne({name: name});
    }
    catch (e) {

        return res.status(500).send({error: e.message});
    }

    if(!player){

        return res.status(404).send();

    }

    return res.send(player);

};


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

export async function updatePlayer(playerName, maxCorrect, maxIncorrect, fingers) {

    let foundPlayer;

    try {

        foundPlayer = await Player.findOne({name: playerName});
    }
    catch (e) {

        return;
    }

    if(maxCorrect > foundPlayer.maxCorrect){

        foundPlayer.maxCorrect = maxCorrect;
    }

    if(maxIncorrect > foundPlayer.maxIncorrect){

        foundPlayer.maxIncorrect = maxIncorrect;
    }

    if(fingers > foundPlayer.maxFingers){

        foundPlayer.maxFingers = fingers;
    }

    foundPlayer.lastPlayed = new Date();

    foundPlayer = await foundPlayer.save();

    return foundPlayer;
};


export async function deletePlayer(req, res) {

    const name = req.params.name;

    const result = await Player.deleteOne({name: name});

    if(result.deletedCount == 0){

        return res.status(500).send();
    }

    return res.send();
};
