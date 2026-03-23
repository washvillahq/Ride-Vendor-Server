const crypto = require('crypto');
const config = require('../../config/config');
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
  const callback_url = `${config.clientUrl}/payment-success`;
  
  // Call Paystack
  const metadata = { 
    type, 
    relatedId: relatedId.toString(), 
    userId: userId.toString() 
  };
  let paystackResponse;
  try {
    paystackResponse = await paystackHelpers.initializeTransaction(userEmail, paystackAmount, reference, metadata, callback_url);
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

  const { status, metadata: rawMetadata } = paystackResponse.data;
  
  // Handle case where metadata might be a JSON string
  let metadata = rawMetadata;
  if (typeof metadata === 'string') {
    try {
      metadata = JSON.parse(metadata);
    } catch (e) {
      console.warn('Failed to parse Paystack metadata:', e.message);
    }
  }

  console.log('Payment Verification Data:', { status, reference, metadata });

  // 3. Update Domain Models if successful
  if (status === 'success') {
    payment.status = PAYMENT_STATUS.SUCCESS;
    await payment.save();

    if (metadata && metadata.type === 'booking') {
      const booking = await Booking.findById(metadata.relatedId);
      if (booking) {
        booking.paymentStatus = PAYMENT_STATUS.SUCCESS;
        booking.paymentReference = reference;
        booking.status = BOOKING_STATUS.CONFIRMED;
        await booking.save();
        console.log(`Booking ${booking._id} status updated to CONFIRMED`);
      } else {
        console.error(`Booking ${metadata.relatedId} not found during verification`);
      }
    } else if (metadata && metadata.type === 'order') {
      const order = await Order.findById(metadata.relatedId);
      if (order) {
        order.paymentStatus = PAYMENT_STATUS.SUCCESS;
        order.paymentReference = reference;
        order.status = ORDER_STATUS.COMPLETED;
        await order.save();
        
        await Car.findByIdAndUpdate(order.car, { status: CAR_STATUS.SOLD });
        console.log(`Order ${order._id} status updated to COMPLETED`);
      } else {
        console.error(`Order ${metadata.relatedId} not found during verification`);
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
 * Re-initialize a Payment for an existing booking/order
 */
const reInitializePayment = async (userId, userEmail, type, relatedId) => {
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

  // Create a new reference for the retry
  const paystackAmount = amount * 100;
  const reference = `RV-${type}-${relatedId}-${Date.now()}`;
  const metadata = { 
    type, 
    relatedId: relatedId.toString(), 
    userId: userId.toString() 
  };

  const callback_url = `${config.clientUrl}/payment-success`;

  let paystackResponse;
  try {
    paystackResponse = await paystackHelpers.initializeTransaction(userEmail, paystackAmount, reference, metadata, callback_url);
  } catch (error) {
    throw new AppError(500, `Paystack Initialization Failed: ${error.response?.data?.message || error.message}`);
  }

  // Save new pending payment record
  await Payment.create({
    user: userId,
    amount,
    reference,
    type,
    relatedId,
    status: PAYMENT_STATUS.PENDING,
    metadata,
  });

  return paystackResponse.data;
};

/**
 * Handle Webhook
 */
const handleWebhook = async (reqBody, signature) => {
  // 1. Verify Signature
  const hash = crypto
    .createHmac('sha512', config.paystack.secretKey)
    .update(JSON.stringify(reqBody))
    .digest('hex');

  if (hash !== signature) {
    throw new AppError(400, 'Invalid webhook signature');
  }

  const event = reqBody.event;
  const data = reqBody.data;

  // 2. Process relevant events
  if (event === 'charge.success') {
    const reference = data.reference;
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
  reInitializePayment,
  handleWebhook,
};
