import bodyParser from "body-parser";
import express from "express";
import routes from "./api/routes/routes";
import path from "path";
import db from "./db";
const app = express();
const port = 8080;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, '../public')))

routes(app); //register the route

app.listen(port);

console.log("Started on port: " + port);

app.use(function(req, res) {
    res.status(404).send({url: req.originalUrl + ' not found'})
});

