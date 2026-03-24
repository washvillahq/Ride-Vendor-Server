const Booking = require('./booking.model');
const Car = require('../car/car.model');
const serviceService = require('../service/service.service');
const QueryBuilder = require('../../shared/utils/QueryBuilder');
const AppError = require('../../shared/utils/appError');
const { CAR_CATEGORIES, CAR_STATUS, BOOKING_STATUS } = require('../../shared/constants');
const { calculateTotalDays, checkDateOverlap } = require('../../shared/utils/helpers');

/**
 * Check if a car is available for a given date range
 * @param {ObjectId} carId 
 * @param {Date} startDate 
 * @param {Date} endDate 
 * @returns {Promise<boolean>}
 */
const isCarAvailable = async (carId, dates, excludeBookingId = null) => {
  // Normalize input dates to start of day
  const normalizedRequestedDates = dates.map(d => new Date(new Date(d).setHours(0,0,0,0)).getTime());

  // Find only bookings that block availability
  const query = {
    car: carId,
    status: { $in: [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.ACTIVE] },
  };

  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }

  const existingBookings = await Booking.find(query).select('startDate endDate dates');

  for (const booking of existingBookings) {
    // If the existing booking has discrete dates, check individual dates
    if (booking.dates && booking.dates.length > 0) {
      const existingTimeMap = new Set(booking.dates.map(d => new Date(new Date(d).setHours(0,0,0,0)).getTime()));
      if (normalizedRequestedDates.some(rd => existingTimeMap.has(rd))) {
        return false;
      }
    } else {
      // Fallback for range-based legacy bookings
      const ranges = [{ start: booking.startDate, end: booking.endDate }];
      if (normalizedRequestedDates.some(rd => {
        const dTime = rd;
        return dTime >= new Date(booking.startDate).setHours(0,0,0,0) && 
               dTime <= new Date(booking.endDate).setHours(0,0,0,0);
      })) {
        return false;
      }
    }
  }
  
  return true;
};

/**
 * Get comprehensive car availability schedule for frontend calendar mapping
 */
const getCarAvailabilitySchedule = async (carId) => {
  const car = await Car.findById(carId);
  if (!car) throw new AppError(404, 'Car not found');

  // If sale car, availability is just based on status
  if (car.type === CAR_CATEGORIES.SALE) {
    return {
      carId: car._id,
      carType: car.type,
      currentStatus: car.status,
      unavailableRanges: [],
      isAvailableNow: car.status === CAR_STATUS.AVAILABLE,
    };
  }

  // If rental car, get active blocking bookings
  const blockingBookings = await Booking.find({
    car: carId,
    status: { $in: [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.ACTIVE] },
    endDate: { $gte: new Date() } // Only care about current/future blocks
  }).select('startDate endDate dates');

  const unavailableRanges = blockingBookings.map(b => ({
    startDate: b.startDate,
    endDate: b.endDate
  }));

  // Collect all discrete booked dates to precisely disable them in the frontend calendar
  const bookedDatesSet = new Set();
  blockingBookings.forEach(booking => {
    if (booking.dates && booking.dates.length > 0) {
      booking.dates.forEach(d => {
        const date = new Date(d);
        date.setHours(0, 0, 0, 0);
        bookedDatesSet.add(date.getTime());
      });
    } else {
      // Fallback for range-based bookings: generate all intermediate dates
      let current = new Date(booking.startDate);
      const end = new Date(booking.endDate);
      current.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      while (current <= end) {
        bookedDatesSet.add(current.getTime());
        current.setDate(current.getDate() + 1);
      }
    }
  });

  const bookedDates = Array.from(bookedDatesSet).map(time => new Date(time));

  // Check if available right now (today)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isAvailableNow = car.status === CAR_STATUS.AVAILABLE && !bookedDatesSet.has(today.getTime());

  return {
    carId: car._id,
    carType: car.type,
    currentStatus: car.status,
    unavailableRanges,
    bookedDates,
    isAvailableNow,
  };
};

/**
 * Create a new booking
 * @param {Object} bookingData ({ user, carId, startDate, endDate, services: [] })
 */
const createBooking = async (bookingData) => {
  const { user, carId, dates: requestedDates, services: requestedServices, pickupLocation, dropoffLocation, specialRequests } = bookingData;

  // 1. Validate Car exists, is rental, and is active
  const car = await Car.findById(carId);
  if (!car) throw new AppError(404, 'Car not found');
  if (car.type !== CAR_CATEGORIES.RENTAL) throw new AppError(400, 'This car is for sale, not rental');
  if (car.status === CAR_STATUS.MAINTENANCE || car.status === CAR_STATUS.SOLD || car.status === CAR_STATUS.UNAVAILABLE) {
    throw new AppError(400, `Car is currently ${car.status} and cannot be booked`);
  }

  // 2. Date Overlap Validation
  const available = await isCarAvailable(carId, requestedDates);
  if (!available) {
    throw new AppError(400, 'One or more of the selected dates are already booked');
  }
  
  // Sort dates to determine startDate and endDate for backward compatibility
  const sortedDates = [...requestedDates].sort((a, b) => new Date(a) - new Date(b));
  const startDate = sortedDates[0];
  const endDate = sortedDates[sortedDates.length - 1];

  // 3. Process Services & Calculate Total Price
  const totalDays = requestedDates.length;
  let finalServicePricePerDay = 0;
  let finalServicesArray = [];

  if (requestedServices && requestedServices.length > 0) {
    const serviceCalc = await serviceService.validateServicesAndCalculatePrice(requestedServices, car.category);
    finalServicePricePerDay = serviceCalc.totalServicePricePerDay;
    finalServicesArray = serviceCalc.processedServices;
  }

  const basePricePerDay = car.pricePerDay;
  const totalPrice = (basePricePerDay + finalServicePricePerDay) * totalDays;

  // 4. Create Booking
  try {
    const booking = await Booking.create({
      user,
      car: carId,
      services: finalServicesArray,
      startDate,
      endDate,
      dates: requestedDates,
      totalDays,
      totalPrice,
      pickupLocation,
      dropoffLocation,
      specialRequests,
    });
    return booking;
  } catch (error) {
    if (error.code === 11000) {
      throw new AppError(400, 'One or more of the selected dates have just been booked by someone else. Please try again.');
    }
    throw error;
  }
};

/**
 * Get all bookings with filtering and pagination
 */
const queryBookings = async (queryParams) => {
  const bookingsQuery = new QueryBuilder(Booking.find().populate('car', 'title brand images').populate('user', 'name email'), queryParams)
    .filter()
    .sort()
    .select()
    .paginate();

  const bookings = await bookingsQuery.modelQuery;
  
  const countQuery = new QueryBuilder(Booking.find(), queryParams).filter();
  const total = await countQuery.modelQuery.countDocuments();

  return { bookings, total };
};

/**
 * Cancel a booking safely
 */
const cancelBooking = async (bookingId, userId, userRole) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new AppError(404, 'Booking not found');

  // Verify ownership if not admin
  if (userRole !== 'admin' && booking.user.toString() !== userId.toString()) {
    throw new AppError(403, 'You are not authorized to cancel this booking');
  }

  // Cannot cancel completed, active or already cancelled
  if ([BOOKING_STATUS.COMPLETED, BOOKING_STATUS.CANCELLED, BOOKING_STATUS.ACTIVE].includes(booking.status)) {
    throw new AppError(400, `Cannot cancel a booking that is ${booking.status}`);
  }

  // In a real app with payments, we might trigger a refund checkout hit here before cancelling.
  booking.status = BOOKING_STATUS.CANCELLED;
  await booking.save();
  return booking;
};

const updateBookingStatus = async (bookingId, status) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new AppError(404, 'Booking not found');

  // Simple State Machine Validation
  const validTransitions = {
    [BOOKING_STATUS.PENDING]: [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.CANCELLED],
    [BOOKING_STATUS.CONFIRMED]: [BOOKING_STATUS.ACTIVE, BOOKING_STATUS.CANCELLED],
    [BOOKING_STATUS.ACTIVE]: [BOOKING_STATUS.COMPLETED, BOOKING_STATUS.CANCELLED],
    [BOOKING_STATUS.COMPLETED]: [],
    [BOOKING_STATUS.CANCELLED]: [],
  };

  if (!validTransitions[booking.status].includes(status)) {
    throw new AppError(400, `Invalid status transition from ${booking.status} to ${status}`);
  }

  booking.status = status;
  await booking.save();
  return booking;
};

module.exports = {
  createBooking,
  isCarAvailable,
  queryBookings,
  cancelBooking,
  updateBookingStatus,
  getCarAvailabilitySchedule,
};
