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
  const { cars, total } = await carService.queryCars(req.query);
  const meta = calculatePagination(total, req.query.page || 1, req.query.limit || 10);
  
  responseHelper(res, 200, 'Cars retrieved successfully', { pagination: meta, cars });
});

const getCar = catchAsync(async (req, res) => {
  const car = await carService.getCarById(req.params.carId);
  responseHelper(res, 200, 'Car retrieved successfully', car);
});

const updateCar = catchAsync(async (req, res) => {
  const car = await carService.updateCarById(req.params.carId, req.body);
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
