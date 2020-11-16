// validate function. In this function, validate the value of data input

exports.validateSignupData = (data) => {
  let errors = {};
  if (isEmpty(data.email)) {
    errors.email = "Email must not be empty";
  } else if (!isEmail(data.email)) {
    errors.email = "Email's format is wrong";
  }

  if (isEmpty(data.password)) {
    errors.password = "Password must not be empty";
  }
  if (data.confirmPassword !== data.password) {
    errors.confirmPassword = " password confirm is difference from password";
  }
  if (isEmpty(data.handle)) {
    errors.handle = "handle must not be empty";
  }

  return {
    errors,
    valid: Object.keys(errors).length === 0 ? true : false,
  };
};


// validate email and password of input data
exports.validateLoginData = (data) => {
  let errors = {};

  if (isEmpty(data.email)) {
    errors.email = "Email must not be empty";
  }
  if (isEmpty(data.password)) {
    errors.password = "Password must not be empty";
  }

  return {
    errors,
    valid: Object.keys(errors).length === 0 ? true : false,
  };
};

// validate the input string is not empty
const isEmpty = (string) => {
  if (string.trim() === "") {
    return true;
  } else {
    return false;
  }
};

// check the email's format is email
const isEmail = (email) => {
  const regEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if (email.match(regEx)) {
    return true;
  } else {
    return false;
  }
};

// set the data for user:  location, website
exports.reduceUserDetails = (data) => {
  let userDetails = {};

  if (!isEmpty(data.bio.trim())) {
    userDetails.bio = data.bio;
  }
  if (!isEmpty(data.website.trim())) {
    if (data.website.trim().substring(0, 4) !== 'http'){
      userDetails.website = `http://${data.website.trim()}`;
    }else {
      userDetails.website = data.website;
    }
  }
  if (!isEmpty(data.location.trim())) {
    userDetails.location = data.location;
  }
}