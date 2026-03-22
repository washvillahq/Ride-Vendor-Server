const Order = require('./order.model');
const Car = require('../car/car.model');
const QueryBuilder = require('../../shared/utils/QueryBuilder');
const AppError = require('../../shared/utils/appError');
const { CAR_CATEGORIES, CAR_STATUS, ORDER_STATUS } = require('../../shared/constants');

/**
 * Create a new order for a car purchase
 * @param {ObjectId} userId 
 * @param {ObjectId} carId 
 */
const createOrder = async (userId, carId) => {
  // 1. Validate Car exists, is for sale, and is active/available
  const car = await Car.findById(carId);
  if (!car) throw new AppError(404, 'Car not found');
  if (car.type !== CAR_CATEGORIES.SALE) throw new AppError(400, 'This car is for rental, not for sale');
  if (car.status !== CAR_STATUS.AVAILABLE) throw new AppError(400, `Car is currently ${car.status} and cannot be purchased`);

  // 2. Prevent duplicate active orders for the same user and car (optional protection)
  const existingOrder = await Order.findOne({
    user: userId,
    car: carId,
    status: { $in: [ORDER_STATUS.PENDING, ORDER_STATUS.PROCESSING] },
  });
  if (existingOrder) throw new AppError(400, 'You already have an active order for this car');

  // 3. Capture exact salePrice
  const price = car.salePrice;

  // 4. Create Order
  const order = await Order.create({
    user: userId,
    car: carId,
    price,
  });

  return order;
};

/**
 * Query orders
 */
const queryOrders = async (queryParams) => {
  const ordersQuery = new QueryBuilder(Order.find().populate('car', 'title brand year images').populate('user', 'name email'), queryParams)
    .filter()
    .sort()
    .select()
    .paginate();

  const orders = await ordersQuery.modelQuery;
  
  const countQuery = new QueryBuilder(Order.find(), queryParams).filter();
  const total = await countQuery.modelQuery.countDocuments();

  return { orders, total };
};

/**
 * Get an order by ID
 */
const getOrderById = async (orderId, userId, userRole) => {
  const order = await Order.findById(orderId).populate('car', 'title brand').populate('user', 'name email');
  if (!order) throw new AppError(404, 'Order not found');

  if (userRole !== 'admin' && order.user._id.toString() !== userId.toString()) {
    throw new AppError(403, 'You are not authorized to view this order');
  }

  return order;
};

/**
 * Update order status (Admin only)
 */
const updateOrderStatus = async (orderId, status) => {
  const order = await Order.findByIdAndUpdate(
    orderId,
    { $set: { status } },
    { new: true, runValidators: true }
  );
  if (!order) throw new AppError(404, 'Order not found');

  // If order is completed, mark car as sold automatically (Basic transaction capability)
  if (status === ORDER_STATUS.COMPLETED) {
    await Car.findByIdAndUpdate(order.car, { status: CAR_STATUS.SOLD });
  }

  return order;
};

module.exports = {
  createOrder,
  queryOrders,
  getOrderById,
  updateOrderStatus,
};
