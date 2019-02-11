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

app.use("/:gameId", express.static(path.join(__dirname, '../public')));
app.use("/:gameId/:playerName", express.static(path.join(__dirname, '../public')));

// Generic 404 response for invalid URLs
app.use(function(req, res) {
    res.status(404).send({url: req.originalUrl + ' not found'})
});

// WS Clients
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

// Create the Web Socket server
const wsServer = new WebSocketServer.server({
    httpServer: server
});

// WebSocket server
wsServer.on('request', function(request) {

    const clients = global.clients;

    const path = request.resourceURL.path.substr(1).split("/");

    const gameId = path[1];
    const playerName = path[2];

    const connection = request.accept(null, request.origin);

    if(!clients[gameId]){

        clients[gameId] = {};
    }

    clients[gameId][playerName] = connection;

    console.log("Added WS client for game:" + gameId +  " - " + playerName);

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

        if(!clients[gameId] || !clients[gameId][playerName]) {

            return;
        }

        // close user connection
        delete clients[gameId][playerName];

        console.log("Removed WS client for game:" + gameId +  " - " + playerName);

        if (Object.keys(clients[gameId]).length == 0) {

            // Delete the WS map
            delete clients[gameId];

            console.log("Removed all WS client for game:" + gameId);
        }

    });
});


