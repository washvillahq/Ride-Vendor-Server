const AppError = require('../utils/appError');

/**
 * Middleware that restricts route access to specific roles.
 * Must be used AFTER the `protect` middleware which sets `req.user`.
 * 
 * @param  {...string} roles - Array of allowed roles (e.g. 'admin', 'user')
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    // req.user is guaranteed to exist if this runs after `protect`
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new AppError(403, 'You do not have permission to perform this action')
      );
    }
    next();
  };
};

/**
 * Reusable ownership check. Ensures that a user only modifies documents they own,
 * unless they are an admin.
 * 
 * @param {Object} documentOwnerId - The ObjectId of the document owner
 * @param {Object} reqUser - The authorized req.user object
 */
const checkOwnership = (documentOwnerId, reqUser) => {
  if (reqUser.role !== 'admin' && documentOwnerId.toString() !== reqUser._id.toString()) {
    throw new AppError(403, 'You are not authorized to modify this resource');
  }
};

module.exports = { restrictTo, checkOwnership };
