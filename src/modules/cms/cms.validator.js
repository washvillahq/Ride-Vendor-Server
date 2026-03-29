const Joi = require('joi');

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
    metaTitle: Joi.string().allow('', null),
    metaDescription: Joi.string().allow('', null),
    focusKeyword: Joi.string().allow('', null),
    canonicalUrl: Joi.string().uri().allow('', null),
    ogImage: Joi.string().allow('', null),
    robotsDirective: Joi.string().valid('index,follow', 'noindex,follow', 'noindex,nofollow'),
    sections: Joi.array().items(pageSectionSchema),
    isPublished: Joi.boolean(),
  }),
};

const getPages = {
  query: Joi.object().keys({
    slug: Joi.string().allow('', null),
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
      metaTitle: Joi.string().allow('', null),
      metaDescription: Joi.string().allow('', null),
      focusKeyword: Joi.string().allow('', null),
      canonicalUrl: Joi.string().uri().allow('', null),
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

module.exports = {
  createPage,
  getPages,
  getPageBySlug,
  updatePage,
  deletePage,
  submitContact,
  getContactSubmissions,
  updateContactSubmission,
};
