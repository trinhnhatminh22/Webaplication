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
  getUserDetails,
  markNotificationRead,
} = require("./handle/users");
const { db } = require("./util/admin");
const { database } = require("firebase-admin");

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
//get user details
app.get("/users:handle", getUserDetails);
// mark notification
app.post("/notifications", FBAuth, markNotificationRead);

exports.api = functions.https.onRequest(app);

exports.createNotification = functions.firestore
  .document("likes/{id}")
  .onCreate((snapshot) => {
    return db
      .doc(`/screams/${snapshot.data().screamId}`)
      .get()
      .then((doc) => {
        if (doc.exists && doc.data().handle !== snapshot.data().handle) {
          return db.doc(`/notifications/${snapshot.id}`).set({
            createAt: new Date().toISOString,
            recipient: doc.data().handle,
            sender: snapshot.data().handle,
            type: "like",
            read: false,
            screamId: doc.id,
          });
        }
      })
      .catch((err) => {
        console.error(err);
      });
  });

exports.deleteNotificationOnUnlike = functions.firestore
  .document("likes/{id}")
  .onDelete((snapshot) => {
    return db
      .doc(`/notifications/${snapshot.id}`)
      .delete()
      .catch((err) => {
        console.log(err);
      });
  });

exports.createNotificationOnComment = functions.firestore
  .document("comments/{id}")
  .onCreate((snapshot) => {
    return db
      .doc(`/screams/${snapshot.data().screamId}`)
      .get()
      .then((doc) => {
        if (doc.exists && doc.data().handle !== snapshot.data().handle) {
          return db.doc(`/notifications/${snapshot.id}`).set({
            createAt: new Date().toISOString,
            recipient: doc.data().handle,
            sender: snapshot.data().handle,
            type: "comment",
            read: false,
            screamId: doc.id,
          });
        }
      })
      .catch((err) => {
        console.error(err);
      });
  });

// this trigger call when user change their imageurl
// => so the imageUrl from comment and screams will change to
exports.onUserImageChange = functions.firestore
  .document("users/{userId")
  .onUpdate((change) => {
    console.log("before", change.before.data());
    console.log("after", change.after.data());
    if (change.before.data().imageUrl !== change.after.data().imageUrl) {
      console.log("image has been change");
      let batch = db.batch();
      return db
        .collection("screams")
        .where("handle", "==", change.before.data().handle)
        .get()
        .then((data) => {
          data.forEach((doc) => {
            const scream = db.doc(`/screams/${doc.id}`);
            batch.update(scream, { userImage: change.after.data().imageUrl });
          });
          return batch.commit();
        });
    }
  });

exports.onScreamDelete = functions.firestore
  .document("/screams/{screamId}")
  .onDelete((snapshot, context) => {
    const screamId = context.params.screamId;
    const batch = db.batch();
    return db
      .collection("commnets")
      .where("screamId", "==", screamId)
      .get()
      .then((data) => {
        data.forEach((doc) => {
          batch.delete(db.doc(`/comments/${doc.id}`));
        });
        return db.collection(`likes`).where("screamId", "==", screamId).get();
      })
      .then((data) => {
        data.forEach((doc) => {
          batch.delete(db.doc(`/likes/${doc.id}`));
        });
        return db
          .collection(`notifications`)
          .where("screamId", "==", screamId)
          .get();
      })
      .then((data) => {
        data.forEach((doc) => {
          batch.delete(db.doc(`/notifications/${doc.id}`));
        });
        return batch.commit();
      })
      .catch((err) => {
        console.log(err);
      });
  });
