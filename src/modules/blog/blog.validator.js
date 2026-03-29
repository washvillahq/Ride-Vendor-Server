const Joi = require('joi');

const canonicalSchema = Joi.alternatives().try(Joi.string().uri(), Joi.string().pattern(/^\/[^\s]*$/));

const createPost = {
  body: Joi.object().keys({
    title: Joi.string().required(),
    slug: Joi.string().required(),
    excerpt: Joi.string().allow('', null),
    contentHtml: Joi.string().allow('', null),
    coverImage: Joi.string().allow('', null),
    tags: Joi.array().items(Joi.string()),
    status: Joi.string().valid('draft', 'published'),
    metaTitle: Joi.string().allow('', null),
    metaDescription: Joi.string().allow('', null),
    canonicalUrl: canonicalSchema.allow('', null),
    ogImage: Joi.string().allow('', null),
    robotsDirective: Joi.string().valid('index,follow', 'noindex,follow', 'noindex,nofollow'),
  }),
};

const getPosts = {
  query: Joi.object().keys({
    _id: Joi.string().allow('', null),
    slug: Joi.string().allow('', null),
    status: Joi.string().valid('draft', 'published').allow('', null),
    sort: Joi.string().allow('', null),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
    fields: Joi.string().allow('', null),
  }),
};

const getPostBySlug = {
  params: Joi.object().keys({ slug: Joi.string().required() }),
};

const updatePost = {
  params: Joi.object().keys({ postId: Joi.string().required() }),
  body: Joi.object()
    .keys({
      title: Joi.string(),
      slug: Joi.string(),
      excerpt: Joi.string().allow('', null),
      contentHtml: Joi.string().allow('', null),
      coverImage: Joi.string().allow('', null),
      tags: Joi.array().items(Joi.string()),
      status: Joi.string().valid('draft', 'published'),
      metaTitle: Joi.string().allow('', null),
      metaDescription: Joi.string().allow('', null),
      canonicalUrl: canonicalSchema.allow('', null),
      ogImage: Joi.string().allow('', null),
      robotsDirective: Joi.string().valid('index,follow', 'noindex,follow', 'noindex,nofollow'),
    })
    .min(1),
};

const deletePost = {
  params: Joi.object().keys({ postId: Joi.string().required() }),
};

module.exports = {
  createPost,
  getPosts,
  getPostBySlug,
  updatePost,
  deletePost,
};
