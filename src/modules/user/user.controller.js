const userService = require('./user.service');
const catchAsync = require('../../shared/utils/catchAsync');
const responseHelper = require('../../shared/utils/response');

const { calculatePagination } = require('../../shared/utils/helpers');

const getUsers = catchAsync(async (req, res) => {
  const { users, total } = await userService.queryUsers(req.query);
  const meta = calculatePagination(total, req.query.page || 1, req.query.limit || 10);
  
  responseHelper(res, 200, 'Users retrieved successfully', { pagination: meta, users });
});

const getUser = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.params.userId);
  responseHelper(res, 200, 'User retrieved successfully', user);
});

const updateUser = catchAsync(async (req, res) => {
  const user = await userService.updateUserById(req.params.userId, req.body);
  responseHelper(res, 200, 'User updated successfully', user);
});

const deleteUser = catchAsync(async (req, res) => {
  await userService.deleteUserById(req.params.userId);
  responseHelper(res, 204, 'User deleted successfully'); // 204 typically has no JSON body, responseHelper handles null data dropping, but express strips body entirely for 204
});

module.exports = {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
};
