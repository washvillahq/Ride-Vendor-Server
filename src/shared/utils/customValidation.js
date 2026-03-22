const mongoose = require('mongoose');

/**
 * Custom Joi validation for exact MongoDB ObjectId strings
 */
const objectId = (value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.message('"{{#label}}" must be a valid strictly formatted MongoDB ID');
  }
  return value;
};

/**
 * Custom Joi validation for strong passwords
 */
const password = (value, helpers) => {
  if (value.length < 8) {
    return helpers.message('password must be at least 8 characters');
  }
  if (!value.match(/\d/) || !value.match(/[a-zA-Z]/)) {
    return helpers.message('password must contain at least 1 letter and 1 number');
  }
  return value;
};

module.exports = {
  objectId,
  password,
};
