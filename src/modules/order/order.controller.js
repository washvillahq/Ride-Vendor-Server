const orderService = require('./order.service');
const catchAsync = require('../../shared/utils/catchAsync');
const responseHelper = require('../../shared/utils/response');
const { calculatePagination } = require('../../shared/utils/helpers');

const createOrder = catchAsync(async (req, res) => {
  const order = await orderService.createOrder(req.user._id, req.body.carId);
  responseHelper(res, 201, 'Order created successfully', order);
});

const getOrders = catchAsync(async (req, res) => {
  if (req.user.role !== 'admin') {
    req.query.user = req.user._id;
  }
  
  const { orders, total } = await orderService.queryOrders(req.query);
  const meta = calculatePagination(total, req.query.page || 1, req.query.limit || 10);
  
  responseHelper(res, 200, 'Orders retrieved', { pagination: meta, orders });
});

const getMyOrders = catchAsync(async (req, res) => {
  req.query.user = req.user._id;
  const { orders, total } = await orderService.queryOrders(req.query);
  const meta = calculatePagination(total, req.query.page || 1, req.query.limit || 10);
  
  responseHelper(res, 200, 'My orders retrieved', { pagination: meta, orders });
});

const getOrder = catchAsync(async (req, res) => {
  const order = await orderService.getOrderById(req.params.orderId, req.user._id, req.user.role);
  responseHelper(res, 200, 'Order retrieved', order);
});

const updateOrderStatus = catchAsync(async (req, res) => {
  const order = await orderService.updateOrderStatus(req.params.orderId, req.body.status);
  responseHelper(res, 200, 'Order status updated successfully', order);
});

module.exports = {
  createOrder,
  getOrders,
  getMyOrders,
  getOrder,
  updateOrderStatus,
};
