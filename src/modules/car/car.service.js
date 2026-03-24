const Car = require('./car.model');
const QueryBuilder = require('../../shared/utils/QueryBuilder');
const AppError = require('../../shared/utils/appError');
const cloudinaryHelper = require('../../shared/utils/cloudinary');
const { CAR_STATUS } = require('../../shared/constants');

/**
 * Create a new car
 * @param {Object} carBody 
 * @param {ObjectId} adminId 
 * @returns {Promise<Car>}
 */
const createCar = async (carBody, adminId) => {
  return Car.create({ ...carBody, createdBy: adminId });
};

/**
 * Get all cars with filtering and pagination
 * @param {Object} queryParams 
 * @returns {Promise<Object>} { cars, total }
 */
const queryCars = async (queryParams) => {
  const carsQuery = new QueryBuilder(Car.find(), queryParams)
    .filter()
    .search(['title', 'brand', 'model'])
    .sort()
    .select()
    .paginate();

  const cars = await carsQuery.modelQuery;
  
  // Calculate total for pagination
  const countQuery = new QueryBuilder(Car.find(), queryParams).filter().search(['title', 'brand', 'model']);
  const total = await countQuery.modelQuery.countDocuments();

  return { cars, total };
};

/**
 * Get car by ID
 * @param {ObjectId} carId 
 * @returns {Promise<Car>}
 */
const getCarById = async (carId) => {
  const car = await Car.findById(carId);
  if (!car) {
    throw new AppError(404, 'Car not found');
  }
  return car;
};

/**
 * Update car details
 * @param {ObjectId} carId 
 * @param {Object} updateBody 
 * @returns {Promise<Car>}
 */
const updateCarById = async (carId, updateBody) => {
  const car = await getCarById(carId);

  // Note: if type is changed, make sure prices validate. Model validators handle this.
  Object.assign(car, updateBody);
  await car.save();
  return car;
};

/**
 * Update car status explicitly
 * @param {ObjectId} carId 
 * @param {string} status 
 * @returns {Promise<Car>}
 */
const updateCarStatus = async (carId, status) => {
  const car = await Car.findByIdAndUpdate(
    carId, 
    { $set: { status } },
    { new: true, runValidators: true }
  );
  if (!car) throw new AppError(404, 'Car not found');
  return car;
};

/**
 * Soft delete car (sets to inactive/unavailable)
 * @param {ObjectId} carId 
 * @returns {Promise<Car>}
 */
const deleteCarById = async (carId) => {
  const car = await getCarById(carId);
  car.status = CAR_STATUS.UNAVAILABLE;
  await car.save();
  return car;
};

/**
 * Upload an image for a car
 */
const uploadCarImage = async (carId, fileBuffer) => {
  const car = await getCarById(carId);
  
  // 1. Max images rule (e.g. 10 images)
  if (car.images && car.images.length >= 10) {
    throw new AppError(400, 'Maximum of 10 images allowed per car');
  }

  // 2. Upload to Cloudinary
  const result = await cloudinaryHelper.uploadImageBuffer(fileBuffer, `ridevendor/cars/${carId}`);
  
  try {
    const isFirstImage = car.images.length === 0;
    car.images.push({
      url: result.secure_url,
      public_id: result.public_id,
      isPrimary: isFirstImage,
    });

    await car.save();
    return car;
  } catch (error) {
    // 3. CLEANUP: If DB save fails, delete the orphan image from Cloudinary
    await cloudinaryHelper.deleteImage(result.public_id);
    throw error;
  }
};

/**
 * Set a car image as primary
 */
const setPrimaryCarImage = async (carId, imageId) => {
  const car = await getCarById(carId);

  const imageExists = car.images.some(img => img._id.toString() === imageId.toString());
  if (!imageExists) throw new AppError(404, 'Image not found on this car');

  // Unset all and set the target to primary
  car.images.forEach((img) => {
    img.isPrimary = img._id.toString() === imageId.toString();
  });

  await car.save();
  return car;
};

/**
 * Delete a car image
 */
const deleteCarImage = async (carId, imageId) => {
  const car = await getCarById(carId);
  
  const imageIndex = car.images.findIndex(img => img._id.toString() === imageId.toString());
  if (imageIndex === -1) throw new AppError(404, 'Image not found');

  const targetImage = car.images[imageIndex];
  
  // Remove from Cloudinary
  await cloudinaryHelper.deleteImage(targetImage.public_id);
  
  // Remove from array
  car.images.splice(imageIndex, 1);

  // If deleted the primary image, promote another one
  if (targetImage.isPrimary && car.images.length > 0) {
    car.images[0].isPrimary = true;
  }

  await car.save();
  return car;
};

module.exports = {
  createCar,
  queryCars,
  getCarById,
  updateCarById,
  updateCarStatus,
  deleteCarById,
  uploadCarImage,
  setPrimaryCarImage,
  deleteCarImage,
};
