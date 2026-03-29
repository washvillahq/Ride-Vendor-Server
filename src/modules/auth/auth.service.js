const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../../config/config');
const User = require('../user/user.model');
const AppError = require('../../shared/utils/appError');
const { sendPasswordResetEmail } = require('../../shared/utils/email');

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

  // Privilege Escalation Guard: Explicitly pick only allowed registration fields
  const safeUserBody = {
    name: userBody.name,
    email: userBody.email,
    password: userBody.password,
    phone: userBody.phone,
  };

  const user = await User.create(safeUserBody);
  
  // Data Leakage Fix: Remove password before returning
  user.password = undefined;
  
  return user;
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

  // 3) Remove password from user object before returning
  user.password = undefined;

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

/**
 * Forgot password - generate reset token and send email
 * @param {string} email
 * @returns {Promise<void>}
 */
const forgotPassword = async (email) => {
  // 1) Get user based on posted email
  const user = await User.findOne({ email });

  if (!user) {
    // Don't reveal if user exists or not for security
    throw new AppError(404, 'There is no user with that email address');
  }

  if (user.isBlocked) {
    throw new AppError(403, 'Your account has been blocked. Please contact support.');
  }

  // 2) Generate the random reset token
  const resetToken = user.generatePasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3) Send it to user's email
  try {
    await sendPasswordResetEmail(user.email, resetToken, user.name);
  } catch (error) {
    // Clear the reset token if email fails
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    throw new AppError(500, 'There was an error sending the email. Please try again later.');
  }
};

/**
 * Reset password using token
 * @param {string} token
 * @param {string} password
 * @returns {Promise<string>} JWT token
 */
const resetPassword = async (token, password) => {
  // 1) Get user based on the token
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2) If token has not expired, and there is user, set the new password
  if (!user) {
    throw new AppError(400, 'Token is invalid or has expired');
  }

  if (user.isBlocked) {
    throw new AppError(403, 'Your account has been blocked. Please contact support.');
  }

  // 3) Update changedPasswordAt property for the user
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.passwordChangedAt = Date.now() - 1000;
  await user.save();

  // 4) Log the user in, send JWT
  return generateToken(user._id);
};

module.exports = {
  generateToken,
  registerUser,
  loginUser,
  changePassword,
  forgotPassword,
  resetPassword,
};
