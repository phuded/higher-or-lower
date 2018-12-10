import {MongoClient} from "mongodb";

function mongoConfig(){

    return { url: global.config.url,
             dbString: global.config.dbString,
             collectionString: global.config.collectionString
    };
}


export function createPlayer(req, res) {

    const newPlayer = req.body;

    MongoClient.connect(mongoConfig().url, { useNewUrlParser: true }, function (err, client) {

        if (err) {

            client.close();

            console.log("Cannot connect to the DB: " + err);

            return res.status(500).send({error: "Cannot connect to the DB: " + err});

        }

        const collection = client.db(mongoConfig().dbString).collection(mongoConfig().collectionString);

        newPlayer.maxFingers = 0;
        newPlayer.maxCorrect = 0;
        newPlayer.maxIncorrect = 0;
        newPlayer.lastPlayed = new Date();

        collection.insertOne(newPlayer, function(err, result) {

            client.close();

            if (err) {

                return res.status(500).send({error: "Cannot create player: " + newPlayer.name + ": " + err});

            }

            return res.status(200).send(result.ops[0]);

        });


    });

};

export function updatePlayer(req, res) {

    const name = req.params.name;

    const playerUpdate = req.body;

    MongoClient.connect(mongoConfig().url, { useNewUrlParser: true }, function (err, client) {

        if (err) {

            client.close();

            console.log("Cannot connect to the DB: " + err);

            return res.status(500).send({error: "Cannot connect to the DB: " + err});

        }

        const collection = client.db(mongoConfig().dbString).collection(mongoConfig().collectionString);


        collection.findOne({name: name}, function(err, result) {

            if(!result || err){

                client.close();

                return res.status(404).send({error: "Cannot update player: " + name + ": Not found"});
            }

            const update = {};

            if(playerUpdate.maxCorrect > result.maxCorrect){

                update.maxCorrect = playerUpdate.maxCorrect;
            }

            if(playerUpdate.maxIncorrect > result.maxIncorrect){

                update.maxIncorrect = playerUpdate.maxIncorrect;
            }

            if(playerUpdate.maxFingers > result.maxFingers){

                update.maxFingers = playerUpdate.maxFingers;
            }

            if(Object.getOwnPropertyNames(update).length === 0){

                client.close();

                return res.status(200).send(result);
            }

            collection.findOneAndUpdate({name: name}, {$set: update}, { upsert: false, returnOriginal: false }, function(err, result) {

                client.close();

                if (err) {

                    return res.status(500).send({error: "Cannot update player: " + name + ": " + err});

                }

                return res.status(200).send(result.value);
            });

        });

    });

};


export function deletePlayer(req, res) {

    const name = req.params.name;

    MongoClient.connect(mongoConfig().url, { useNewUrlParser: true }, function (err, client) {

        if (err) {

            client.close();

            console.log("Cannot connect to the DB: " + err);

            return res.status(500).send({error: "Cannot connect to the DB: " + err});

        }

        const collection = client.db(mongoConfig().dbString).collection(mongoConfig().collectionString);

        collection.findOneAndDelete({name: name}, function(err, result) {

            client.close();

            if (err) {

                return res.status(500).send({error: "Cannot delete player: " + name + ": " + err});

            }

            if(!result.value){

                return res.status(404).send({error: "Cannot delete player: " + name + ": Not found"});
            }

            return res.status(200).send();
        });

    });

}
