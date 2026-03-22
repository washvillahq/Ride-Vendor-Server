const Joi = require('joi');
const { ORDER_STATUS, PAYMENT_STATUS } = require('../../shared/constants');
const { objectId } = require('../../shared/utils/customValidation');

const createOrder = {
  body: Joi.object().keys({
    carId: Joi.string().custom(objectId).required(),
  }),
};

const getOrders = {
  query: Joi.object().keys({
    car: Joi.string(),
    user: Joi.string(),
    status: Joi.string().valid(...Object.values(ORDER_STATUS)),
    paymentStatus: Joi.string().valid(...Object.values(PAYMENT_STATUS)),
    sort: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getOrder = {
  params: Joi.object().keys({
    orderId: Joi.string().custom(objectId).required(),
  }),
};

const updateOrderStatus = {
  params: Joi.object().keys({
    orderId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object().keys({
    status: Joi.string().valid(...Object.values(ORDER_STATUS)).required(),
  }),
};

module.exports = {
  createOrder,
  getOrders,
  getOrder,
  updateOrderStatus,
};
