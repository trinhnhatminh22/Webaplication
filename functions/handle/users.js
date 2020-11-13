const { db } = require("../util/admin");

const config = require("../util/config");

var firebase = require("firebase/app");

// Add the Firebase products that you want to use
require("firebase/auth");
require("firebase/firestore");

firebase.initializeApp(config);

const {
  validateSignupData,
  validateLoginData,
  reduceUserDetails,
} = require("../util/validator");
const admin = require("../util/admin");
const { resolveSoa } = require("dns");

exports.signup = (req, res) => {
  let token, userId;

  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    handle: req.body.handle,
  };

  const { valid, errors } = validateSignupData(newUser);

  if (!valid) return res.status(400).json(errors);

  const defaultImage = "A-1400317-1335717476.png.jpg";

  db.doc(`/user/${newUser.handle}`)
    .get()
    .then((doc) => {
      if (doc.exists) {
        return res
          .status(400)
          .json({ handle: "this handle have already taken" });
      } else {
        return firebase
          .auth()
          .createUserWithEmailAndPassword(newUser.email, newUser.password);
      }
    })
    .then((data) => {
      userId = data.user.uid;
      return data.user.getIdToken();
    })
    .then((idToken) => {
      token = idToken;
      const userCredentials = {
        handle: newUser.handle,
        email: newUser.email,
        createdAt: new Date().toISOString(),
        imageUrl: `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${defaultImage}?alt=media`,
        userId,
      };
      return db.doc(`/users/${newUser.handle}`).set(userCredentials);
    })
    .then(() => {
      return res.status(201).json({ token });
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};

exports.login = (req, res) => {
  const user = {
    email: req.body.email,
    password: req.body.password,
  };

  const { valid, errors } = validateLoginData(user);

  if (!valid) return res.status(400).json(errors);

  firebase
    .auth()
    .signInWithEmailAndPassword(user.email, user.password)
    .then((data) => {
      userId = data.user.uid;
      return data.user.getIdToken();
    })
    .then((idToken) => {
      return res.json({ idToken });
    })
    .catch((error) => {
      console.error(error);
      if (error.code === "auth/wrong-password") {
        return res.status(403).json({ message: `Wrong password` });
      } else {
        return res.status(500).json({ message: `${error}` });
      }
    });
};
// add user detail
exports.addUserDetails = (req, res) => {
  let userDetails = reduceUserDetails(req.body);

  db.doc(`/users/${req.user.handle}`)
    .update(userDetails)
    .then(() => {
      return res.json({ message: "Detail added succesfully" });
    })
    .catch((err) => {
      console.error(err);
      return res.statu(500).json({ message: ` ${err}` });
    });
};
// get user detail where handle in DB = userHandle
exports.getAuthenticatedUser = (req, res) => {
  let userData = {};
  db.doc(`/users/${req.user.handle}`)
    .get()
    .then((doc) => {
      if (doc.exists) {
        userData.credentials = doc.data();
        return db
          .collection("likes")
          .where("handle", "==", req.user.handle)
          .get()
          .then((data) => {
            userData.likes = [];
            data.forEach((doc) => {
              userData.likes.push(doc.data());
            });
            return res.json(userData);
          })
          .catch((err) => {
            console.error(err);
            return res.status(500).json({ error: `${err}` });
          });
      }
    });
};
// this function using for upload image to firebase
exports.uploadImage = (req, res) => {
  const Busboy = require("busboy");
  const path = require("path");
  const os = require("os");
  const fs = require("fs");

  const busboy = new Busboy({ headers: req.headers });

  let imageFileName;
  let imageToBeUploaded = {};

  busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
    console.log("field name is: ", fieldname);
    console.log("file name is: ", filename);
    console.log("minetype is: ", mimetype);
    console.log("file is: ", file);
    // email format name: my.image.png
    const imageExtension = filename.split(".");
    [filename.split(".").length - 1];

    imageFileName = `${Math.round(Math.random() * 10000000)}.${imageExtension}`;

    const filePath = path.join(os.tmpdir(), imageFileName);

    imageToBeUploaded = { filePath, mimetype };
    file.pipe(fs.createWriteStream(filePath));
  });
  busboy.on("finish", () => {
    if (mimetype !== "image/jpeg" && mimetype !== "image/png") {
      return res.status(400).json({ error: "Wrong type of file" });
    }
    admin
      .storage()
      .bucket()
      .upload(imageToBeUploaded.filePath, {
        resumable: false,
        metadata: {
          metadata: {
            contentType: imageToBeUploaded.mimetype,
          },
        },
      })
      .then(() => {
        // without alt = media. it will dowload the file to computer
        // with alt=media. it will show the image
        const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media`;
        return db
          .doc(`/users/${req.user.handle}`)
          .update({ imageUrl: imageUrl });
      })
      .then(() => {
        return res.json({ message: "Image uploaded successfully" });
      })
      .catch((err) => {
        console.error(err);
        return res.status(500).json({ error: err.code });
      });
  });
  busboy.end(req.rawBody);
};
