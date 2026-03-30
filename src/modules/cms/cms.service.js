const QueryBuilder = require('../../shared/utils/QueryBuilder');
const AppError = require('../../shared/utils/appError');
const { Page, ContactSubmission, SeoSetting } = require('./cms.model');

const RESERVED_SLUGS = new Set([
  'login',
  'register',
  'forgot-password',
  'reset-password',
  'dashboard',
  'admin',
  'api',
  'cars',
  'car-hire',
  'car-sales',
  'payment-success',
  'unauthorized',
]);

const STATIC_PAGES = [
  { 
    slug: 'home', 
    title: 'Home',
    metaTitle: 'Car Hire, Car Sales & Auto Services in Ilorin',
    metaDescription: 'Buy, hire, lease, and manage vehicles with ease. Ride Vendor provides trusted car hire, car sales, and logistics services for individuals and businesses in Ilorin.',
  },
  { slug: 'about', title: 'About' },
  { slug: 'services', title: 'Services' },
  { slug: 'contact', title: 'Contact' },
  { slug: 'shop', title: 'Shop' },
  { slug: 'car-sales', title: 'Car Sales' },
  { slug: 'car-hire', title: 'Car Hire' },
  { slug: 'blog', title: 'Blog' },
  { slug: '404', title: 'Page Not Found' },
  { slug: 'unauthorized', title: 'Unauthorized' },
];

const SEO_EDITABLE_FIELDS = [
  'metaTitle',
  'metaDescription',
  'focusKeyword',
  'canonicalUrl',
  'ogImage',
  'robotsDirective',
  'isPublished',
  'status',
  'title',
];

const normalizeSlug = (value = '') => value.toLowerCase().trim();

const assertSlugAllowed = async (slug, ignoreId) => {
  const normalizedSlug = normalizeSlug(slug);

  if (!normalizedSlug) {
    throw new AppError(400, 'Slug is required');
  }

  if (RESERVED_SLUGS.has(normalizedSlug)) {
    throw new AppError(400, 'This slug is reserved and cannot be used');
  }

  const existing = await Page.findOne({ slug: normalizedSlug });
  if (existing && String(existing._id) !== String(ignoreId || '')) {
    throw new AppError(400, 'Slug already exists');
  }

  return normalizedSlug;
};

const ensureStaticPages = async () => {
  const ops = STATIC_PAGES.map(({ slug, title, metaTitle, metaDescription }) => {
    const setOnInsertFields = {
      slug,
      title,
      status: 'published',
      isPublished: true,
      publishedAt: new Date(),
    };
    
    if (metaTitle) {
      setOnInsertFields.metaTitle = metaTitle;
    }
    if (metaDescription) {
      setOnInsertFields.metaDescription = metaDescription;
    }
    
    return {
      updateOne: {
        filter: { slug },
        update: {
          $setOnInsert: setOnInsertFields,
          $set: {
            pageType: 'static',
            isSystemPage: true,
            contentLocked: true,
          },
        },
        upsert: true,
      },
    };
  });

  await Page.bulkWrite(ops);
};

const createStaticSeoTarget = async (slug, title) => {
  const normalizedSlug = slug.toLowerCase().trim();
  
  if (!/^[a-z0-9-]+$/.test(normalizedSlug)) {
    throw new AppError(400, 'Slug must contain only lowercase letters, numbers, and hyphens');
  }
  
  const existing = await Page.findOne({ slug: normalizedSlug });
  if (existing) {
    throw new AppError(400, 'A page with this slug already exists');
  }
  
  return Page.create({
    slug: normalizedSlug,
    title,
    pageType: 'static',
    isSystemPage: true,
    contentLocked: true,
    status: 'published',
    isPublished: true,
    publishedAt: new Date(),
  });
};

const createPage = async (payload) => {
  await ensureStaticPages();

  const slug = await assertSlugAllowed(payload.slug);

  return Page.create({
    ...payload,
    slug,
    pageType: 'custom',
    isSystemPage: false,
    contentLocked: false,
  });
};

const queryPages = async (queryParams, includeDrafts = false) => {
  await ensureStaticPages();

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
  await ensureStaticPages();

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
  await ensureStaticPages();

  const page = await Page.findById(id);
  if (!page) {
    throw new AppError(404, 'Page not found');
  }
  return page;
};

const updatePageById = async (id, payload) => {
  const page = await getPageById(id);

  if (payload.slug) {
    payload.slug = await assertSlugAllowed(payload.slug, page._id);
  }

  if (page.pageType === 'static' || page.contentLocked) {
    const nonSeoField = Object.keys(payload).find((key) => !SEO_EDITABLE_FIELDS.includes(key));
    if (nonSeoField) {
      throw new AppError(400, 'Static pages only allow SEO updates');
    }
  }

  if (page.pageType === 'custom' && payload.slug) {
    payload.slug = normalizeSlug(payload.slug);
  }

  Object.assign(page, payload);
  await page.save();
  return page;
};

const deletePageById = async (id) => {
  const page = await getPageById(id);
  if (page.isSystemPage || page.pageType === 'static') {
    throw new AppError(400, 'Static system pages cannot be deleted');
  }
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
  ensureStaticPages,
  createStaticSeoTarget,
};
