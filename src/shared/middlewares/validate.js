const Joi = require('joi');
const AppError = require('../utils/appError');

const validate = (schema) => (req, res, next) => {
  const validSchema = typeof schema === 'function' ? schema() : schema;
  const joiSchema = Joi.compile(validSchema);
  
  const object = {};
  if (Object.keys(req.body).length) object.body = req.body;
  if (Object.keys(req.query).length) object.query = req.query;
  if (Object.keys(req.params).length) object.params = req.params;

  if (validSchema.body && !object.body) object.body = {};
  if (validSchema.query && !object.query) object.query = {};
  if (validSchema.params && !object.params) object.params = {};

  const { value, error } = joiSchema.validate(object, {
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: true,
  });

  if (error) {
    console.log('--- VALIDATION ERROR ---');
    console.log('Object:', JSON.stringify(object, null, 2));
    const errorMessage = error.details.map((details) => details.message).join(', ');
    console.log('Message:', errorMessage);
    return next(new AppError(400, errorMessage));
  }

  // Reassign the coerced/validated values back to req
  Object.assign(req, value);
  return next();
};

module.exports = validate;
