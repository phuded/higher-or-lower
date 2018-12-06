import bodyParser from "body-parser";
import express from "express";
import routes from "./api/routes/routes";
import path from "path";
import config from "../config.json";
const app = express();
const port = 8080;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const root = "/higherorlower";

app.use(root, express.static(path.join(__dirname, '../public')))

routes(app); //register the route

app.listen(port);

global.config = config;

console.log("Started on port: " + port);

app.use(function(req, res) {
    res.status(404).send({url: req.originalUrl + ' not found'})
});
