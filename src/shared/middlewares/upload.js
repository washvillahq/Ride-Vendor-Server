const multer = require('multer');
const AppError = require('../utils/appError');

// Store file in memory to securely pipe it directly to Cloudinary without writing to disk
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError(400, 'Not an image! Please upload only images.'), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    fields: 10, // Max 10 non-file fields
    parts: 20, // Max 20 parts total (fields + files)
  },
});

module.exports = upload;
