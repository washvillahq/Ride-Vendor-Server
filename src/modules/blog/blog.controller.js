const catchAsync = require('../../shared/utils/catchAsync');
const responseHelper = require('../../shared/utils/response');
const { calculatePagination } = require('../../shared/utils/helpers');
const blogService = require('./blog.service');
const cloudinaryHelper = require('../../shared/utils/cloudinary');
const AppError = require('../../shared/utils/appError');

const createPost = catchAsync(async (req, res) => {
  const post = await blogService.createPost(req.body);
  responseHelper(res, 201, 'Blog post created successfully', post);
});

const getPosts = catchAsync(async (req, res) => {
  const includeDrafts = Boolean(req.user && req.user.role === 'admin');
  const { posts, total } = await blogService.queryPosts(req.query, includeDrafts);
  const meta = calculatePagination(total, req.query.page || 1, req.query.limit || 10);
  responseHelper(res, 200, 'Blog posts retrieved successfully', { pagination: meta, posts });
});

const getAdminPosts = catchAsync(async (req, res) => {
  const { posts, total } = await blogService.queryPosts(req.query, true);
  const meta = calculatePagination(total, req.query.page || 1, req.query.limit || 10);
  responseHelper(res, 200, 'Admin blog posts retrieved successfully', { pagination: meta, posts });
});

const getPostBySlug = catchAsync(async (req, res) => {
  const includeDraft = Boolean(req.user && req.user.role === 'admin');
  const post = await blogService.getPostBySlug(req.params.slug, includeDraft);
  responseHelper(res, 200, 'Blog post retrieved successfully', post);
});

const updatePost = catchAsync(async (req, res) => {
  const post = await blogService.updatePostById(req.params.postId, req.body);
  responseHelper(res, 200, 'Blog post updated successfully', post);
});

const deletePost = catchAsync(async (req, res) => {
  await blogService.deletePostById(req.params.postId);
  responseHelper(res, 200, 'Blog post deleted successfully');
});

const uploadImage = catchAsync(async (req, res) => {
  if (!req.file) {
    throw new AppError(400, 'No image file provided');
  }

  const result = await cloudinaryHelper.uploadImageBuffer(req.file.buffer, 'ridevendor/blog');
  responseHelper(res, 200, 'Image uploaded successfully', {
    url: result.secure_url,
    publicId: result.public_id,
  });
});

module.exports = {
  createPost,
  getPosts,
  getAdminPosts,
  getPostBySlug,
  updatePost,
  deletePost,
  uploadImage,
};
