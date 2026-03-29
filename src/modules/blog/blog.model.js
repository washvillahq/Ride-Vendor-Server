const mongoose = require('mongoose');

const blogPostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    excerpt: {
      type: String,
      default: '',
      trim: true,
    },
    contentHtml: {
      type: String,
      default: '',
    },
    coverImage: {
      type: String,
      default: '',
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft',
    },
    publishedAt: {
      type: Date,
    },
    metaTitle: {
      type: String,
      default: '',
      trim: true,
    },
    metaDescription: {
      type: String,
      default: '',
      trim: true,
    },
    canonicalUrl: {
      type: String,
      default: '',
      trim: true,
    },
    ogImage: {
      type: String,
      default: '',
      trim: true,
    },
    robotsDirective: {
      type: String,
      enum: ['index,follow', 'noindex,follow', 'noindex,nofollow'],
      default: 'index,follow',
    },
  },
  {
    timestamps: true,
  }
);

blogPostSchema.pre('save', function syncPublishedAt(next) {
  if (this.isModified('status')) {
    this.publishedAt = this.status === 'published' ? new Date() : null;
  }
  next();
});

const BlogPost = mongoose.model('BlogPost', blogPostSchema);

module.exports = BlogPost;
