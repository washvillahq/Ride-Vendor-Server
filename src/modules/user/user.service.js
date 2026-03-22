const User = require('./user.model');
const QueryBuilder = require('../../shared/utils/QueryBuilder');
const AppError = require('../../shared/utils/appError');

/**
 * Get all users with query builder support
 * @param {Object} queryParams 
 * @returns {Promise<User[]>}
 */
const queryUsers = async (queryParams) => {
  const usersQuery = new QueryBuilder(User.find(), queryParams)
    .filter()
    .search(['name', 'email'])
    .sort()
    .select()
    .paginate();

  const users = await usersQuery.modelQuery;
  const total = await User.countDocuments(usersQuery.modelQuery._conditions);

  return { users, total };
};

/**
 * Get user by id
 * @param {ObjectId} id 
 * @returns {Promise<User>}
 */
const getUserById = async (id) => {
  const user = await User.findById(id);
  if (!user) {
    throw new AppError(404, 'User not found');
  }
  return user;
};

/**
 * Update user by id
 * @param {ObjectId} userId 
 * @param {Object} updateBody 
 * @returns {Promise<User>}
 */
const updateUserById = async (userId, updateBody) => {
  const user = await getUserById(userId);

  if (updateBody.email && (await User.isEmailTaken(updateBody.email, userId))) {
    throw new AppError(400, 'Email already taken');
  }

  Object.assign(user, updateBody);
  await user.save();
  return user;
};

/**
 * Soft delete or hard delete user
 * @param {ObjectId} userId 
 * @returns {Promise<User>}
 */
const deleteUserById = async (userId) => {
  const user = await getUserById(userId);
  user.active = false; // Soft delete
  await user.save({ validateBeforeSave: false });
  return user;
};

module.exports = {
  queryUsers,
  getUserById,
  updateUserById,
  deleteUserById,
};
