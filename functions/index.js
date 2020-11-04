const functions = require("firebase-functions");

const express = require("express");
const app = express();

const FBAuth = require("./util/fbAuth");

const { getAllScreams, postOneScreams } = require("./handle/screams");
const { signup, login, uploadImage } = require("./handle/users");

// screams route
// get info screams
app.get("/get-info", getAllScreams);
// create info screams
app.post("/create-info", FBAuth, postOneScreams);
// user route for sign up
app.post("/signup", signup);
// user route for login
app.post("/login", login);

app.post("/user/image", FBAuth, uploadImage);

exports.api = functions.https.onRequest(app);
