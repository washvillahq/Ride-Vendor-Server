const Joi = require('joi');
const { BOOKING_STATUS, PAYMENT_STATUS } = require('../../shared/constants');
const { objectId } = require('../../shared/utils/customValidation');

const createBooking = {
  body: Joi.object().keys({
    carId: Joi.string().custom(objectId).required(),
    dates: Joi.array().items(Joi.date().iso().min(new Date().setHours(0, 0, 0, 0))).min(1).required().messages({
      'array.min': 'Please select at least one date',
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

const extendBooking = {
  params: Joi.object().keys({
    bookingId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object().keys({
    newDates: Joi.array().items(Joi.date().iso()).min(1).required(),
  }),
};

module.exports = {
  createBooking,
  getBookings,
  getBooking,
  checkAvailability,
  cancelBooking,
  updateBookingStatus,
  extendBooking,
};
