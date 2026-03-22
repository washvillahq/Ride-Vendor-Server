const mongoose = require('mongoose');
const { CAR_TYPES, CAR_CATEGORIES, CAR_STATUS } = require('../../shared/constants');

const carSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Car title is required'],
      trim: true,
    },
    brand: {
      type: String,
      required: [true, 'Car brand is required'],
      trim: true,
    },
    model: {
      type: String,
      required: [true, 'Car model is required'],
      trim: true,
    },
    year: {
      type: Number,
      required: [true, 'Car year is required'],
      min: [1990, 'Year must be greater than or equal to 1990'],
    },
    category: {
      type: String,
      required: [true, 'Car category is required'],
      enum: Object.values(CAR_TYPES),
    },
    type: {
      type: String,
      required: [true, 'Car type (rental/sale) is required'],
      enum: Object.values(CAR_CATEGORIES),
    },
    pricePerDay: {
      type: Number,
      min: 0,
    },
    salePrice: {
      type: Number,
      min: 0,
    },
    location: {
      type: String,
      required: [true, 'Car location is required'],
    },
    description: {
      type: String,
      required: [true, 'Car description is required'],
    },
    features: [String],
    images: [
      {
        url: { type: String, required: true },
        public_id: { type: String, required: true },
        isPrimary: { type: Boolean, default: false },
      },
    ],
    status: {
      type: String,
      enum: Object.values(CAR_STATUS),
      default: CAR_STATUS.AVAILABLE,
    },
    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for faster querying
carSchema.index({ type: 1, category: 1, status: 1 });
carSchema.index({ brand: 1, model: 1 });
carSchema.index({ location: 1 });

// Document Validation Hook: Conditional Pricing Logic
carSchema.pre('validate', function (next) {
  if (this.type === CAR_CATEGORIES.RENTAL && this.pricePerDay == null) {
    this.invalidate('pricePerDay', 'Rental cars require a pricePerDay');
  }
  if (this.type === CAR_CATEGORIES.SALE && this.salePrice == null) {
    this.invalidate('salePrice', 'Sale cars require a salePrice');
  }
  next();
});

// Query Hook: Hide inactive cars from standard queries
carSchema.pre(/^find/, function (next) {
  // Check if we specifically requested inactive ones (usually an admin filter)
  // Otherwise, default to hiding them
  if (this.getFilter() && this.getFilter().status !== CAR_STATUS.UNAVAILABLE) {
    this.find({ status: { $ne: CAR_STATUS.UNAVAILABLE } });
  }
  next();
});

const Car = mongoose.model('Car', carSchema);
module.exports = Car;
