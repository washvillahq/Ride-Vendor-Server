const authService = require('./auth.service');
const catchAsync = require('../../shared/utils/catchAsync');
const responseHelper = require('../../shared/utils/response');
const config = require('../../config/config');
const { ROLES } = require('../../shared/constants');

const createSendToken = (user, token, statusCode, res, message) => {
  // Optional HTTP-only cookie support as requested
  const cookieOptions = {
    expires: new Date(
      Date.now() + config.jwt.cookieExpiresIn * 60 * 1000
    ),
    httpOnly: true,
  };
  if (config.env === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  // Remove password from output if exists (though handled in model schema too)
  user.password = undefined;

  responseHelper(res, statusCode, message, {
    token,
    user,
  });
};

const register = catchAsync(async (req, res) => {
  // Defensive field picking to prevent mass assignment of 'role', 'isBlocked', etc.
  const userBody = {
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    phone: req.body.phone,
    role: ROLES.USER, // Explicitly force 'user' role for all self-registrations
  };

  const user = await authService.registerUser(userBody);
  const token = authService.generateToken(user._id);
  createSendToken(user, token, 201, res, 'User registered successfully');
});


const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const { user, token } = await authService.loginUser(email, password);
  createSendToken(user, token, 200, res, 'Login successful');
});

const getMe = catchAsync(async (req, res) => {
  responseHelper(res, 200, 'User data retrieved', { user: req.user });
});

const changePassword = catchAsync(async (req, res) => {
  const token = await authService.changePassword(
    req.user._id,
    req.body.passwordCurrent,
    req.body.password
  );
  createSendToken(req.user, token, 200, res, 'Password updated successfully');
});

const logout = catchAsync(async (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000), // expires in 10 seconds
    httpOnly: true,
  });
  responseHelper(res, 200, 'Logged out successfully');
});

module.exports = {
  register,
  login,
  getMe,
  changePassword,
  logout
};
