const express = require('express');
const serviceController = require('./service.controller');
const serviceValidation = require('./service.validator');
const validate = require('../../shared/middlewares/validate');
const { protect } = require('../../shared/middlewares/auth');
const { restrictTo } = require('../../shared/middlewares/rbac');
const { ROLES } = require('../../shared/constants');

const router = express.Router();

// Public routes
router
  .route('/')
  .get(validate(serviceValidation.getServices), serviceController.getServices);

router
  .route('/:serviceId')
  .get(validate(serviceValidation.getService), serviceController.getService);

// Admin-only protected routes
router.use(protect);
router.use(restrictTo(ROLES.ADMIN));

router
  .route('/')
  .post(validate(serviceValidation.createService), serviceController.createService);

router
  .route('/:serviceId')
  .patch(validate(serviceValidation.updateService), serviceController.updateService)
  .delete(validate(serviceValidation.deleteService), serviceController.deleteService);

module.exports = router;
