const express = require('express');
const adminController = require('./admin.controller');
const { protect } = require('../../shared/middlewares/auth');
const { restrictTo } = require('../../shared/middlewares/rbac');
const { ROLES } = require('../../shared/constants');

// For simplicity, reusing existing validators where applicable or omitting if purely params dependent
const bookingValidation = require('../booking/booking.validator');
const orderValidation = require('../order/order.validator');
const userValidation = require('../user/user.validator');
const carValidation = require('../car/car.validator');
const validate = require('../../shared/middlewares/validate');


const router = express.Router();


// Strict Admin Protection
router.use(protect);
router.use(restrictTo(ROLES.ADMIN));

router.get('/dashboard', adminController.getDashboard);

// Users
router.get('/users', validate(userValidation.getUsers), adminController.getUsers);
router.patch('/users/:id/block', (req, req_res, next) => { req.params.userId = req.params.id; next(); }, validate(userValidation.getUser), adminController.blockUser);
router.patch('/users/:id/unblock', (req, req_res, next) => { req.params.userId = req.params.id; next(); }, validate(userValidation.getUser), adminController.unblockUser);

// Bookings
router.get('/bookings', validate(bookingValidation.getBookings), adminController.getBookings);
router.patch(
  '/bookings/:id/status',
  (req, res, next) => { req.params.bookingId = req.params.id; next(); },
  validate(bookingValidation.updateBookingStatus),
  adminController.updateBookingStatus
);

// Orders
router.get('/orders', validate(orderValidation.getOrders), adminController.getOrders);
router.patch(
  '/orders/:id/status',
  (req, res, next) => { req.params.orderId = req.params.id; next(); },
  validate(orderValidation.updateOrderStatus),
  adminController.updateOrderStatus
);

// Cars
router.get('/cars', validate(carValidation.getCars), adminController.getCars);

module.exports = router;
