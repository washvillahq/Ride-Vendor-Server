const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const config = require('../../config/config');

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

/**
 * Upload an image buffer to Cloudinary
 * @param {Buffer} buffer 
 * @param {string} folder 
 * @returns {Promise<Object>}
 */
const uploadImageBuffer = (buffer, folder = 'ridevendor') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

/**
 * Delete an image from Cloudinary by its public ID
 * @param {string} publicId 
 * @returns {Promise<Object>}
 */
const deleteImage = async (publicId) => {
  return await cloudinary.uploader.destroy(publicId);
};

module.exports = {
  uploadImageBuffer,
  deleteImage,
};
