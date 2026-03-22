const User = require('../user/user.model');
const Car = require('../car/car.model');
const Booking = require('../booking/booking.model');
const Order = require('../order/order.model');
const Payment = require('../payment/payment.model');
const AppError = require('../../shared/utils/appError');
const { BOOKING_STATUS, ORDER_STATUS, CAR_CATEGORIES, CAR_STATUS, PAYMENT_STATUS } = require('../../shared/constants');

/**
 * Get comprehensive admin dashboard metrics
 */
const getDashboardMetrics = async () => {
  const [
    totalUsers,
    totalCars,
    totalRentalCars,
    totalSaleCars,
    totalBookings,
    totalOrders,
    pendingBookingsCount,
    pendingOrdersCount,
    soldCarsCount,
    availableCarsCount,
    revenueAggregation
  ] = await Promise.all([
    User.countDocuments(),
    Car.countDocuments(),
    Car.countDocuments({ type: CAR_CATEGORIES.RENTAL }),
    Car.countDocuments({ type: CAR_CATEGORIES.SALE }),
    Booking.countDocuments(),
    Order.countDocuments(),
    Booking.countDocuments({ status: BOOKING_STATUS.PENDING }),
    Order.countDocuments({ status: ORDER_STATUS.PENDING }),
    Car.countDocuments({ status: CAR_STATUS.SOLD }),
    Car.countDocuments({ status: CAR_STATUS.AVAILABLE }),
    Payment.aggregate([
      { $match: { status: PAYMENT_STATUS.SUCCESS } },
      { $group: { _id: null, totalRevenue: { $sum: "$amount" } } }
    ])
  ]);

  const totalRevenue = revenueAggregation.length > 0 ? revenueAggregation[0].totalRevenue : 0;

  return {
    totalUsers,
    totalCars,
    totalRentalCars,
    totalSaleCars,
    totalBookings,
    totalOrders,
    pendingBookingsCount,
    pendingOrdersCount,
    soldCarsCount,
    availableCarsCount,
    totalRevenue,
  };
};

/**
 * Block or Unblock a user
 */
const toggleUserBlock = async (userId, isBlocked) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: { isBlocked } },
    { new: true, runValidators: true }
  ).select('-password');

  if (!user) throw new AppError(404, 'User not found');
  return user;
};

module.exports = {
  getDashboardMetrics,
  toggleUserBlock,
};
