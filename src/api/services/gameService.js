import {MongoClient, ObjectId} from "mongodb";
import {Game, playTurn, checkIfPlayerInGame} from "../models/game";
import GamePlayer from "../models/gamePlayer";

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

            collection.find({}, {projection: {cards: 0}}).sort(sort).skip(start).limit(num).toArray(function(err, results) {

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

        const game = new Game(gameBody.name, gameBody.owner, gameBody.players, gameBody.drinkType, (gameBody.remove == "true"), (gameBody.wholePack == "true"), (gameBody.betAnyCard == "true"));

        collection.insertOne(game, function(err, result) {

            client.close();

            if (err) {

                return res.status(500).send({error: "Cannot create new game: " + game + ": " + err});

            }

            return res.status(200).send(result.ops[0]);

        });


    });

};

export function updateGame(id, playerName, guess, bet, res) {

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

            const currentPlayer = game.currentPlayer.name;

            if(currentPlayer != playerName){

                client.close();

                return res.status(400).send({error: "Cannot update game: " + id + ": Invalid current player: " + playerName});
            }

            // Make changes
            const gameUpdated = playTurn(game, guess, bet);

            if(!gameUpdated){

                client.close();

                return res.status(400).send({error: "Cannot update game: " + id + ": Game has finished."});

            }

            collection.findOneAndUpdate({_id: new ObjectId(id)}, {$set: game}, { upsert: false, returnOriginal: false }, function(err, result) {

                client.close();

                if (err) {

                    return res.status(500).send({error: "Cannot update game: " + id + ": " + err});

                }

                const response = result.value;

                delete response.cards;

                return res.status(200).send(response);
            });

        });


    });

};



export function updateGamePlayers(id, newPlayers, res) {

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

            let gameUpdated = false;

            newPlayers.forEach(function (newPlayer) {

                const inGame = checkIfPlayerInGame(game, newPlayer);

                if(!inGame){

                    gameUpdated = true;

                    game.players.push(new GamePlayer(newPlayer))
                }
            });

            if(!gameUpdated){

                client.close();

                return res.status(200).send(game);
            }

            collection.findOneAndUpdate({_id: new ObjectId(id)}, {$set: game}, { upsert: false, returnOriginal: false }, function(err, result) {

                client.close();

                if (err) {

                    return res.status(500).send({error: "Cannot update game: " + id + ": " + err});

                }

                const response = result.value;

                delete response.cards;

                return res.status(200).send(response);
            });

        });


    });

};

export function deleteGame(id, res) {

     MongoClient.connect(mongoConfig().url, param, function (err, client) {

         if (err) {

             console.log("Cannot connect to the DB: " + err);

             return res.status(500).send({error: "Cannot connect to the DB: " + err});

         }

         const collection = client.db(mongoConfig().dbString).collection(mongoConfig().collectionString);

         collection.findOneAndDelete({_id: new ObjectId(id)}, function(err, result) {

             client.close();

             if (err) {

                 return res.status(500).send({error: "Cannot delete game: " + id + ": " + err});

             }

             if(!result.value){

                 return res.status(404).send({error: "Cannot delete game: " + id + ": Not found"});
             }

             return res.status(200).send();
         });

     });

 };
