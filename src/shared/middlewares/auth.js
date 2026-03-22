const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const config = require('../../config/config');
const User = require('../../modules/user/user.model');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

const protect = catchAsync(async (req, res, next) => {
  let token;

  // 1) Checking if token exists in header or cookies
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError(401, 'You are not logged in! Please log in to get access.')
    );
  }

  // 2) Verification of token
  const decoded = await promisify(jwt.verify)(token, config.jwt.secret);

  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(
        401,
        'The user belonging to this token does no longer exist.'
      )
    );
  }

  // 4) Check if user is blocked or inactive
  if (currentUser.isBlocked) {
    return next(new AppError(403, 'Your account has been blocked. Please contact support.'));
  }
  
  // 5) Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError(401, 'User recently changed password! Please log in again.')
    );
  }

  // Grant access to protected route
  req.user = currentUser;
  next();
});

module.exports = { protect };
