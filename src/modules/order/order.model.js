const mongoose = require('mongoose');
const { PAYMENT_STATUS, ORDER_STATUS } = require('../../shared/constants');

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
    car: {
      type: mongoose.Schema.ObjectId,
      ref: 'Car',
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(ORDER_STATUS),
      default: ORDER_STATUS.PENDING,
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING,
    },
    paymentReference: {
      type: String,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
orderSchema.index({ user: 1 });
orderSchema.index({ car: 1 });

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
