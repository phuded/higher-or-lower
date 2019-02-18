import {getPlayer, getPlayers, createPlayer, deletePlayer} from "../controllers/playerController";
import {getGame, getGames, createGame, updateGame, deleteGame, updateGamePlayers} from "../controllers/gameController";

export default function routes(app) {

    const root = "";

    /**
     * Returns ok as health response
     */
    app.get("/management/health", function (req, res) {
        res.send('Ok');
    });

    app.route(root + "/api/players/:name").get(getPlayer);

    app.route(root + "/api/players").get(getPlayers);

    app.route(root + "/api/players").post(createPlayer);

    app.route(root + "/api/players/:name").delete(deletePlayer);


    // Game

    app.route(root + "/api/games/:id").get(getGame);

    app.route(root + "/api/games").get(getGames);

    app.route(root + "/api/games").post(createGame);

    app.route(root + "/api/games/:id").put(updateGame);

    app.route(root + "/api/games/:id").delete(deleteGame);

    app.route(root + "/api/games/:id/players").put(updateGamePlayers);
};
