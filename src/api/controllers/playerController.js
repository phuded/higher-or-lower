import mysql from "mysql";

function getConnection(){

    return mysql.createConnection({
        host: "localhost",
        user: "higherorlower",
        password: "Thorndon32!",
        database: "higherorlower"
    });
}

function getPlayer(name){

    return "SELECT * FROM player where name = '" + name + "' LIMIT 1";
}

export function getPlayers(req, res) {

    const con = getConnection();

    con.connect(function(err) {

        if (err) {
            throw err;
        }

        const sql = "SELECT * FROM player";

        con.query(sql, function (err, result) {

            if (err) {
                throw err;
            }

            res.status(200).send(result);
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
            throw err;
        }

        let createSql = "INSERT INTO player (name, fname, surname, max_correct, max_incorrect, max_finger, last_played)";

        createSql += " VALUES ('" + name + "', '" + firstName + "', '" + surname + "', 0, 0, 0, UTC_TIMESTAMP())";

        //console.log(createSql);

        con.query(createSql, function (err, result) {

            if (err) {
                throw err;
            }

            con.query(getPlayer(name), function (err, players) {

                res.status(200).send(players[0]);
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
            throw err;
        }

        con.query(getPlayer(name), function (err, players) {

            if (err) {
                throw err;
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

                updateSql += " max_fingers = " + maxFinger + ",";
            }

            updateSql += " last_played = UTC_TIMESTAMP()";

            updateSql += " WHERE name = '" + name + "'";

            //console.log(updateSql);

            con.query(updateSql, function (err, result) {

                if (err) {
                    throw err;
                }

                con.query(getPlayer(name), function (err, players) {

                    res.status(200).send(players[0]);
                });
            });


        });

    });

};