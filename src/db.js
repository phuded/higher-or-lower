import mongoose from "mongoose";
import config from "../config.json";

let env = process.env.NODE_ENV;

if(!env){

    env = "production";
}

console.log("Env: " + env);

global.config = config[env];

mongoose.connect(global.config.url + "/" + global.config.dbString, {useNewUrlParser: true, useCreateIndex: true});

mongoose.connection.once('open', function() {

  console.log('Successfully connected to mongodb');

});
