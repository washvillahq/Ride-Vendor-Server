const adminService = require('./admin.service');
const userService = require('../user/user.service');
const carService = require('../car/car.service');
const bookingService = require('../booking/booking.service');
const orderService = require('../order/order.service');

const catchAsync = require('../../shared/utils/catchAsync');
const responseHelper = require('../../shared/utils/response');
const { calculatePagination } = require('../../shared/utils/helpers');

// --- DASHBOARD ---
const getDashboard = catchAsync(async (req, res) => {
  const metrics = await adminService.getDashboardMetrics();
  responseHelper(res, 200, 'Admin dashboard metrics retrieved successfully', metrics);
});

// --- USERS ---
const getUsers = catchAsync(async (req, res) => {
  // Re-use User service QueryBuilder logic
  const users = await userService.queryUsers(req.query);
  responseHelper(res, 200, 'Users retrieved', users);
});

const blockUser = catchAsync(async (req, res) => {
  const user = await adminService.toggleUserBlock(req.params.id, true);
  responseHelper(res, 200, 'User blocked successfully', user);
});

const unblockUser = catchAsync(async (req, res) => {
  const user = await adminService.toggleUserBlock(req.params.id, false);
  responseHelper(res, 200, 'User unblocked successfully', user);
});

// --- BOOKINGS ---
const getBookings = catchAsync(async (req, res) => {
  const { bookings, total } = await bookingService.queryBookings(req.query);
  const meta = calculatePagination(total, req.query.page || 1, req.query.limit || 10);
  responseHelper(res, 200, 'Bookings retrieved', { meta, data: bookings });
});

const updateBookingStatus = catchAsync(async (req, res) => {
  const booking = await bookingService.updateBookingStatus(req.params.id, req.body.status);
  responseHelper(res, 200, 'Booking status updated successfully', booking);
});

// --- ORDERS ---
const getOrders = catchAsync(async (req, res) => {
  const { orders, total } = await orderService.queryOrders(req.query);
  const meta = calculatePagination(total, req.query.page || 1, req.query.limit || 10);
  responseHelper(res, 200, 'Orders retrieved', { meta, data: orders });
});

const updateOrderStatus = catchAsync(async (req, res) => {
  const order = await orderService.updateOrderStatus(req.params.id, req.body.status);
  responseHelper(res, 200, 'Order status updated successfully', order);
});

// --- CARS ---
const getCars = catchAsync(async (req, res) => {
  const { cars, total } = await carService.queryCars(req.query);
  const meta = calculatePagination(total, req.query.page || 1, req.query.limit || 10);
  responseHelper(res, 200, 'Cars retrieved', { meta, data: cars });
});

module.exports = {
  getDashboard,
  getUsers,
  blockUser,
  unblockUser,
  getBookings,
  updateBookingStatus,
  getOrders,
  updateOrderStatus,
  getCars,
};
