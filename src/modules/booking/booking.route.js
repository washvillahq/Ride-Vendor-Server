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
router.get('/:carId/availability', bookingController.getCarAvailabilitySchedule);

// All other endpoints require authentication
router.use(protect);

// User-facing routes
router
  .route('/')
  .post(validate(bookingValidation.createBooking), bookingController.createBooking)
  .get(validate(bookingValidation.getBookings), bookingController.getBookings);

router.get('/my', validate(bookingValidation.getBookings), bookingController.getMyBookings);
router.get('/my-bookings', validate(bookingValidation.getBookings), bookingController.getMyBookings);

router.patch(
  '/:bookingId/cancel',
  validate(bookingValidation.cancelBooking),
  bookingController.cancelBooking
);

router.post(
  '/:bookingId/extend',
  validate(bookingValidation.extendBooking),
  bookingController.extendBooking
);

// Admin-facing routes
router.use(restrictTo(ROLES.ADMIN));

router.patch(
  '/:bookingId/status',
  validate(bookingValidation.updateBookingStatus),
  bookingController.updateBookingStatus
);

module.exports = router;
