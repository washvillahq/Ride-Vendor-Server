require('dotenv').config();
const Joi = require('joi');

const envVarsSchema = Joi.object()
  .keys({
    NODE_ENV: Joi.string().valid('production', 'development', 'test').required(),
    PORT: Joi.number().default(3000),
    CLIENT_URL: Joi.string().default('http://localhost:5173').description('Frontend URL for CORS'),
    MONGODB_URI: Joi.string().required().description('Mongo DB url'),
    JWT_SECRET: Joi.string().required().description('JWT secret key'),
    JWT_ACCESS_EXPIRATION_MINUTES: Joi.number().default(30).description('minutes after which access tokens expire'),
    JWT_COOKIE_EXPIRES_IN: Joi.number().default(30).description('minutes after which jwt cookies expire'),
    CLOUDINARY_CLOUD_NAME: Joi.string().required().description('Cloudinary cloud name'),
    CLOUDINARY_API_KEY: Joi.string().required().description('Cloudinary API key'),
    CLOUDINARY_API_SECRET: Joi.string().required().description('Cloudinary API secret'),
    PAYSTACK_SECRET_KEY: Joi.string().required().description('Paystack secret key'),
    CORS_ORIGIN: Joi.string().default('*').description('Allowed CORS origin'),
    RATE_LIMIT_MAX: Joi.number().default(100).description('Max requests per IP window'),
    COOKIE_SECURE: Joi.boolean().default(false).description('Whether secure flag should be set on cookies'),
    LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly').default('info'),
  })
  .unknown();

const { value: envVars, error } = envVarsSchema.prefs({ errors: { label: 'key' } }).validate(process.env);

if (error) {
  console.warn(`Config validation error: ${error.message}`);
}

module.exports = {
  env: envVars?.NODE_ENV || 'development',
  port: envVars?.PORT || 3000,
  clientUrl: envVars?.CLIENT_URL || 'http://localhost:5173',
  mongoose: {
    url: envVars?.MONGODB_URI || 'mongodb://127.0.0.1:27017/ridevendor',
    options: {},
  },
  jwt: {
    secret: envVars?.JWT_SECRET || 'thisisasamplesecret',
    accessExpirationMinutes: envVars?.JWT_ACCESS_EXPIRATION_MINUTES || 30,
    cookieExpiresIn: envVars?.JWT_COOKIE_EXPIRES_IN || 30,
  },
  cloudinary: {
    cloudName: envVars?.CLOUDINARY_CLOUD_NAME,
    apiKey: envVars?.CLOUDINARY_API_KEY,
    apiSecret: envVars?.CLOUDINARY_API_SECRET,
  },
  paystack: {
    secretKey: envVars?.PAYSTACK_SECRET_KEY,
  },
  security: {
    corsOrigin: envVars?.CORS_ORIGIN,
    rateLimitMax: envVars?.RATE_LIMIT_MAX,
    cookieSecure: envVars?.COOKIE_SECURE,
  },
  logging: {
    level: envVars?.LOG_LEVEL,
  }
};
