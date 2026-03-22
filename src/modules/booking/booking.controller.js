const bookingService = require('./booking.service');
const catchAsync = require('../../shared/utils/catchAsync');
const responseHelper = require('../../shared/utils/response');
const { calculatePagination } = require('../../shared/utils/helpers');
const paymentService = require('../payment/payment.service');

const createBooking = catchAsync(async (req, res) => {
  const bookingData = {
    user: req.user._id,
    ...req.body
  };
  const booking = await bookingService.createBooking(bookingData);
  
  // Automatically initialize payment for new bookings
  let paymentUrl;
  try {
    const paymentData = await paymentService.initializePayment(
      req.user._id, 
      req.user.email, 
      'booking', 
      booking._id
    );
    paymentUrl = paymentData.authorization_url;
  } catch (err) {
    console.error('Payment initialization failed during booking creation:', err);
    // We still return 201 as the booking was created successfully
  }

  responseHelper(res, 201, 'Booking successful', { ...booking.toObject(), paymentUrl });
});

const getBookings = catchAsync(async (req, res) => {
  // If user is not admin, they can only see their own bookings
  if (req.user.role !== 'admin') {
    req.query.user = req.user._id;
  }
  
  const { bookings, total } = await bookingService.queryBookings(req.query);
  const meta = calculatePagination(total, req.query.page || 1, req.query.limit || 10);
  
  responseHelper(res, 200, 'Bookings retrieved', { pagination: meta, bookings });
});

const getMyBookings = catchAsync(async (req, res) => {
  req.query.user = req.user._id;
  const { bookings, total } = await bookingService.queryBookings(req.query);
  const meta = calculatePagination(total, req.query.page || 1, req.query.limit || 10);
  
  responseHelper(res, 200, 'My bookings retrieved', { pagination: meta, bookings });
});

const checkAvailability = catchAsync(async (req, res) => {
  const { carId, startDate, endDate } = req.query;
  const available = await bookingService.isCarAvailable(carId, startDate, endDate);
  
  responseHelper(res, 200, 'Availability checked successfully', { available });
});

const cancelBooking = catchAsync(async (req, res) => {
  const booking = await bookingService.cancelBooking(req.params.bookingId, req.user._id, req.user.role);
  responseHelper(res, 200, 'Booking cancelled successfully', booking);
});

const updateBookingStatus = catchAsync(async (req, res) => {
  const booking = await bookingService.updateBookingStatus(req.params.bookingId, req.body.status);
  responseHelper(res, 200, 'Booking status updated successfully', booking);
});

module.exports = {
  createBooking,
  getBookings,
  getMyBookings,
  checkAvailability,
  cancelBooking,
  updateBookingStatus,
};
