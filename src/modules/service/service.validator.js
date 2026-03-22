const Joi = require('joi');
const { CAR_TYPES } = require('../../shared/constants');

const createService = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    pricePerDay: Joi.number().min(0).required(),
    description: Joi.string().required(),
    applicableTo: Joi.array().items(Joi.string().valid(...Object.values(CAR_TYPES))).min(1).required(),
  }),
};

const getServices = {
  query: Joi.object().keys({
    applicableTo: Joi.string().valid(...Object.values(CAR_TYPES)),
    sort: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getService = {
  params: Joi.object().keys({
    serviceId: Joi.string().required(),
  }),
};

const updateService = {
  params: Joi.object().keys({
    serviceId: Joi.required(),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string(),
      pricePerDay: Joi.number().min(0),
      description: Joi.string(),
      applicableTo: Joi.array().items(Joi.string().valid(...Object.values(CAR_TYPES))),
    })
    .min(1),
};

const deleteService = {
  params: Joi.object().keys({
    serviceId: Joi.string().required(),
  }),
};

module.exports = {
  createService,
  getServices,
  getService,
  updateService,
  deleteService,
};
