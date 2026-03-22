const Joi = require('joi');

const initializePayment = {
  body: Joi.object().keys({
    type: Joi.string().valid('booking', 'order').required(),
    relatedId: Joi.string().required(),
  }),
};

const verifyPayment = {
  body: Joi.object().keys({
    reference: Joi.string().required(), // The transaction reference returned by Paystack
  }),
};

module.exports = {
  initializePayment,
  verifyPayment,
};
