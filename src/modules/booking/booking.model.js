const mongoose = require('mongoose');
const { BOOKING_STATUS, PAYMENT_STATUS } = require('../../shared/constants');

const bookingSchema = new mongoose.Schema(
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
    services: [
      {
        service: { type: mongoose.Schema.ObjectId, ref: 'Service' },
        name: String,
        pricePerDay: Number,
      },
    ],
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    dates: [
      {
        type: Date,
        required: true,
      },
    ],
    totalDays: {
      type: Number,
      required: true,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(BOOKING_STATUS),
      default: BOOKING_STATUS.PENDING,
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING,
    },
    paymentReference: {
      type: String,
    },
    pickupLocation: {
      type: String,
      trim: true,
    },
    dropoffLocation: {
      type: String,
      trim: true,
    },
    specialRequests: {
      type: String,
      trim: true,
    },
    hubAccessCode: {
      type: String,
      unique: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
bookingSchema.index({ user: 1 });
// Critical: Unique partial index to prevent double bookings (race conditions)
// Only blocks dates for bookings that are not cancelled
bookingSchema.index(
  { car: 1, dates: 1 },
  { 
    unique: true, 
    partialFilterExpression: { 
      status: { $in: [BOOKING_STATUS.PENDING, BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.ACTIVE] } 
    } 
  }
);
bookingSchema.index({ car: 1, startDate: 1, endDate: 1, status: 1 });

const Booking = mongoose.model('Booking', bookingSchema);
module.exports = Booking;
