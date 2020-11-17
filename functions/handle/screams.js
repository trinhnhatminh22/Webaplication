const { db } = require("../util/admin");

exports.getAllScreams = (req, res) => {
  db.collection("screams")
    .get()
    .then((data) => {
      let userArr = [];
      data.forEach((doc) => {
        userArr.push({
          screamId: doc.id,
          handle: doc.data().handle,
          body: doc.data().body,
          createdAt: doc.data().createdAt,
          userImage: doc.data().userImage,
          likeCount: doc.data().likeCount,
          commentCount: doc.data().commentCount
        });
      });
      return res.json(userArr);
    })
    .catch((err) => console.log(err));
};

exports.postOneScreams = (req, res) => {
  if (req.body.body.trim() === "") {
    return res.status(400).json({ body: "Body must not be empty" });
  }

  const newInfo = {
    body: req.body.body,
    handle: req.user.handle,
    userImage: req.user.imageUrl,
    createdAt: new Date().toISOString(),
    likeCount: 0,
    commentCount: 0,
  };

  db.collection("screams")
    .add(newInfo)
    .then((doc) => {
      const resInfo = newInfo;
      resInfo.screamId = doc.id;
      res.json(resInfo);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: `something went wrong` });
    });
};

// get all scream
exports.getScream = (req, res) => {
  let screamData = {};

  db.doc(`/screams/${req.params.screamId}`)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(404).json({ error: "Scream not found" });
      }
      screamData = doc.data();
      screamData.screamId = doc.id;
      return db
        .collection("comments")
        .orderBy("createAt", "desc")
        .where("screamId", "==", req.params.screamId)
        .get()
        .then((data) => {
          screamData.comments = [];
          data.forEach((doc) => {
            screamData.comments.push(doc.data());
          });
          return res.json(screamData);
        })
        .catch((err) => {
          console.error(err);
          res.status(500).json({ error: err.code });
        });
    });
};

// insert comment to firebase
exports.commentOnScream = (req, res) => {
  if (req.body.body.trim() === "")
    return res.status.status(400).json({ error: "Comment must not be empty" });

  const newComment = {
    body: req.body.body,
    createAt: new Date().toISOString(),
    screamId: req.params.screamId,
    handle: req.user.handle,
    userImage: req.user.imageUrl,
  };

  db.doc(`/screams/${req.params.screamId}`)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(404).json({ error: `Scream not found` });
      }
      return doc.ref.update({ commentCount: doc.data().commentCount + 1 });
    })
    .then(() => {
      return db.collection("comments").add(newComment);
    })
    .then(() => {
      res.json(newComment);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ error: "Something wrong" });
    });
};

// likes cream
exports.likeScream = (req, res) => {
  const likeDocument = db
    .collection("likes")
    .where("handle", "==", req.user.handle)
    .where("screamId", "==", req.params.screamId)
    .limit(1);

  const screamDocument = db.doc(`/screams/${req.params.screamId}`);

  let screamData = {};

  screamDocument
    .get()
    .then((doc) => {
      if (doc.exists) {
        screamData = doc.data();
        screamData.screamId = doc.id;
        return likeDocument.get();
      } else {
        return res.status(404).json({ message: "Scream not found" });
      }
    })
    .then((data) => {
      if (data.empty) {
        return db
          .collection("likes")
          .add({
            screamId: req.params.screamId,
            handle: req.user.handle,
          })
          .then(() => {
            screamData.likeCount++;
            return screamDocument.update({ likeCount: screamData.likeCount });
          })
          .then(() => {
            return res.json(screamData);
          });
      } else {
        return res.status(400).json({ error: "Scream already like" });
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ error: err.code });
    });
};

// fucntion ussing count like from 1 scream
exports.unLikeScream = (req, res) => {
  const unlikeDocument = db
    .collection("likes")
    .where("handle", "==", req.user.handle)
    .where("screamId", "==", req.params.screamId)
    .limit(1);

  const screamDocument = db.doc(`/screams/${req.params.screamId}`);
  let screamData = {};
  screamDocument
    .get()
    .then((doc) => {
      if (doc.exists) {
        screamData = doc.data();
        screamData.screamId = doc.id;
        return unlikeDocument.get();
      } else {
        return res.status(404).json({ message: "Scream not found" });
      }
    })
    .then((data) => {
      if (data.empty) {
        return res.status(400).json({ error: "Scream not like" });
      } else {
        return db
          .doc(`/likes/${data.docs[0].id}`)
          .delete()
          .then(() => {
            screamData.likeCount--;
            return screamDocument.update({ likeCount: screamData.likeCount });
          })
          .then(() => {
            return res.json(screamData);
          })
          .catch((err) => {
            console.log(err);
            return res.status(500).json({ error: err.code });
          });
      }
    });
};

// delete scream
exports.deleteScream = (req, res) => {
  const document = db.doc(`/screams/${req.params.screamId}`);
  document
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(404).json({ error: "Scream not found" });
      }
      if (doc.data().handle !== req.user.handle) {
        return res.status(404).json({ error: "Unauthorized" });
      } else {
        return document.delete();
      }
    })
    .then(() => {
      res.json({ message: "Scream deleted successfully" });
    })
    .catch((err) => {
      console.log(err);
      return res.status(500).json({ error: err.code });
    });
};
