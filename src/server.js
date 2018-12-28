import bodyParser from "body-parser";
import express from "express";
import routes from "./api/routes/routes";
import path from "path";
import config from "../config.json";
const app = express();
const port = 8080;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, '../public')))

routes(app); //register the route

app.listen(port);

const env = process.env.NODE_ENV;

global.config = config[env];

console.log("Started on port: " + port + " - env: " + env);

app.use(function(req, res) {
    res.status(404).send({url: req.originalUrl + ' not found'})
});

