const express = require('express');
const userController = require('./user.controller');
const userValidation = require('./user.validator');
const validate = require('../../shared/middlewares/validate');
const { protect } = require('../../shared/middlewares/auth');
const { restrictTo } = require('../../shared/middlewares/rbac');
const { ROLES } = require('../../shared/constants');

const router = express.Router();

// All user routes require authentication and admin role
router.use(protect);
router.use(restrictTo(ROLES.ADMIN));

router
  .route('/')
  .get(validate(userValidation.getUsers), userController.getUsers);

router
  .route('/:userId')
  .get(validate(userValidation.getUser), userController.getUser)
  .patch(validate(userValidation.updateUser), userController.updateUser)
  .delete(validate(userValidation.deleteUser), userController.deleteUser);

module.exports = router;
