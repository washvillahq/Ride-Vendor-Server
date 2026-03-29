const QueryBuilder = require('../../shared/utils/QueryBuilder');
const AppError = require('../../shared/utils/appError');
const BlogPost = require('./blog.model');

const RESERVED_BLOG_SLUGS = new Set(['new']);

const assertBlogSlugAllowed = async (slug, ignoreId) => {
  const normalized = slug.toLowerCase().trim();
  if (!normalized) throw new AppError(400, 'Slug is required');
  if (RESERVED_BLOG_SLUGS.has(normalized)) throw new AppError(400, 'This slug is reserved');

  const existing = await BlogPost.findOne({ slug: normalized });
  if (existing && String(existing._id) !== String(ignoreId || '')) {
    throw new AppError(400, 'Blog slug already exists');
  }

  return normalized;
};

const createPost = async (payload) => {
  const slug = await assertBlogSlugAllowed(payload.slug);
  return BlogPost.create({ ...payload, slug });
};

const queryPosts = async (queryParams, includeDrafts = false) => {
  const filters = { ...queryParams };
  if (!includeDrafts) {
    filters.status = 'published';
  }

  const postsQuery = new QueryBuilder(BlogPost.find(), filters)
    .filter()
    .sort()
    .select()
    .paginate();

  const posts = await postsQuery.modelQuery;
  const countQuery = new QueryBuilder(BlogPost.find(), filters).filter();
  const total = await countQuery.modelQuery.countDocuments();

  return { posts, total };
};

const getPostBySlug = async (slug, includeDraft = false) => {
  const query = { slug: slug.toLowerCase().trim() };
  if (!includeDraft) query.status = 'published';

  const post = await BlogPost.findOne(query);
  if (!post) throw new AppError(404, 'Blog post not found');
  return post;
};

const getPostById = async (id) => {
  const post = await BlogPost.findById(id);
  if (!post) throw new AppError(404, 'Blog post not found');
  return post;
};

const updatePostById = async (id, payload) => {
  const post = await getPostById(id);
  if (payload.slug) payload.slug = await assertBlogSlugAllowed(payload.slug, id);
  Object.assign(post, payload);
  await post.save();
  return post;
};

const deletePostById = async (id) => {
  const post = await getPostById(id);
  await post.deleteOne();
  return post;
};

module.exports = {
  createPost,
  queryPosts,
  getPostBySlug,
  getPostById,
  updatePostById,
  deletePostById,
};
