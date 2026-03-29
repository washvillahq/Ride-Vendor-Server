const QueryBuilder = require('../../shared/utils/QueryBuilder');
const AppError = require('../../shared/utils/appError');
const { Page, ContactSubmission, SeoSetting } = require('./cms.model');

const createPage = async (payload) => Page.create(payload);

const queryPages = async (queryParams, includeDrafts = false) => {
  const filters = { ...queryParams };
  if (!includeDrafts) {
    filters.isPublished = true;
  }

  const pagesQuery = new QueryBuilder(Page.find(), filters)
    .filter()
    .sort()
    .select()
    .paginate();

  const pages = await pagesQuery.modelQuery;
  const countQuery = new QueryBuilder(Page.find(), filters).filter();
  const total = await countQuery.modelQuery.countDocuments();

  return { pages, total };
};

const getPageBySlug = async (slug, includeDraft = false) => {
  const query = { slug: slug.toLowerCase() };
  if (!includeDraft) {
    query.isPublished = true;
  }

  const page = await Page.findOne(query);
  if (!page) {
    throw new AppError(404, 'Page not found');
  }

  return page;
};

const getPageById = async (id) => {
  const page = await Page.findById(id);
  if (!page) {
    throw new AppError(404, 'Page not found');
  }
  return page;
};

const updatePageById = async (id, payload) => {
  const page = await getPageById(id);
  Object.assign(page, payload);
  await page.save();
  return page;
};

const deletePageById = async (id) => {
  const page = await getPageById(id);
  await page.deleteOne();
  return page;
};

const createContactSubmission = async (payload) => ContactSubmission.create(payload);

const queryContactSubmissions = async (queryParams) => {
  const submissionsQuery = new QueryBuilder(ContactSubmission.find(), queryParams)
    .filter()
    .sort()
    .select()
    .paginate();

  const submissions = await submissionsQuery.modelQuery;
  const countQuery = new QueryBuilder(ContactSubmission.find(), queryParams).filter();
  const total = await countQuery.modelQuery.countDocuments();

  return { submissions, total };
};

const updateContactSubmissionById = async (id, payload) => {
  const submission = await ContactSubmission.findById(id);
  if (!submission) {
    throw new AppError(404, 'Contact submission not found');
  }

  Object.assign(submission, payload);
  await submission.save();
  return submission;
};

const getGlobalSeoSettings = async () => {
  let settings = await SeoSetting.findOne({ key: 'global' });

  if (!settings) {
    settings = await SeoSetting.create({ key: 'global' });
  }

  return settings;
};

const updateGlobalSeoSettings = async (payload) => {
  const settings = await getGlobalSeoSettings();
  Object.assign(settings, payload);
  await settings.save();
  return settings;
};

module.exports = {
  createPage,
  queryPages,
  getPageBySlug,
  getPageById,
  updatePageById,
  deletePageById,
  createContactSubmission,
  queryContactSubmissions,
  updateContactSubmissionById,
  getGlobalSeoSettings,
  updateGlobalSeoSettings,
};
