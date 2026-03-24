const express = require('express');
const userController = require('./user.controller');
const userValidation = require('./user.validator');
const validate = require('../../shared/middlewares/validate');
const { protect } = require('../../shared/middlewares/auth');
const { restrictTo } = require('../../shared/middlewares/rbac');
const { ROLES } = require('../../shared/constants');

const router = express.Router();

// Base Protection: All user routes require authentication
router.use(protect);

router
  .route('/')
  .get(restrictTo(ROLES.ADMIN), validate(userValidation.getUsers), userController.getUsers);

router
  .route('/:userId')
  .get(validate(userValidation.getUser), userController.getUser)
  .patch(validate(userValidation.updateUser), userController.updateUser)
  .delete(restrictTo(ROLES.ADMIN), validate(userValidation.deleteUser), userController.deleteUser);

module.exports = router;
