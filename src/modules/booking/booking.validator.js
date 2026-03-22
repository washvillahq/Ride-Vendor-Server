const Joi = require('joi');
const { BOOKING_STATUS, PAYMENT_STATUS } = require('../../shared/constants');
const { objectId } = require('../../shared/utils/customValidation');

const createBooking = {
  body: Joi.object().keys({
    carId: Joi.string().custom(objectId).required(),
    startDate: Joi.date().iso().min(new Date().setHours(0, 0, 0, 0)).required().messages({
      'date.base': 'Please provide a valid start date',
      'date.min': 'startDate cannot be in the past',
    }),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).required().messages({
      'date.min': 'endDate must be logically after startDate',
    }),
    services: Joi.array().items(Joi.string()), // array of service IDs
    pickupLocation: Joi.string(),
    dropoffLocation: Joi.string(),
    specialRequests: Joi.string().allow('', null),
  }),
};

const getBookings = {
  query: Joi.object().keys({
    car: Joi.string(),
    user: Joi.string(),
    status: Joi.string().valid(...Object.values(BOOKING_STATUS)),
    paymentStatus: Joi.string().valid(...Object.values(PAYMENT_STATUS)),
    sort: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getBooking = {
  params: Joi.object().keys({
    bookingId: Joi.string().custom(objectId).required(),
  }),
};

const checkAvailability = {
  query: Joi.object().keys({
    carId: Joi.string().custom(objectId).required(),
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().required(),
  }),
};

const cancelBooking = {
  params: Joi.object().keys({
    bookingId: Joi.string().custom(objectId).required(),
  }),
};

const updateBookingStatus = {
  params: Joi.object().keys({
    bookingId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object().keys({
    status: Joi.string().valid(...Object.values(BOOKING_STATUS)).required(),
  }),
};

module.exports = {
  createBooking,
  getBookings,
  getBooking,
  checkAvailability,
  cancelBooking,
  updateBookingStatus,
};
