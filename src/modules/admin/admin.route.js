const express = require('express');
const adminController = require('./admin.controller');
const { protect } = require('../../shared/middlewares/auth');
const { restrictTo } = require('../../shared/middlewares/rbac');
const { ROLES } = require('../../shared/constants');

// For simplicity, reusing existing validators where applicable or omitting if purely params dependent
const bookingValidation = require('../booking/booking.validator');
const orderValidation = require('../order/order.validator');
const validate = require('../../shared/middlewares/validate');

const router = express.Router();

// Strict Admin Protection
router.use(protect);
router.use(restrictTo(ROLES.ADMIN));

router.get('/dashboard', adminController.getDashboard);

// Users
router.get('/users', adminController.getUsers);
router.patch('/users/:id/block', adminController.blockUser);
router.patch('/users/:id/unblock', adminController.unblockUser);

// Bookings
router.get('/bookings', adminController.getBookings);
router.patch(
  '/bookings/:id/status', 
  validate(bookingValidation.updateBookingStatus), 
  adminController.updateBookingStatus
); // We can reuse the validator by mapping :id to :bookingId if we rewrite the path or just pass standard rules

// Orders
router.get('/orders', adminController.getOrders);
router.patch(
  '/orders/:id/status',
  validate(orderValidation.updateOrderStatus), // Same approach, ensure params match the Joi schema key names, which use orderId not id. Actually we should either remap params to match schemas or rewrite schema safely.
  (req, res, next) => {
    // Adapter mapping 'id' to 'orderId' to please the validator natively
    req.params.orderId = req.params.id;
    next();
  },
  validate(orderValidation.updateOrderStatus),
  adminController.updateOrderStatus
);

// Cars
router.get('/cars', adminController.getCars);

module.exports = router;
