const Joi = require('joi');

const canonicalSchema = Joi.alternatives().try(
  Joi.string().uri(),
  Joi.string().pattern(/^\/[^\s]*$/)
);

const pageSectionSchema = Joi.object().keys({
  type: Joi.string().required(),
  title: Joi.string().allow('', null),
  content: Joi.string().allow('', null),
  order: Joi.number().integer().min(0),
});

const createPage = {
  body: Joi.object().keys({
    slug: Joi.string().required(),
    title: Joi.string().required(),
    contentHtml: Joi.string().allow('', null),
    metaTitle: Joi.string().allow('', null),
    metaDescription: Joi.string().allow('', null),
    focusKeyword: Joi.string().allow('', null),
    canonicalUrl: canonicalSchema.allow('', null),
    ogImage: Joi.string().allow('', null),
    robotsDirective: Joi.string().valid('index,follow', 'noindex,follow', 'noindex,nofollow'),
    sections: Joi.array().items(pageSectionSchema),
    isPublished: Joi.boolean(),
  }),
};

const getPages = {
  query: Joi.object().keys({
    _id: Joi.string().allow('', null),
    slug: Joi.string().allow('', null),
    pageType: Joi.string().valid('static', 'custom').allow('', null),
    status: Joi.string().valid('draft', 'published').allow('', null),
    isSystemPage: Joi.boolean(),
    isPublished: Joi.boolean(),
    sort: Joi.string().allow('', null),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
    fields: Joi.string().allow('', null),
  }),
};

const getPageBySlug = {
  params: Joi.object().keys({
    slug: Joi.string().required(),
  }),
};

const updatePage = {
  params: Joi.object().keys({
    pageId: Joi.string().required(),
  }),
  body: Joi.object()
    .keys({
      slug: Joi.string(),
      title: Joi.string(),
      contentHtml: Joi.string().allow('', null),
      pageType: Joi.string().valid('static', 'custom'),
      isSystemPage: Joi.boolean(),
      contentLocked: Joi.boolean(),
      status: Joi.string().valid('draft', 'published'),
      metaTitle: Joi.string().allow('', null),
      metaDescription: Joi.string().allow('', null),
      focusKeyword: Joi.string().allow('', null),
      canonicalUrl: canonicalSchema.allow('', null),
      ogImage: Joi.string().allow('', null),
      robotsDirective: Joi.string().valid('index,follow', 'noindex,follow', 'noindex,nofollow'),
      sections: Joi.array().items(pageSectionSchema),
      isPublished: Joi.boolean(),
    })
    .min(1),
};

const deletePage = {
  params: Joi.object().keys({
    pageId: Joi.string().required(),
  }),
};

const submitContact = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    phone: Joi.string().allow('', null),
    subject: Joi.string().required(),
    message: Joi.string().required(),
  }),
};

const getContactSubmissions = {
  query: Joi.object().keys({
    status: Joi.string().valid('pending', 'reviewed', 'replied').allow('', null),
    sort: Joi.string().allow('', null),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
    fields: Joi.string().allow('', null),
  }),
};

const updateContactSubmission = {
  params: Joi.object().keys({
    submissionId: Joi.string().required(),
  }),
  body: Joi.object()
    .keys({
      status: Joi.string().valid('pending', 'reviewed', 'replied'),
      adminNotes: Joi.string().allow('', null),
    })
    .min(1),
};

const getGlobalSeoSettings = {
  query: Joi.object().keys({}),
};

const updateGlobalSeoSettings = {
  body: Joi.object()
    .keys({
      siteName: Joi.string().allow('', null),
      titleSuffix: Joi.string().allow('', null),
      siteDescription: Joi.string().allow('', null),
      siteUrl: Joi.string().uri().allow('', null),
      defaultImage: Joi.string().allow('', null),
      twitterHandle: Joi.string().allow('', null),
      locale: Joi.string().allow('', null),
      country: Joi.string().allow('', null),
      organizationName: Joi.string().allow('', null),
      organizationPhone: Joi.string().allow('', null),
      organizationEmail: Joi.string().email().allow('', null),
    })
    .min(1),
};

module.exports = {
  createPage,
  getPages,
  getPageBySlug,
  updatePage,
  deletePage,
  submitContact,
  getContactSubmissions,
  updateContactSubmission,
  getGlobalSeoSettings,
  updateGlobalSeoSettings,
};
