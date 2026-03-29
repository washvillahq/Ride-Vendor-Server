const mongoose = require('mongoose');

const pageSectionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      trim: true,
      required: true,
    },
    title: {
      type: String,
      trim: true,
    },
    content: {
      type: String,
      trim: true,
      default: '',
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const pageSchema = new mongoose.Schema(
  {
    pageType: {
      type: String,
      enum: ['static', 'custom'],
      default: 'custom',
      required: true,
    },
    isSystemPage: {
      type: Boolean,
      default: false,
    },
    contentLocked: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft',
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    contentHtml: {
      type: String,
      default: '',
    },
    metaTitle: {
      type: String,
      trim: true,
    },
    metaDescription: {
      type: String,
      trim: true,
    },
    focusKeyword: {
      type: String,
      trim: true,
      default: '',
    },
    canonicalUrl: {
      type: String,
      trim: true,
    },
    ogImage: {
      type: String,
      trim: true,
    },
    robotsDirective: {
      type: String,
      enum: ['index,follow', 'noindex,follow', 'noindex,nofollow'],
      default: 'index,follow',
    },
    sections: {
      type: [pageSectionSchema],
      default: [],
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    publishedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

pageSchema.pre('save', function syncPublishedAt(next) {
  if (this.isModified('status')) {
    this.isPublished = this.status === 'published';
  }

  if (this.isModified('isPublished')) {
    this.status = this.isPublished ? 'published' : 'draft';
    this.publishedAt = this.isPublished ? new Date() : null;
  }

  this.slug = this.slug?.toLowerCase?.().trim?.() || this.slug;

  next();
});

const contactSubmissionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'replied'],
      default: 'pending',
    },
    adminNotes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

contactSubmissionSchema.index({ status: 1, createdAt: -1 });

const seoSettingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: 'global',
      trim: true,
      lowercase: true,
    },
    siteName: {
      type: String,
      trim: true,
      default: 'RideVendor',
    },
    titleSuffix: {
      type: String,
      trim: true,
      default: 'RideVendor',
    },
    siteDescription: {
      type: String,
      trim: true,
      default:
        'Car hire, car sales, and auto services in Ilorin, Kwara State. Trusted vehicle rentals, car sales, and logistics services for individuals and businesses.',
    },
    siteUrl: {
      type: String,
      trim: true,
      default: 'https://ridevendor.com',
    },
    defaultImage: {
      type: String,
      trim: true,
      default: '/og-default.png',
    },
    twitterHandle: {
      type: String,
      trim: true,
      default: '@ridevendor',
    },
    locale: {
      type: String,
      trim: true,
      default: 'en_US',
    },
    country: {
      type: String,
      trim: true,
      default: 'NG',
    },
    organizationName: {
      type: String,
      trim: true,
      default: 'RideVendor',
    },
    organizationPhone: {
      type: String,
      trim: true,
      default: '+2348144123316',
    },
    organizationEmail: {
      type: String,
      trim: true,
      default: 'info@ridevendor.com',
    },
  },
  {
    timestamps: true,
  }
);

const Page = mongoose.model('Page', pageSchema);
const ContactSubmission = mongoose.model('ContactSubmission', contactSubmissionSchema);
const SeoSetting = mongoose.model('SeoSetting', seoSettingSchema);

module.exports = {
  Page,
  ContactSubmission,
  SeoSetting,
};
