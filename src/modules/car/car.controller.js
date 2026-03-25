const carService = require('./car.service');
const bookingService = require('../booking/booking.service');
const catchAsync = require('../../shared/utils/catchAsync');
const responseHelper = require('../../shared/utils/response');
const { calculatePagination } = require('../../shared/utils/helpers');
const AppError = require('../../shared/utils/appError');

const createCar = catchAsync(async (req, res) => {
  const car = await carService.createCar(req.body, req.user._id);
  responseHelper(res, 201, 'Car created successfully', car);
});

const getCars = catchAsync(async (req, res) => {
  const query = { ...req.query };

  // Transform frontend-friendly filters to backend-supported QueryBuilder format
  if (query.minPrice) {
    const priceField = query.type === 'sale' ? 'salePrice' : 'pricePerDay';
    query[`${priceField}[gte]`] = query.minPrice;
    delete query.minPrice;
  }
  if (query.maxPrice) {
    const priceField = query.type === 'sale' ? 'salePrice' : 'pricePerDay';
    query[`${priceField}[lte]`] = query.maxPrice;
    delete query.maxPrice;
  }
  if (query.bodyType) {
    query.category = query.bodyType;
    delete query.bodyType;
  }
  if (query.transmission) {
    if (query.transmission.toLowerCase().startsWith('auto')) {
      query.transmission = 'Automatic';
    }
  }
  if (query.minYear) {
    query['year[gte]'] = query.minYear;
    delete query.minYear;
  }
  if (query.maxYear) {
    query['year[lte]'] = query.maxYear;
    delete query.maxYear;
  }
  if (query.minMileage) {
    query['mileage[gte]'] = query.minMileage;
    delete query.minMileage;
  }
  if (query.maxMileage) {
    query['mileage[lte]'] = query.maxMileage;
    delete query.maxMileage;
  }
  if (query.minSeats) {
    query['seatingCapacity[gte]'] = query.minSeats;
    delete query.minSeats;
  }

  const { cars, total } = await carService.queryCars(query);
  const meta = calculatePagination(total, query.page || 1, query.limit || 10);

  responseHelper(res, 200, 'Cars retrieved successfully', { pagination: meta, cars });
});

const getCar = catchAsync(async (req, res) => {
  const car = await carService.getCarById(req.params.carId);
  responseHelper(res, 200, 'Car retrieved successfully', car);
});

const updateCar = catchAsync(async (req, res) => {
  // Prevent mass assignment of sensitive fields like status, owner, etc.
  const forbiddenFields = ['status', 'owner', '_id', 'createdAt', 'updatedAt'];
  const updateBody = { ...req.body };
  forbiddenFields.forEach(field => delete updateBody[field]);

  const car = await carService.updateCarById(req.params.carId, updateBody);
  responseHelper(res, 200, 'Car updated successfully', car);
});

const updateCarStatus = catchAsync(async (req, res) => {
  const car = await carService.updateCarStatus(req.params.carId, req.body.status);
  responseHelper(res, 200, 'Car status updated successfully', car);
});

const deleteCar = catchAsync(async (req, res) => {
  await carService.deleteCarById(req.params.carId);
  responseHelper(res, 200, 'Car deleted (set to unavailable) successfully');
});

const uploadImage = catchAsync(async (req, res) => {
  if (!req.file) {
    throw new AppError(400, 'No image file provided');
  }
  const car = await carService.uploadCarImage(req.params.carId, req.file.buffer);
  responseHelper(res, 200, 'Image uploaded successfully', car);
});

const setPrimaryImage = catchAsync(async (req, res) => {
  const car = await carService.setPrimaryCarImage(req.params.carId, req.params.imageId);
  responseHelper(res, 200, 'Primary image updated successfully', car);
});

const deleteImage = catchAsync(async (req, res) => {
  const car = await carService.deleteCarImage(req.params.carId, req.params.imageId);
  responseHelper(res, 200, 'Image deleted successfully', car);
});

const getAvailability = catchAsync(async (req, res) => {
  const schedule = await bookingService.getCarAvailabilitySchedule(req.params.carId);
  responseHelper(res, 200, 'Car availability schedule retrieved', schedule);
});

module.exports = {
  createCar,
  getCars,
  getCar,
  updateCar,
  updateCarStatus,
  deleteCar,
  uploadImage,
  setPrimaryImage,
  deleteImage,
  getAvailability,
};
