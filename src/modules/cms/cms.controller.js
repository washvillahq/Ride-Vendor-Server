const catchAsync = require('../../shared/utils/catchAsync');
const responseHelper = require('../../shared/utils/response');
const { calculatePagination } = require('../../shared/utils/helpers');
const cmsService = require('./cms.service');

const createPage = catchAsync(async (req, res) => {
  const page = await cmsService.createPage(req.body);
  responseHelper(res, 201, 'Page created successfully', page);
});

const getPages = catchAsync(async (req, res) => {
  const includeDrafts = Boolean(req.user && req.user.role === 'admin');
  const { pages, total } = await cmsService.queryPages(req.query, includeDrafts);
  const meta = calculatePagination(total, req.query.page || 1, req.query.limit || 10);
  responseHelper(res, 200, 'Pages retrieved successfully', { pagination: meta, pages });
});

const getPagesAdmin = catchAsync(async (req, res) => {
  const { pages, total } = await cmsService.queryPages(req.query, true);
  const meta = calculatePagination(total, req.query.page || 1, req.query.limit || 10);
  responseHelper(res, 200, 'Admin pages retrieved successfully', { pagination: meta, pages });
});

const getPageBySlug = catchAsync(async (req, res) => {
  const includeDraft = Boolean(req.user && req.user.role === 'admin');
  const page = await cmsService.getPageBySlug(req.params.slug, includeDraft);
  responseHelper(res, 200, 'Page retrieved successfully', page);
});

const updatePage = catchAsync(async (req, res) => {
  const page = await cmsService.updatePageById(req.params.pageId, req.body);
  responseHelper(res, 200, 'Page updated successfully', page);
});

const deletePage = catchAsync(async (req, res) => {
  await cmsService.deletePageById(req.params.pageId);
  responseHelper(res, 200, 'Page deleted successfully');
});

const submitContact = catchAsync(async (req, res) => {
  const submission = await cmsService.createContactSubmission(req.body);
  responseHelper(res, 201, 'Contact form submitted successfully', submission);
});

const getContactSubmissions = catchAsync(async (req, res) => {
  const { submissions, total } = await cmsService.queryContactSubmissions(req.query);
  const meta = calculatePagination(total, req.query.page || 1, req.query.limit || 10);
  responseHelper(res, 200, 'Contact submissions retrieved successfully', { pagination: meta, submissions });
});

const updateContactSubmission = catchAsync(async (req, res) => {
  const submission = await cmsService.updateContactSubmissionById(req.params.submissionId, req.body);
  responseHelper(res, 200, 'Contact submission updated successfully', submission);
});

const getGlobalSeoSettings = catchAsync(async (req, res) => {
  const settings = await cmsService.getGlobalSeoSettings();
  responseHelper(res, 200, 'Global SEO settings retrieved successfully', settings);
});

const updateGlobalSeoSettings = catchAsync(async (req, res) => {
  const settings = await cmsService.updateGlobalSeoSettings(req.body);
  responseHelper(res, 200, 'Global SEO settings updated successfully', settings);
});

module.exports = {
  createPage,
  getPages,
  getPagesAdmin,
  getPageBySlug,
  updatePage,
  deletePage,
  submitContact,
  getContactSubmissions,
  updateContactSubmission,
  getGlobalSeoSettings,
  updateGlobalSeoSettings,
};
