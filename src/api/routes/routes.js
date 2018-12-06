import {getPlayers, updatePlayer, createPlayer, deletePlayer} from "../controllers/playerController";

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
};
