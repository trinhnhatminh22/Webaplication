const functions = require("firebase-functions");

const express = require("express");
const app = express();

const FBAuth = require("./util/fbAuth");

const {
  getAllScreams,
  postOneScreams,
  getScream,
  commentOnScream,
  likeScream,
  unLikeScream,
  deleteScream,
} = require("./handle/screams");
const {
  signup,
  login,
  uploadImage,
  addUserDetails,
  getAuthenticatedUser,
} = require("./handle/users");

// screams route
// get info screams
app.get("/scream", getAllScreams);
// create info screams
app.post("/scream", FBAuth, postOneScreams);
// route get all scream
app.get("/scream/:screamId", getScream);
// delete scream
app.delete("/scream/:screamId", FBAuth, deleteScream);
// like a scream
app.get("/scream/:screamId/like", FBAuth, likeScream);
// unlike a scream
app.get("/scream/:screamId/unlike", FBAuth, unLikeScream);
// comment on screen
app.post("/scream/:screamId/comment", FBAuth, commentOnScream);

// user route for sign up
app.post("/signup", signup);
// user route for login
app.post("/login", login);
// get user data
app.get("/user", FBAuth, getAuthenticatedUser);
// route upload image
app.post("/user/image", FBAuth, uploadImage);
// route add user details
app.post("/user", FBAuth, addUserDetails);

exports.api = functions.https.onRequest(app);

exports.createNotification = functions.https.onRequest((req,res)=> {
    
})
