const { db } = require("../util/admin");

exports.getAllScreams = (req, res) => {
  db.collection("screams")
    .get()
    .then((data) => {
      let userArr = [];
      data.forEach((doc) => {
        userArr.push({
          id: doc.id,
          user: doc.data().userHandle,
          body: doc.data().body,
          createdAt: doc.data().createdAt,
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
    userHandle: req.user.handle,
    createdAt: new Date().toISOString(),
  };

  db.collection("screams")
    .add(newInfo)
    .then((doc) => {
      res.json({ message: `document ${doc.id} created successfully` });
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
exports.commentOnScreen = (req, res) => {
  if (req.body.body.trim() === "")
    return res.status.status(400).json({ error: "Comment must not be empty" });

  const newComment = {
    body: req.body.body,
    createAt: new Date().toISOString(),
    screamId: req.params.screamId,
    userHandle: req.user.handle,
    userImage: req.user.imageUrl,
  };

  db.doc(`/screams/${req.params.screamId}`)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(404).json({ error: `Scream not found` });
      }
      return db.collection("comments").add(newComment);
    })
    .then(() => {
      res.json(newComment);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ error: 'Something wrong' });
    });
};
