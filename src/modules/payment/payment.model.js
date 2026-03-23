const mongoose = require('mongoose');
const { BOOKING_STATUS, PAYMENT_STATUS, ORDER_STATUS } = require('../../shared/constants');

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    reference: {
      type: String,
      required: true,
      unique: true,
    },
    type: {
      type: String,
      enum: ['booking', 'order'],
      required: true,
    },
    relatedId: {
      type: mongoose.Schema.ObjectId,
      required: true,
      // References either Booking or Order dynamically based on `type`
    },
    status: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING,
    },
    metadata: {
      type: Object, // Stores checkout-specific identifiers securely
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({ user: 1 });

const Payment = mongoose.model('Payment', paymentSchema);
module.exports = Payment;
