const express = require('express');
const orderController = require('./order.controller');
const orderValidation = require('./order.validator');
const validate = require('../../shared/middlewares/validate');
const { protect } = require('../../shared/middlewares/auth');
const { restrictTo } = require('../../shared/middlewares/rbac');
const { ROLES } = require('../../shared/constants');

const router = express.Router();

// All order endpoints require authentication at minimum
router.use(protect);

// User-facing routes
router
  .route('/')
  .post(validate(orderValidation.createOrder), orderController.createOrder)
  .get(validate(orderValidation.getOrders), orderController.getOrders);

router.get('/my', validate(orderValidation.getOrders), orderController.getMyOrders);

router
  .route('/:orderId')
  .get(validate(orderValidation.getOrder), orderController.getOrder);

// Admin-facing routes
router.use(restrictTo(ROLES.ADMIN));

router.patch(
  '/:orderId/status',
  validate(orderValidation.updateOrderStatus),
  orderController.updateOrderStatus
);

module.exports = router;
