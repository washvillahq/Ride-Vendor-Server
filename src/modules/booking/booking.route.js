const express = require('express');
const bookingController = require('./booking.controller');
const bookingValidation = require('./booking.validator');
const validate = require('../../shared/middlewares/validate');
const { protect } = require('../../shared/middlewares/auth');
const { restrictTo } = require('../../shared/middlewares/rbac');
const { ROLES } = require('../../shared/constants');

const router = express.Router();

// Publicly accessible utility endpoint for frontend to check availability dates
router.get('/check-availability', validate(bookingValidation.checkAvailability), bookingController.checkAvailability);

// All other endpoints require authentication
router.use(protect);

// User-facing routes
router
  .route('/')
  .post(validate(bookingValidation.createBooking), bookingController.createBooking)
  .get(validate(bookingValidation.getBookings), bookingController.getBookings);

router.get('/my', bookingController.getMyBookings);
router.get('/my-bookings', bookingController.getMyBookings);

router.patch(
  '/:bookingId/cancel',
  validate(bookingValidation.cancelBooking),
  bookingController.cancelBooking
);

// Admin-facing routes
router.use(restrictTo(ROLES.ADMIN));

router.patch(
  '/:bookingId/status',
  validate(bookingValidation.updateBookingStatus),
  bookingController.updateBookingStatus
);

module.exports = router;
