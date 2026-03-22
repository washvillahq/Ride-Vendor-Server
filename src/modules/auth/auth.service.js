const jwt = require('jsonwebtoken');
const config = require('../../config/config');
const User = require('../user/user.model');
const AppError = require('../../shared/utils/appError');

/**
 * Generate JWT token
 * @param {ObjectId} userId 
 * @returns {string} 
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, config.jwt.secret, {
    expiresIn: `${config.jwt.accessExpirationMinutes}m`, // dynamic expiry from config
  });
};

/**
 * Register a user
 * @param {Object} userBody 
 * @returns {Promise<User>}
 */
const registerUser = async (userBody) => {
  if (await User.findOne({ email: userBody.email })) {
    throw new AppError(400, 'Email already in use');
  }
  return User.create(userBody);
};

/**
 * Login user with email and password
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<Object>} Object containing user and tokens
 */
const loginUser = async (email, password) => {
  // 1) Verify user exists and password is correct
  const user = await User.findOne({ email }).select('+password');
  
  if (!user || !(await user.correctPassword(password, user.password))) {
    throw new AppError(401, 'Incorrect email or password');
  }
  
  if (user.isBlocked) {
    throw new AppError(403, 'Your account has been blocked. Please contact support.');
  }

  // Update last login
  user.lastLoginAt = Date.now();
  await user.save({ validateBeforeSave: false });

  // 2) Generate token
  const token = generateToken(user._id);

  return { user, token };
};

/**
 * Change password
 * @param {ObjectId} userId 
 * @param {string} passwordCurrent 
 * @param {string} password 
 */
const changePassword = async (userId, passwordCurrent, password) => {
  // 1) Get user and include password selection
  const user = await User.findById(userId).select('+password');

  // 2) Check if current password is correct
  if (!(await user.correctPassword(passwordCurrent, user.password))) {
    throw new AppError(401, 'Your current password is wrong');
  }

  // 3) Update password (the pre-save hook will hash it)
  user.password = password;
  user.passwordChangedAt = Date.now() - 1000; // Subtract 1 second to ensure it is always before JWT timestamp
  await user.save();
  
  return generateToken(user._id);
};

module.exports = {
  generateToken,
  registerUser,
  loginUser,
  changePassword,
};
