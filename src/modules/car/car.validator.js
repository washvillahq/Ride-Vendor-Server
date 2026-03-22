const Joi = require('joi');
const { CAR_TYPES, CAR_CATEGORIES, CAR_STATUS } = require('../../shared/constants');

const imageSchema = Joi.object().keys({
  url: Joi.string().required(),
  public_id: Joi.string().required(),
  isPrimary: Joi.boolean().default(false),
});

const createCar = {
  body: Joi.object().keys({
    title: Joi.string().required(),
    brand: Joi.string().required(),
    model: Joi.string().required(),
    year: Joi.number().integer().min(1990).max(new Date().getFullYear() + 1).required(),
    category: Joi.string().valid(...Object.values(CAR_TYPES)).required(),
    type: Joi.string().valid(...Object.values(CAR_CATEGORIES)).required(),
    pricePerDay: Joi.number().min(0).when('type', { is: CAR_CATEGORIES.RENTAL, then: Joi.required() }),
    salePrice: Joi.number().min(0).when('type', { is: CAR_CATEGORIES.SALE, then: Joi.required() }),
    location: Joi.string().required(),
    description: Joi.string().required(),
    features: Joi.array().items(Joi.string()),
    images: Joi.array().items(imageSchema).min(1).required(),
    status: Joi.string().valid(...Object.values(CAR_STATUS)),
    mileage: Joi.number().min(0),
    engine: Joi.string(),
    transmission: Joi.string().valid('Automatic', 'Manual', 'CVT'),
    fuelType: Joi.string().valid('Petrol', 'Diesel', 'Hybrid', 'Electric', 'Gas'),
    color: Joi.string(),
    condition: Joi.string(),
    seatingCapacity: Joi.number().min(1),
    doors: Joi.number().min(1),
    suitcases: Joi.number().min(0),
  }),
};

const getCars = {
  query: Joi.object().keys({
    type: Joi.string().valid(...Object.values(CAR_CATEGORIES)).allow('', null),
    category: Joi.string().valid(...Object.values(CAR_TYPES)).allow('', null),
    brand: Joi.string().allow('', null),
    location: Joi.string().allow('', null),
    status: Joi.string().valid(...Object.values(CAR_STATUS)).allow('', null),
    searchTerm: Joi.string().allow('', null),
    sort: Joi.string().allow('', null),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
    fields: Joi.string().allow('', null),
  }),
};

const getCar = {
  params: Joi.object().keys({
    carId: Joi.string().required(),
  }),
};

const updateCar = {
  params: Joi.object().keys({
    carId: Joi.required(),
  }),
  body: Joi.object()
    .keys({
      title: Joi.string(),
      brand: Joi.string(),
      model: Joi.string(),
      year: Joi.number().integer().min(1990).max(new Date().getFullYear() + 1),
      category: Joi.string().valid(...Object.values(CAR_TYPES)),
      type: Joi.string().valid(...Object.values(CAR_CATEGORIES)),
      pricePerDay: Joi.number().min(0),
      salePrice: Joi.number().min(0),
      location: Joi.string(),
      description: Joi.string(),
      features: Joi.array().items(Joi.string()),
      images: Joi.array().items(imageSchema),
      status: Joi.string().valid(...Object.values(CAR_STATUS)),
      mileage: Joi.number().min(0),
      engine: Joi.string(),
      transmission: Joi.string().valid('Automatic', 'Manual', 'CVT'),
      fuelType: Joi.string().valid('Petrol', 'Diesel', 'Hybrid', 'Electric', 'Gas'),
      color: Joi.string(),
      condition: Joi.string(),
      seatingCapacity: Joi.number().min(1),
      doors: Joi.number().min(1),
      suitcases: Joi.number().min(0),
    })
    .min(1),
};

const updateCarStatus = {
  params: Joi.object().keys({
    carId: Joi.required(),
  }),
  body: Joi.object().keys({
    status: Joi.string().valid(...Object.values(CAR_STATUS)).required(),
  }),
};

const deleteCar = {
  params: Joi.object().keys({
    carId: Joi.string().required(),
  }),
};

module.exports = {
  createCar,
  getCars,
  getCar,
  updateCar,
  updateCarStatus,
  deleteCar,
};
