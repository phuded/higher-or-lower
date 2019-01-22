import bodyParser from "body-parser";
import express from "express";
import routes from "./api/routes/routes";
import path from "path";
import config from "../config.json";
import mongoose from "mongoose";
import http from "http";
import WebSocketServer from "websocket";

import "@babel/polyfill";

const app = express();
const port = 8080;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, '../public')))

//register the route
routes(app);

global.clients = {};

const server = http.createServer();

// Also mount the app here
server.on('request', app);

let env = process.env.NODE_ENV;

if(!env){

    env = "production";
}

console.log("Env: " + env);

global.config = config[env];

mongoose.connect(global.config.url + "/" + global.config.dbString, {useNewUrlParser: true, useCreateIndex: true});

mongoose.connection.once('open', function() {

    console.log('Successfully connected to mongodb');

    server.listen(port);

    console.log("Started on port: " + port);
});

app.use(function(req, res) {
    res.status(404).send({url: req.originalUrl + ' not found'})
});

// create the Web Socket server
const wsServer = new WebSocketServer.server({
    httpServer: server
});

// WebSocket server
wsServer.on('request', function(request) {

    const clients = global.clients;

    const gameId = request.resourceURL.path.substr(1);

    const connection = request.accept(null, request.origin);

    let index = 0;

    if(!clients[gameId]){

        clients[gameId] = [connection];
    }
    else{
        index = clients[gameId].push(connection) - 1;
    }

    console.log("Added WS client:" + gameId +  " " + index);

    // // This is the most important callback for us, we'll handle
    // // all messages from users here.
    // connection.on('message', function(message) {
    //
    //     console.log(message);
    //
    //     for (var i = 0; i < clients.length; i++) {
    //         clients[i].sendUTF(message);
    //     }
    //
    //     if (message.type === 'utf8') {
    //         // process WebSocket message
    //     }
    // });

    connection.on('close', function(connection) {

        // close user connection
        clients[gameId].splice(index, 1);

    });
});


