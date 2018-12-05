import bodyParser from "body-parser";
import express from "express";
import routes from "./api/routes/routes";
import path from "path";

var app = express();
const port = 8080;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const staticFiles = express.static(path.join(__dirname, "../build"));

const root = "/higherorlower";

app.use(root, staticFiles);
// app.use(root + "/udo-panel", staticFiles);
// app.use(root + "/workorder-panel", staticFiles);
//
// app.use(root + "/greenlight-wizard", staticFiles);
// app.use(root + "/wizard", staticFiles);
// app.use(root + "/asset-wizard", staticFiles);
//
// app.use(root + "/resource-panel", staticFiles);

routes(app); //register the route

app.listen(port);

console.log("Started on port: " + port);

app.use(function(req, res) {
    res.status(404).send({url: req.originalUrl + ' not found'})
});
