import {getPlayers, updatePlayer, createPlayer, deletePlayer} from "../controllers/playerController";
import {getGame, getGames, createGame, updateGame} from "../controllers/gameController";

export default function routes(app) {

    const root = "";

    /**
     * Returns ok as health response
     */
    app.get("/management/health", function (req, res) {
        res.send('Ok');
    });

    app.route(root + "/api/players").get(getPlayers);

    app.route(root + "/api/players/:name").put(updatePlayer);

    app.route(root + "/api/players").post(createPlayer);

    app.route(root + "/api/players/:name").delete(deletePlayer);


    // Game

    app.route(root + "/api/games/:id").get(getGame);

    app.route(root + "/api/games").get(getGames);

    app.route(root + "/api/games").post(createGame);

    app.route(root + "/api/games/:id").put(updateGame);
};
