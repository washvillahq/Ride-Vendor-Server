const Payment = require('./payment.model');
const Booking = require('../booking/booking.model');
const Order = require('../order/order.model');
const Car = require('../car/car.model');
const paystackHelpers = require('../../shared/utils/paystack');
const AppError = require('../../shared/utils/appError');
const { PAYMENT_STATUS, BOOKING_STATUS, ORDER_STATUS, CAR_STATUS } = require('../../shared/constants');

/**
 * Initialize a Payment
 */
const initializePayment = async (userId, userEmail, type, relatedId) => {
  let targetDoc;
  let amount;

  if (type === 'booking') {
    targetDoc = await Booking.findById(relatedId);
    if (!targetDoc) throw new AppError(404, 'Booking not found');
    amount = targetDoc.totalPrice;
  } else if (type === 'order') {
    targetDoc = await Order.findById(relatedId);
    if (!targetDoc) throw new AppError(404, 'Order not found');
    amount = targetDoc.price;
  } else {
    throw new AppError(400, 'Invalid payment type');
  }

  // Idempotency / Ownership checks
  if (targetDoc.user.toString() !== userId.toString()) {
    throw new AppError(403, `You are not authorized to pay for this ${type}`);
  }
  if (targetDoc.paymentStatus === PAYMENT_STATUS.SUCCESS) {
    throw new AppError(400, `This ${type} has already been paid for`);
  }

  // Paystack expects amount in Kobo/lowest currency unit - multiply by 100 for NGN
  const paystackAmount = amount * 100;
  const reference = `RV-${type}-${relatedId}-${Date.now()}`;

  // Call Paystack
  const metadata = { type, relatedId, userId };
  let paystackResponse;
  try {
    paystackResponse = await paystackHelpers.initializeTransaction(userEmail, paystackAmount, reference, metadata);
  } catch (error) {
    throw new AppError(500, `Paystack Initialization Failed: ${error.response?.data?.message || error.message}`);
  }

  // Save pending payment record locally
  await Payment.create({
    user: userId,
    amount,
    reference,
    type,
    relatedId,
    status: PAYMENT_STATUS.PENDING,
    metadata,
  });

  return paystackResponse.data; // Includes authorization_url and access_code
};

/**
 * Verify a payment transaction
 */
const verifyPayment = async (reference) => {
  // 1. Check local DB first
  const payment = await Payment.findOne({ reference });
  if (!payment) throw new AppError(404, 'Payment reference not found');

  // Idempotency check: if already success, just return gracefully
  if (payment.status === PAYMENT_STATUS.SUCCESS) {
    return payment;
  }

  // 2. Call Paystack Verification API
  let paystackResponse;
  try {
    paystackResponse = await paystackHelpers.verifyTransaction(reference);
  } catch (error) {
    throw new AppError(500, `Paystack Verification Failed: ${error.message}`);
  }

  const { status, metadata } = paystackResponse.data;

  // 3. Update Domain Models if successful
  if (status === 'success') {
    payment.status = PAYMENT_STATUS.SUCCESS;
    await payment.save();

    if (metadata.type === 'booking') {
      const booking = await Booking.findById(metadata.relatedId);
      if (booking) {
        booking.paymentStatus = PAYMENT_STATUS.SUCCESS;
        booking.paymentReference = reference;
        booking.status = BOOKING_STATUS.CONFIRMED;
        await booking.save();
      }
    } else if (metadata.type === 'order') {
      const order = await Order.findById(metadata.relatedId);
      if (order) {
        order.paymentStatus = PAYMENT_STATUS.SUCCESS;
        order.paymentReference = reference;
        order.status = ORDER_STATUS.COMPLETED;
        await order.save();
        
        // Finalize car sale status
        await Car.findByIdAndUpdate(order.car, { status: CAR_STATUS.SOLD });
      }
    }
  } else {
    payment.status = PAYMENT_STATUS.FAILED;
    await payment.save();
    throw new AppError(400, 'Payment was not successful');
  }

  return payment;
};

/**
 * Handle Webhook (Placeholder)
 * Recommendation: Validate the x-paystack-signature header using crypto and JWT secret/Paystack secret.
 */
const handleWebhook = async (reqBody, signature) => {
  // 1. Verify Signature here using crypto.createHmac('sha512', config.paystack.secretKey).update(JSON.stringify(reqBody)).digest('hex')
  // 2. If valid and reqBody.event === 'charge.success', extract reference
  // 3. Call verifyPayment(reqBody.data.reference) OR run the update logic safely
  const event = reqBody.event;
  if (event === 'charge.success') {
    const reference = reqBody.data.reference;
    // We swallow errors in webhooks normally and just log to avoid retries on 404s
    try {
      await verifyPayment(reference);
    } catch (err) {
      console.error(`Webhook verification failed for ${reference}:`, err.message);
    }
  }
  return true;
};

module.exports = {
  initializePayment,
  verifyPayment,
  handleWebhook,
};
