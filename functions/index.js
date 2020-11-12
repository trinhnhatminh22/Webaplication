const functions = require("firebase-functions");

const express = require("express");
const app = express();

const FBAuth = require("./util/fbAuth");

const { getAllScreams, postOneScreams, getScream, commentOnScreen } = require("./handle/screams");
const { signup, login, uploadImage, addUserDetails, getAuthenticatedUser } = require("./handle/users");

// screams route
// get info screams
app.get("/scream", getAllScreams);
// create info screams
app.post("/scream", FBAuth, postOneScreams);
//
app.get('/scream/:screamId', getScream);
// delete scream
// like a scream
// unlike a scream
// comment on scream
app.post('/scream/:screamId/comment',FBAuth, commentOnScreen);




// user route for sign up
app.post("/signup", signup);
// user route for login
app.post("/login", login);
// get user data
app.get("/user", FBAuth, getAuthenticatedUser);

app.post("/user/image", FBAuth, uploadImage);
app.post('/user', FBAuth, addUserDetails);

exports.api = functions.https.onRequest(app);
