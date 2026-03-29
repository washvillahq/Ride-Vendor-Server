const express = require('express');
const cmsController = require('./cms.controller');
const cmsValidation = require('./cms.validator');
const validate = require('../../shared/middlewares/validate');
const { protect } = require('../../shared/middlewares/auth');
const { restrictTo } = require('../../shared/middlewares/rbac');
const { ROLES } = require('../../shared/constants');
const upload = require('../../shared/middlewares/upload');

const router = express.Router();

router
  .route('/pages')
  .get(validate(cmsValidation.getPages), cmsController.getPages);

router
  .route('/pages/:slug')
  .get(validate(cmsValidation.getPageBySlug), cmsController.getPageBySlug);

router
  .route('/contact')
  .post(validate(cmsValidation.submitContact), cmsController.submitContact);

router
  .route('/seo-settings')
  .get(validate(cmsValidation.getGlobalSeoSettings), cmsController.getGlobalSeoSettings);

router.use(protect);
router.use(restrictTo(ROLES.ADMIN));

router
  .route('/pages')
  .post(validate(cmsValidation.createPage), cmsController.createPage);

router
  .route('/admin/pages')
  .get(validate(cmsValidation.getPages), cmsController.getPagesAdmin);

router
  .route('/pages/id/:pageId')
  .patch(validate(cmsValidation.updatePage), cmsController.updatePage)
  .delete(validate(cmsValidation.deletePage), cmsController.deletePage);

router
  .route('/contact')
  .get(validate(cmsValidation.getContactSubmissions), cmsController.getContactSubmissions);

router
  .route('/contact/:submissionId')
  .patch(validate(cmsValidation.updateContactSubmission), cmsController.updateContactSubmission);

router
  .route('/seo-settings')
  .patch(validate(cmsValidation.updateGlobalSeoSettings), cmsController.updateGlobalSeoSettings);

router
  .route('/upload-image')
  .post(upload.single('image'), cmsController.uploadImage);

router
  .route('/static-seo-target')
  .post(validate(cmsValidation.createStaticSeoTarget), cmsController.createStaticSeoTarget);

module.exports = router;
