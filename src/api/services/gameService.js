import {MongoClient, ObjectId} from "mongodb";
import {Game, playTurn} from "../models/game";

function mongoConfig(){

    return { url: global.config.url,
             dbString: global.config.dbString,
             collectionString: global.config.gameCollectionString
    };
}

const param = { useNewUrlParser: true };


export function getGames(req, res) {

    const orderBy = req.query["order-by"] ? req.query["order-by"] : "name";

    var dir = req.query.dir ? req.query.dir : "asc";
    (dir == "asc")? dir = 1 : dir = -1;

    const sort = {[orderBy]: dir};

    const start = req.query.start ? parseInt(req.query.start) : 0;
    const num = req.query.num ? parseInt(req.query.num) : 1000;

    MongoClient.connect(mongoConfig().url, param, function (err, client) {

        if (err) {

            console.log("Cannot connect to the DB: " + err);

            return res.status(500).send({error: "Cannot connect to the DB: " + err});

        }

        const collection = client.db(mongoConfig().dbString).collection(mongoConfig().collectionString);

        collection.countDocuments({}, function(err, numGames) {

            if (err) {

                client.close();

                return res.status(500).send({error: "Cannot execute count query: " + err});
            }

            collection.find({}, {fields: {cards: 0}}).sort(sort).skip(start).limit(num).toArray(function(err, results) {

                client.close();

                if (err) {

                    return res.status(500).send({error: "Cannot find games: " + err});

                }

                const response = {total: numGames, games: results};

                return res.status(200).send(response);
            });

        });

    });
};

export function getGame(id, res) {

    MongoClient.connect(mongoConfig().url, param, function (err, client) {

        if (err) {

            console.log("Cannot connect to the DB: " + err);

            return res.status(500).send({error: "Cannot connect to the DB: " + err});

        }

        const collection = client.db(mongoConfig().dbString).collection(mongoConfig().collectionString);

        collection.findOne({_id: new ObjectId(id)}, {projection: {cards: 0}}, function(err, result) {

            client.close();

            if (err || !result) {

                return res.status(404).send({error: "Cannot find game with ID: " + id + ": " + err});

            }

            return res.status(200).send(result);

        });


    });

};


export function createGame(gameBody, res) {

    MongoClient.connect(mongoConfig().url, param, function (err, client) {

        if (err) {

            console.log("Cannot connect to the DB: " + err);

            return res.status(500).send({error: "Cannot connect to the DB: " + err});

        }

        const collection = client.db(mongoConfig().dbString).collection(mongoConfig().collectionString);

        const game = new Game(gameBody.players, gameBody.drinkType, gameBody.remove);

        collection.insertOne(game, function(err, result) {

            client.close();

            if (err) {

                return res.status(500).send({error: "Cannot create new game: " + game + ": " + err});

            }

            return res.status(200).send(result.ops[0]);

        });


    });

};

export function updateGame(id, guess, bet, res) {

    MongoClient.connect(mongoConfig().url, param, function (err, client) {

        if (err) {

            console.log("Cannot connect to the DB: " + err);

            return res.status(500).send({error: "Cannot connect to the DB: " + err});

        }

        const collection = client.db(mongoConfig().dbString).collection(mongoConfig().collectionString);

        collection.findOne({_id: new ObjectId(id)}, function(err, game) {

            if (err) {

                return res.status(404).send({error: "Cannot find game with ID: " + id + ": " + err});

            }

            const response = playTurn(game, guess, bet);

            collection.findOneAndUpdate({_id: new ObjectId(id)}, {$set: game}, { upsert: false, returnOriginal: false }, function(err, result) {

                client.close();

                if (err) {

                    return res.status(500).send({error: "Cannot update game: " + id + ": " + err});

                }

                return res.status(200).send(response);
            });

        });


    });

};


//
// export function updatePlayer(req, res) {
//
//     const name = req.params.name;
//
//     // Security Hack
//     var hol = req.headers.hol;
//
//     if(!hol){
//
//         return res.status(500).send({error: "Invalid request."});
//     }
//
//     hol = atob(hol).split("-");
//
//     if(hol[0] != name){
//
//         return res.status(500).send({error: "Invalid request."});
//     }
//
//     if(hol[1] != "hol"){
//
//         return res.status(500).send({error: "Invalid request."});
//     }
//
//     const clientTimeStamp = hol[2];
//
//     const currrentTimeStamp = new Date().getTime();
//
//     if((currrentTimeStamp - clientTimeStamp) > 1000){
//
//         return res.status(500).send({error: "Invalid request."});
//     }
//
//     const playerUpdate = req.body;
//
//     playerUpdate.maxCorrect = parseInt(playerUpdate.maxCorrect);
//     playerUpdate.maxIncorrect = parseInt(playerUpdate.maxIncorrect);
//     playerUpdate.maxFingers = parseInt(playerUpdate.maxFingers);
//
//     MongoClient.connect(mongoConfig().url, param, function (err, client) {
//
//         if (err) {
//
//             console.log("Cannot connect to the DB: " + err);
//
//             return res.status(500).send({error: "Cannot connect to the DB: " + err});
//
//         }
//
//         const collection = client.db(mongoConfig().dbString).collection(mongoConfig().collectionString);
//
//
//         collection.findOne({name: name}, function(err, result) {
//
//             if(!result || err){
//
//                 client.close();
//
//                 return res.status(404).send({error: "Cannot update player: " + name + ": Not found"});
//             }
//
//             const update = {};
//
//             if(playerUpdate.maxCorrect > result.maxCorrect){
//
//                 update.maxCorrect = playerUpdate.maxCorrect;
//             }
//
//             if(playerUpdate.maxIncorrect > result.maxIncorrect){
//
//                 update.maxIncorrect = playerUpdate.maxIncorrect;
//             }
//
//             if(playerUpdate.maxFingers > result.maxFingers){
//
//                 update.maxFingers = playerUpdate.maxFingers;
//             }
//
//             update.lastPlayed = new Date();
//
//             // if(Object.getOwnPropertyNames(update).length === 0){
//             //
//             //     client.close();
//             //
//             //     return res.status(200).send(result);
//             // }
//
//             collection.findOneAndUpdate({name: name}, {$set: update}, { upsert: false, returnOriginal: false }, function(err, result) {
//
//                 client.close();
//
//                 if (err) {
//
//                     return res.status(500).send({error: "Cannot update player: " + name + ": " + err});
//
//                 }
//
//                 return res.status(200).send(result.value);
//             });
//
//         });
//
//     });
//
// };
//
//
// export function deletePlayer(req, res) {
//
//     const name = req.params.name;
//
//     MongoClient.connect(mongoConfig().url, param, function (err, client) {
//
//         if (err) {
//
//             console.log("Cannot connect to the DB: " + err);
//
//             return res.status(500).send({error: "Cannot connect to the DB: " + err});
//
//         }
//
//         const collection = client.db(mongoConfig().dbString).collection(mongoConfig().collectionString);
//
//         collection.findOneAndDelete({name: name}, function(err, result) {
//
//             client.close();
//
//             if (err) {
//
//                 return res.status(500).send({error: "Cannot delete player: " + name + ": " + err});
//
//             }
//
//             if(!result.value){
//
//                 return res.status(404).send({error: "Cannot delete player: " + name + ": Not found"});
//             }
//
//             return res.status(200).send();
//         });
//
//     });
//
// };
