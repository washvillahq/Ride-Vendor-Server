const mongoose = require('mongoose');
const { CAR_TYPES } = require('../../shared/constants');

const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Service name is required'],
      unique: true,
      trim: true,
    },
    pricePerDay: {
      type: Number,
      required: [true, 'Service requires a daily price multiplier'],
      min: 0,
    },
    description: {
      type: String,
      required: [true, 'Service description is required'],
    },
    applicableTo: [
      {
        type: String,
        enum: Object.values(CAR_TYPES),
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Service = mongoose.model('Service', serviceSchema);
module.exports = Service;
