const Joi = require('joi');

const register = {
  body: Joi.object().keys({
    name: Joi.string().required().trim(),
    email: Joi.string().required().email().lowercase().trim(),
    password: Joi.string().required().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).message('Password must be at least 8 characters, and contain at least one uppercase letter, one lowercase letter, and one number'),
    phone: Joi.string().required().trim(),
  }),
};

const login = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required(),
  }),
};

const changePassword = {
  body: Joi.object().keys({
    passwordCurrent: Joi.string().required(),
    password: Joi.string().required().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).message('Password must be at least 8 characters, and contain at least one uppercase letter, one lowercase letter, and one number'),
  }),
};

const forgotPassword = {
  body: Joi.object().keys({
    email: Joi.string().required().email().lowercase().trim(),
  }),
};

const resetPassword = {
  body: Joi.object().keys({
    password: Joi.string().required().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).message('Password must be at least 8 characters, and contain at least one uppercase letter, one lowercase letter, and one number'),
  }),
};

module.exports = {
  register,
  login,
  changePassword,
  forgotPassword,
  resetPassword,
};
