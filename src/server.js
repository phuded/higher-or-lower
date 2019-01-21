import bodyParser from "body-parser";
import express from "express";
import routes from "./api/routes/routes";
import path from "path";
import config from "../config.json";
import mongoose from "mongoose";
import "@babel/polyfill";

const app = express();
const port = 8080;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, '../public')))

//register the route
routes(app);

let env = process.env.NODE_ENV;

if(!env){

    env = "production";
}

console.log("Env: " + env);

global.config = config[env];

mongoose.connect(global.config.url + "/" + global.config.dbString, {useNewUrlParser: true, useCreateIndex: true});

mongoose.connection.once('open', function() {

    console.log('Successfully connected to mongodb');

    app.listen(port);

    console.log("Started on port: " + port);

});

app.use(function(req, res) {
    res.status(404).send({url: req.originalUrl + ' not found'})
});

