const express = require('express');
const blogController = require('./blog.controller');
const blogValidation = require('./blog.validator');
const validate = require('../../shared/middlewares/validate');
const { protect } = require('../../shared/middlewares/auth');
const { restrictTo } = require('../../shared/middlewares/rbac');
const { ROLES } = require('../../shared/constants');
const upload = require('../../shared/middlewares/upload');

const router = express.Router();

router.route('/posts').get(validate(blogValidation.getPosts), blogController.getPosts);
router.route('/posts/:slug').get(validate(blogValidation.getPostBySlug), blogController.getPostBySlug);

router.use(protect);
router.use(restrictTo(ROLES.ADMIN));

router.route('/admin/posts').get(validate(blogValidation.getPosts), blogController.getAdminPosts);
router.route('/posts').post(validate(blogValidation.createPost), blogController.createPost);
router
  .route('/posts/id/:postId')
  .patch(validate(blogValidation.updatePost), blogController.updatePost)
  .delete(validate(blogValidation.deletePost), blogController.deletePost);

router
  .route('/upload-image')
  .post(upload.single('image'), blogController.uploadImage);

module.exports = router;
