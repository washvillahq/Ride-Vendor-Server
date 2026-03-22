const express = require('express');
const authController = require('./auth.controller');
const authValidation = require('./auth.validator');
const validate = require('../../shared/middlewares/validate');
const { protect } = require('../../shared/middlewares/auth');

const router = express.Router();

router.post('/register', validate(authValidation.register), authController.register);
router.post('/login', validate(authValidation.login), authController.login);
router.post('/logout', authController.logout);

// Protected routes
router.use(protect); // Applies to all routes below this line
router.get('/me', authController.getMe);
router.patch('/change-password', validate(authValidation.changePassword), authController.changePassword);

module.exports = router;
