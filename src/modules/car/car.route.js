const express = require('express');
const carController = require('./car.controller');
const carValidation = require('./car.validator');
const validate = require('../../shared/middlewares/validate');
const { protect } = require('../../shared/middlewares/auth');
const { restrictTo } = require('../../shared/middlewares/rbac');
const { ROLES } = require('../../shared/constants');
const upload = require('../../shared/middlewares/upload');

const router = express.Router();

// Public routes
router
  .route('/')
  .get(validate(carValidation.getCars), carController.getCars);

router
  .route('/:carId')
  .get(validate(carValidation.getCar), carController.getCar);

router
  .route('/:carId/availability')
  .get(validate(carValidation.getCar), carController.getAvailability);

// Admin-only protected routes
router.use(protect);
router.use(restrictTo(ROLES.ADMIN));

router
  .route('/')
  .post(validate(carValidation.createCar), carController.createCar);

router
  .route('/:carId')
  .patch(validate(carValidation.updateCar), carController.updateCar)
  .delete(validate(carValidation.deleteCar), carController.deleteCar);

router
  .route('/:carId/status')
  .patch(validate(carValidation.updateCarStatus), carController.updateCarStatus);

// Image management routes (Admin only)
router
  .route('/:carId/images')
  .post(validate(carValidation.getCar), upload.single('image'), carController.uploadImage);

router
  .route('/:carId/images/:imageId/primary')
  .patch(validate(carValidation.getCar), carController.setPrimaryImage);

router
  .route('/:carId/images/:imageId')
  .delete(validate(carValidation.getCar), carController.deleteImage);

module.exports = router;
