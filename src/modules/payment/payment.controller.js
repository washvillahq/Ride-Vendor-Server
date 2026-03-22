const paymentService = require('./payment.service');
const catchAsync = require('../../shared/utils/catchAsync');
const responseHelper = require('../../shared/utils/response');

const initializePayment = catchAsync(async (req, res) => {
  const { type, relatedId } = req.body;
  const paystackData = await paymentService.initializePayment(req.user._id, req.user.email, type, relatedId);
  responseHelper(res, 200, 'Payment initialized successfully', paystackData);
});

const verifyPayment = catchAsync(async (req, res) => {
  const { reference } = req.body;
  const paymentRecord = await paymentService.verifyPayment(reference);
  responseHelper(res, 200, 'Payment verified successfully', paymentRecord);
});

// The webhook endpoint should ideally use raw parsers to accurately check crypto signatures,
// but for this MVP, we acknowledge the payload and placeholder logic.
const webhook = catchAsync(async (req, res) => {
  const signature = req.headers['x-paystack-signature'];
  await paymentService.handleWebhook(req.body, signature);
  res.status(200).send('Webhook Processed'); // Webhooks expect immediate 200 OK
});

module.exports = {
  initializePayment,
  verifyPayment,
  webhook,
};
