import mysql from "mysql";

function getConnection(){

    return  mysql.createConnection({
                host: global.config.host,
                user: global.config.user,
                password: global.config.password,
                database: global.config.database
            });
}

function getPlayer(name){

    return "SELECT * FROM player where name = '" + name + "' LIMIT 1";
}

export function getPlayers(req, res) {

    const con = getConnection();

    const orderBy = req.query["order-by"] ? req.query["order-by"] : "name";
    const dir = req.query.dir ? req.query.dir : "asc";
    const start = req.query.start ? req.query.start : 0;
    const num = req.query.num ? req.query.num : 1000;

    con.connect(function(err) {

        if (err) {

            con.end();

            console.log("Cannot connect to the DB: " + err);

            return res.status(500).send({error: "Cannot connect to the DB: " + err});

        }

        const countSql = "SELECT count(*) FROM player";

        con.query(countSql, function (err, countResult) {

            if (err) {

                con.end();

                return res.status(500).send({error: "Cannot execute count query: " + err});
            }

            const sql = "SELECT * FROM player order by " + orderBy + " " + dir + " limit " + start + ", " + num;

            //console.log(sql);

            con.query(sql, function (err, players) {

                if (err) {
                    throw err;
                }

                const response = {total: countResult[0]["count(*)"], players: players};

                con.end();

                return res.status(200).send(response);

            });
        });

    });

};

export function createPlayer(req, res) {

    const con = getConnection();

    const body = req.body;

    const name = body.name;
    const firstName = body["first-name"];
    const surname = body["surname"];

    con.connect(function(err) {

        if (err) {

            con.end();

            console.log("Cannot connect to the DB: " + err);

            return res.status(500).send({error: "Cannot connect to the DB: " + err});

        }

        let createSql = "INSERT INTO player (name, fname, surname, max_correct, max_incorrect, max_finger, last_played)";

        createSql += " VALUES ('" + name + "', '" + firstName + "', '" + surname + "', 0, 0, 0, UTC_TIMESTAMP())";

        //console.log(createSql);

        con.query(createSql, function (err, result) {

            if (err) {

                con.end();

                return res.status(500).send({error: "Cannot create player: " + name + ": " + err});

            }

            con.query(getPlayer(name), function (err, players) {

                con.end();

                return res.status(200).send(players[0]);

            });
        });

    });

};

export function updatePlayer(req, res) {

    const name = req.params.name;

    const con = getConnection();

    const body = req.body;

    const maxCorrect = body["max-correct"];
    const maxIncorrect = body["max-incorrect"];
    const maxFinger = body["max-finger"];

    con.connect(function(err) {

        if (err) {

            con.end();

            console.log("Cannot connect to the DB: " + err);

            return res.status(500).send({error: "Cannot connect to the DB: " + err});
        }

        con.query(getPlayer(name), function (err, players) {

            if (err) {

                con.end();

                return res.status(500).send({error: "Cannot get player: " + name});

            }

            if(!players || players.length == 0){

                con.end();

                return res.status(404).send({error: "No player found: " + name});

            }

            const player = players[0];

            const currentMaxCorrect = player["max_correct"];
            const currentMaxIncorrect = player["max_incorrect"];
            const currentMaxFinger = player["max_finger"];

            let updateSql = "UPDATE player SET";

            if(maxCorrect > currentMaxCorrect){

                updateSql += " max_correct = " + maxCorrect + ",";
            }

            if(maxIncorrect > currentMaxIncorrect){

                updateSql += " max_incorrect = " + maxIncorrect + ",";
            }

            if(maxFinger > currentMaxFinger){

                updateSql += " max_finger = " + maxFinger + ",";
            }

            updateSql += " last_played = UTC_TIMESTAMP()";

            updateSql += " WHERE name = '" + name + "'";

            //console.log(updateSql);

            con.query(updateSql, function (err, result) {

                if (err) {

                    con.end();

                    return res.status(500).send({error: "Cannot update player: " + name + ": " + err});

                }

                con.query(getPlayer(name), function (err, players) {

                    con.end();

                    return res.status(200).send(players[0]);

                });
            });


        });

    });

};

export function deletePlayer(req, res) {

    const name = req.params.name;

    const con = getConnection();

    con.connect(function(err) {

        if (err) {

            con.end();

            console.log("Cannot connect to the DB: " + err);

            return res.status(500).send({error: "Cannot connect to the DB: " + err});

        }

        const delSql = "DELETE FROM player where name = '" + name + "' LIMIT 1";

        con.query(delSql, function (err, countResult) {

            if (err) {

                con.end();

                return res.status(500).send({error: "Cannot delete player: " + err});
            }

            con.end();

            return res.status(200).send(countResult);


        });

    });

}