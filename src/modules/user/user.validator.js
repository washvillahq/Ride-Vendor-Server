const Joi = require('joi');
const { ROLES } = require('../../shared/constants');

const getUsers = {
  query: Joi.object().keys({
    name: Joi.string(),
    email: Joi.string(),
    role: Joi.string(),
    isBlocked: Joi.boolean(),
    searchTerm: Joi.string(),
    sort: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getUser = {
  params: Joi.object().keys({
    userId: Joi.string().required(), // Custom objectId validator can be added if needed
  }),
};

const updateUser = {
  params: Joi.object().keys({
    userId: Joi.required(),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string(),
      email: Joi.string().email(),
      phone: Joi.string(),
      role: Joi.string().valid(...Object.values(ROLES)),
      isBlocked: Joi.boolean(),
    })
    .min(1),
};

const deleteUser = {
  params: Joi.object().keys({
    userId: Joi.string().required(),
  }),
};

module.exports = {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
};
