const QueryBuilder = require('../../shared/utils/QueryBuilder');
const AppError = require('../../shared/utils/appError');
const cloudinaryHelper = require('../../shared/utils/cloudinary');
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

const CONTENT_MANAGED_SLUGS = new Set([
  'about',
  'privacy-policy',
  'refund-policy',
  'terms-and-conditions',
  'cookie-policy',
]);

const ABOUT_SEED_CONTENT_JSON = {
  root: { props: {} },
  content: [
    {
      type: 'Paragraph',
      props: {
        id: 'about-intro',
        text: 'RideVendor is your trusted partner for car hire, car sales, and auto services in Ilorin, Kwara State. Since 2012, we have been providing reliable vehicle solutions for individuals and businesses.',
        size: 'xl',
      },
    },
    {
      type: 'CardGrid',
      props: {
        id: 'about-mission-vision',
        columns: '2',
        cards: JSON.stringify([
          {
            title: 'Our Mission',
            text: 'To provide reliable, affordable, and professional vehicle rental and sales services that exceed customer expectations.',
          },
          {
            title: 'Our Vision',
            text: 'To be the leading vehicle solutions provider in Nigeria, known for quality service and customer satisfaction.',
          },
        ]),
      },
    },
    {
      type: 'Checklist',
      props: {
        id: 'about-checklist',
        title: 'Why Choose Us?',
        items:
          'Verified and inspected vehicles\nProfessional and experienced drivers\n24/7 customer support\nCompetitive pricing\nFlexible rental terms',
      },
    },
    {
      type: 'Heading',
      props: { id: 'about-services-heading', text: 'Our Services', level: 'h2' },
    },
    {
      type: 'CardGrid',
      props: {
        id: 'about-services-grid',
        columns: '3',
        cards: JSON.stringify([
          {
            title: 'Car Rental',
            text: 'Daily, weekly, and monthly car hire options with free delivery in Ilorin.',
          },
          {
            title: 'Car Sales',
            text: 'Buy quality vehicles with verified inspection reports and transparent pricing.',
          },
          {
            title: 'Auto Services',
            text: 'Car washing, vehicle tracking, and comprehensive auto solutions.',
          },
        ]),
      },
    },
    {
      type: 'Heading',
      props: { id: 'about-contact-heading', text: 'Contact Us', level: 'h2' },
    },
    {
      type: 'ContactCard',
      props: {
        id: 'about-contact-card',
        address:
          'Oniyangi Complex, OFFA GARAGE RAILWAY LINE,\noff Asa-Dam Road, Ilorin 240101, Kwara',
        phone: '+2348144123316',
        email: 'info@ridevendor.com',
      },
    },
  ],
  zones: {},
};

const STATIC_PAGES = [
  { 
    slug: 'home', 
    title: 'Home',
    metaTitle: 'Car Hire, Car Sales & Auto Services in Ilorin',
    metaDescription: 'Buy, hire, lease, and manage vehicles with ease. Ride Vendor provides trusted car hire, car sales, and logistics services for individuals and businesses in Ilorin.',
  },
  { slug: 'about', title: 'About', contentJson: ABOUT_SEED_CONTENT_JSON },
  { slug: 'services', title: 'Services' },
  { slug: 'contact', title: 'Contact' },
  { slug: 'shop', title: 'Shop' },
  { slug: 'car-sales', title: 'Car Sales' },
  { slug: 'car-hire', title: 'Car Hire' },
  { slug: 'blog', title: 'Blog' },
  { slug: '404', title: 'Page Not Found' },
  { slug: 'unauthorized', title: 'Unauthorized' },
  { slug: 'privacy-policy', title: 'Privacy Policy' },
  { slug: 'refund-policy', title: 'Refund Policy' },
  { slug: 'terms-and-conditions', title: 'Terms and Conditions' },
  { slug: 'cookie-policy', title: 'Cookie Policy' },
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
  'contentHtml',
  'contentJson',
];

const CONTENT_EDITABLE_FIELDS = [
  'title',
  'contentHtml',
  'contentJson',
  'metaTitle',
  'metaDescription',
  'focusKeyword',
  'canonicalUrl',
  'ogImage',
  'robotsDirective',
  'isPublished',
  'status',
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
  const ops = STATIC_PAGES.map(({ slug, title, metaTitle, metaDescription, contentJson }) => {
    const isContentManaged = CONTENT_MANAGED_SLUGS.has(slug);
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
    if (contentJson) {
      setOnInsertFields.contentJson = contentJson;
    }
    
    return {
      updateOne: {
        filter: { slug },
        update: {
          $setOnInsert: setOnInsertFields,
          $set: {
            pageType: 'static',
            isSystemPage: true,
            contentLocked: !isContentManaged,
          },
        },
        upsert: true,
      },
    };
  });

  await Page.bulkWrite(ops);

  // Backfill contentJson for pages that were created before the seed was added.
  // Only applies when contentJson is null/missing — does not overwrite existing editor content.
  const backfillOps = STATIC_PAGES
    .filter(({ contentJson }) => contentJson)
    .map(({ slug, contentJson }) => ({
      updateOne: {
        filter: { slug, contentJson: null },
        update: { $set: { contentJson } },
      },
    }));

  if (backfillOps.length > 0) {
    await Page.bulkWrite(backfillOps);
  }
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

/**
 * Extract the Cloudinary public ID from a full Cloudinary URL.
 * E.g. "https://res.cloudinary.com/xxx/image/upload/v1234/ridevendor/cms/abc.png"
 *      → "ridevendor/cms/abc"
 * Returns null if the URL doesn't look like a Cloudinary upload URL.
 */
const extractCloudinaryPublicId = (url) => {
  if (!url) return null;
  // Match everything after /upload/v<digits>/ (with or without version segment)
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
  return match ? match[1] : null;
};

const updatePageById = async (id, payload) => {
  const page = await getPageById(id);

  if (payload.slug) {
    payload.slug = await assertSlugAllowed(payload.slug, page._id);
  }

  if (page.pageType === 'static') {
    if (page.contentLocked) {
      const nonSeoField = Object.keys(payload).find((key) => !SEO_EDITABLE_FIELDS.includes(key));
      if (nonSeoField) {
        throw new AppError(400, 'Static pages only allow SEO updates');
      }
    } else {
      const nonAllowedField = Object.keys(payload).find((key) => !CONTENT_EDITABLE_FIELDS.includes(key));
      if (nonAllowedField) {
        throw new AppError(400, 'Invalid field for this page type');
      }
    }
  }

  if (page.pageType === 'custom' && payload.slug) {
    payload.slug = normalizeSlug(payload.slug);
  }

  // Delete the old Cloudinary asset when ogImage is being changed (cleared or replaced).
  if ('ogImage' in payload && payload.ogImage !== page.ogImage && page.ogImage) {
    const publicId = extractCloudinaryPublicId(page.ogImage);
    if (publicId) {
      await cloudinaryHelper.deleteImage(publicId);
    }
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
