const mongoose = require('mongoose');
const httpStatus = require('http-status'); // We might need to map errors or just use standard codes. We will use AppError.
const AppError = require('../utils/appError');
const responseHelper = require('../utils/response');
const config = require('../../config/config');

// We will map simple error messages. If we had winston logger, we would use it here.
const errorConverter = (err, req, res, next) => {
  let error = err;
  
  if (!(error instanceof AppError)) {
    console.log('--- CONVERTING ERROR ---');
    console.log('Type:', error.constructor.name);
    console.log('Is Mongoose Error:', error instanceof mongoose.Error);
    
    const statusCode =
      error.statusCode || (error instanceof mongoose.Error ? 400 : 500);
    const message = error.message || 'Internal Server Error';
    error = new AppError(statusCode, message, false, err.stack);
  }
  next(error);
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let { statusCode, message } = err;
  if (config.env === 'production' && !err.isOperational) {
    statusCode = 500;
    message = 'Internal Server Error';
  }

  res.locals.errorMessage = err.message;

  const response = {
    status: err.status || 'error',
    message,
    ...(config.env === 'development' && { stack: err.stack }),
  };

  if (config.env === 'development') {
    console.error('--- FULL ERROR LOG ---');
    console.error(err);
    if (err.stack) console.error(err.stack);
  }

  res.status(statusCode).json(response);
};

module.exports = {
  errorConverter,
  errorHandler,
};
