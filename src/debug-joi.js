const Joi = require('joi');

const imageSchema = Joi.object().keys({
  url: Joi.string().required(),
  public_id: Joi.string().required(),
  isPrimary: Joi.boolean().default(false),
});

const createCar = Joi.object().keys({
  title: Joi.string().required(),
  brand: Joi.string().required(),
  model: Joi.string().required(),
  year: Joi.number().integer().required(),
  category: Joi.string().required(),
  type: Joi.string().required(),
  pricePerDay: Joi.number().min(0),
  location: Joi.string().required(),
  description: Joi.string().required(),
  images: Joi.array().items(imageSchema).min(1).required(),
});

const payload = {
  title: 'Test Car',
  brand: 'Toyota',
  model: 'Camry',
  year: 2023,
  category: 'Sedan',
  type: 'rental',
  pricePerDay: 50,
  location: 'Test City',
  description: 'A great test car.',
  images: [{ url: 'http://test.com/img.jpg', public_id: 'test_id', isPrimary: true }]
};

const { error } = createCar.validate(payload);
if (error) {
  console.log('Error:', error.details[0].message);
} else {
  console.log('Success!');
}
