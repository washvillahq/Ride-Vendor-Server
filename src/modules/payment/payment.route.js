const express = require('express');
const paymentController = require('./payment.controller');
const paymentValidation = require('./payment.validator');
const validate = require('../../shared/middlewares/validate');
const { protect } = require('../../shared/middlewares/auth');

const router = express.Router();

// Webhook typically does not hit the protect middleware because it's coming from an external server
router.post('/webhook', paymentController.webhook);

// Must be logged in to initialize or actively verify
router.use(protect);

router.post('/initialize', validate(paymentValidation.initializePayment), paymentController.initializePayment);
router.post('/verify', validate(paymentValidation.verifyPayment), paymentController.verifyPayment);

module.exports = router;
