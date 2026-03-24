const mongoose = require('mongoose');
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

  // 1. Idempotency / Ownership checks
  if (targetDoc.user.toString() !== userId.toString()) {
    throw new AppError(403, `You are not authorized to pay for this ${type}`);
  }
  if (targetDoc.paymentStatus === PAYMENT_STATUS.SUCCESS) {
    throw new AppError(400, `This ${type} has already been paid for`);
  }

  // 2. Fresh Availability Check (Business Logic Gate)
  // Optimization: If we just created the booking, it's already in the DB as PENDING.
  // We should only fail if there's ANOTHER booking or if status is not PENDING/CONFIRMED.
  // Actually, createBooking already checks availability. initializePayment should only check
  // if the car is still technically available for sale (if order) or not doubled booked by SOMEONE ELSE.
  if (type === 'booking') {
    const { isCarAvailable } = require('../booking/booking.service');
    // Important: Pass relatedId to ignore our own booking in the check
    const available = await isCarAvailable(targetDoc.car, targetDoc.dates, relatedId);
    if (!available) {
      throw new AppError(400, 'The car is no longer available for the selected dates. Please try another range.');
    }
  } else if (type === 'order') {
    const car = await Car.findById(targetDoc.car);
    if (!car || car.status !== CAR_STATUS.AVAILABLE) {
      throw new AppError(400, 'The car is no longer available for sale.');
    }
  }

  // 3. Payment De-duplication (Reuse existing PENDING payment if valid)
  const existingPendingPayment = await Payment.findOne({
    user: userId,
    type,
    relatedId,
    status: PAYMENT_STATUS.PENDING,
    createdAt: { $gte: new Date(Date.now() - 30 * 60 * 1000) } // Within last 30 mins
  });

  if (existingPendingPayment && existingPendingPayment.metadata?.authorization_url) {
    return {
      authorization_url: existingPendingPayment.metadata.authorization_url,
      access_code: existingPendingPayment.metadata.access_code,
      reference: existingPendingPayment.reference
    };
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

  // Save pending payment record locally with metadata for de-duplication
  await Payment.create({
    user: userId,
    amount,
    reference,
    type,
    relatedId,
    status: PAYMENT_STATUS.PENDING,
    metadata: {
      ...metadata,
      authorization_url: paystackResponse.data.authorization_url,
      access_code: paystackResponse.data.access_code
    },
  });

  return paystackResponse.data; // Includes authorization_url and access_code
};

/**
 * Verify a payment transaction
 */
const verifyPayment = async (reference) => {
  // 1. Initial check (Outside transaction for performance)
  const initialPaymentRecord = await Payment.findOne({ reference });
  if (!initialPaymentRecord) throw new AppError(404, 'Payment reference not found');
  
  // Idempotency check: if already success, just return gracefully
  if (initialPaymentRecord.status === PAYMENT_STATUS.SUCCESS) {
    return initialPaymentRecord;
  }

  // 2. Call Paystack Verification API (OUTSIDE of DB transaction)
  // This prevents holding DB locks for the duration of the external API call (~2-5s)
  let paystackResponse;
  try {
    paystackResponse = await paystackHelpers.verifyTransaction(reference);
  } catch (error) {
    throw new AppError(500, `Paystack Verification Failed: ${error.message}`);
  }

  const { status, metadata: rawMetadata } = paystackResponse.data;
  let metadata = rawMetadata;
  if (typeof metadata === 'string') {
    try {
      metadata = JSON.parse(metadata);
    } catch (e) {
      console.warn('Failed to parse Paystack metadata:', e.message);
    }
  }

  // If payment is still pending/processing on Paystack side, bail early without touching the DB
  // This prevents the session commit+throw bug that caused abortTransaction on an already-committed session
  if (status !== 'success' && status !== 'failed' && status !== 'reversed') {
    throw new AppError(400, `Payment is ${status || 'processing'}. Please wait a moment and try again.`);
  }

  // 3. Update Local DB (Inside transaction for atomic multi-model consistency)
  let retries = 3;
  while (retries > 0) {
    const session = await mongoose.startSession();
    session.startTransaction();
    let committed = false;

    try {
      const payment = await Payment.findOne({ reference }).session(session);
      if (!payment) throw new AppError(404, 'Payment reference not found during update');

      // Re-check status inside transaction (idempotency guard)
      if (payment.status === PAYMENT_STATUS.SUCCESS) {
        committed = true;
        await session.commitTransaction();
        return payment;
      }

      if (status === 'success') {
        if (payment.relatedId.toString() !== metadata.relatedId) {
          throw new AppError(400, 'Payment binding mismatch');
        }

        payment.status = PAYMENT_STATUS.SUCCESS;
        await payment.save({ session });

        if (metadata && metadata.type === 'booking') {
          const booking = await Booking.findById(metadata.relatedId).session(session);
          if (booking) {
            if (booking.status === BOOKING_STATUS.PENDING) {
              booking.paymentStatus = PAYMENT_STATUS.SUCCESS;
              booking.paymentReference = reference;
              booking.status = BOOKING_STATUS.CONFIRMED;
              await booking.save({ session });
            }
          }
        } else if (metadata && metadata.type === 'order') {
          const order = await Order.findById(metadata.relatedId).session(session);
          if (order) {
            if (order.status === ORDER_STATUS.PENDING || order.status === ORDER_STATUS.PROCESSING) {
              const car = await Car.findById(order.car).session(session);
              if (car && car.status === CAR_STATUS.AVAILABLE) {
                order.paymentStatus = PAYMENT_STATUS.SUCCESS;
                order.paymentReference = reference;
                order.status = ORDER_STATUS.COMPLETED;
                await order.save({ session });
                await Car.findByIdAndUpdate(order.car, { status: CAR_STATUS.SOLD }, { session });
              }
            }
          }
        }
      } else {
        // status is 'failed' or 'reversed'
        payment.status = PAYMENT_STATUS.FAILED;
        await payment.save({ session });
      }

      committed = true;
      await session.commitTransaction();
      return payment;
    } catch (error) {
      // Only abort if we haven't committed — prevents aborting an already-committed transaction
      if (!committed) {
        await session.abortTransaction();
      }
      const isWriteConflict = error.message.includes('Write conflict') || error.code === 112 || error.hasErrorLabel?.('TransientTransactionError');
      if (isWriteConflict && retries > 1) {
        retries--;
        await new Promise(resolve => setTimeout(resolve, 50));
        continue;
      }
      throw error;
    } finally {
      session.endSession();
    }
  }
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

  // Save new pending payment record (include auth url for de-duplication reuse)
  await Payment.create({
    user: userId,
    amount,
    reference,
    type,
    relatedId,
    status: PAYMENT_STATUS.PENDING,
    metadata: {
      ...metadata,
      authorization_url: paystackResponse.data.authorization_url,
      access_code: paystackResponse.data.access_code,
    },
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
