'use strict';

/**
 * Tests for cms.service.js — specifically the Cloudinary delete behaviour
 * in updatePageById when ogImage is cleared or replaced.
 *
 * Strategy:
 *  - Use mongodb-memory-server so no real Mongo instance is needed.
 *  - jest.mock the cloudinary helper so no real Cloudinary calls are made.
 *  - Set required env vars before the module is loaded.
 */

// ---------------------------------------------------------------------------
// 1. Provide required env vars BEFORE any module that reads config is loaded
// ---------------------------------------------------------------------------
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://localhost/placeholder'; // overridden below
process.env.JWT_SECRET = 'test-secret';
process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
process.env.CLOUDINARY_API_KEY = 'test-key';
process.env.CLOUDINARY_API_SECRET = 'test-secret';
process.env.PAYSTACK_SECRET_KEY = 'test-paystack';

// ---------------------------------------------------------------------------
// 2. Mock the cloudinary helper BEFORE cms.service is required
// ---------------------------------------------------------------------------
jest.mock('../../shared/utils/cloudinary', () => ({
  uploadImageBuffer: jest.fn(),
  deleteImage: jest.fn().mockResolvedValue({ result: 'ok' }),
}));

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const cloudinaryHelper = require('../../shared/utils/cloudinary');

// cms.service is loaded lazily after the DB URI is set (see beforeAll)
let cmsService;
let Page;

// ---------------------------------------------------------------------------
// 3. DB lifecycle
// ---------------------------------------------------------------------------
let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();

  // Patch the env var so that config.js picks up the real in-memory URI
  process.env.MONGODB_URI = uri;

  await mongoose.connect(uri);

  // Now it's safe to require the service (mongoose is connected, env vars set)
  cmsService = require('./cms.service');
  ({ Page } = require('./cms.model'));
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

afterEach(async () => {
  // Clear all collections between tests
  await Page.deleteMany({});
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// 4. Helper: create a minimal static page with an ogImage
// ---------------------------------------------------------------------------
async function createPageWithOgImage(ogImageUrl) {
  return Page.create({
    slug: `test-page-${Date.now()}`,
    title: 'Test Page',
    pageType: 'static',
    isSystemPage: true,
    contentLocked: true,
    status: 'published',
    isPublished: true,
    ogImage: ogImageUrl,
  });
}

// ---------------------------------------------------------------------------
// 5. Tests
// ---------------------------------------------------------------------------

describe('cmsService.updatePageById — Cloudinary ogImage cleanup', () => {
  const OLD_IMAGE_URL =
    'https://res.cloudinary.com/dru2p0t71/image/upload/v1774991266/ridevendor/cms/old_image_abc123.png';
  const OLD_PUBLIC_ID = 'ridevendor/cms/old_image_abc123';

  const NEW_IMAGE_URL =
    'https://res.cloudinary.com/dru2p0t71/image/upload/v1774991266/ridevendor/cms/new_image_xyz789.png';

  describe('when ogImage is cleared (set to empty string)', () => {
    it('should call cloudinaryHelper.deleteImage with the public ID extracted from the old URL', async () => {
      const page = await createPageWithOgImage(OLD_IMAGE_URL);

      await cmsService.updatePageById(page._id.toString(), { ogImage: '' });

      expect(cloudinaryHelper.deleteImage).toHaveBeenCalledTimes(1);
      expect(cloudinaryHelper.deleteImage).toHaveBeenCalledWith(OLD_PUBLIC_ID);
    });

    it('should clear ogImage on the saved document', async () => {
      const page = await createPageWithOgImage(OLD_IMAGE_URL);

      const updated = await cmsService.updatePageById(page._id.toString(), { ogImage: '' });

      expect(updated.ogImage).toBeFalsy();
    });
  });

  describe('when ogImage is replaced with a new URL', () => {
    it('should call cloudinaryHelper.deleteImage with the public ID extracted from the old URL', async () => {
      const page = await createPageWithOgImage(OLD_IMAGE_URL);

      await cmsService.updatePageById(page._id.toString(), { ogImage: NEW_IMAGE_URL });

      expect(cloudinaryHelper.deleteImage).toHaveBeenCalledTimes(1);
      expect(cloudinaryHelper.deleteImage).toHaveBeenCalledWith(OLD_PUBLIC_ID);
    });

    it('should persist the new ogImage URL on the saved document', async () => {
      const page = await createPageWithOgImage(OLD_IMAGE_URL);

      const updated = await cmsService.updatePageById(page._id.toString(), {
        ogImage: NEW_IMAGE_URL,
      });

      expect(updated.ogImage).toBe(NEW_IMAGE_URL);
    });
  });

  describe('when ogImage does not change', () => {
    it('should NOT call cloudinaryHelper.deleteImage', async () => {
      const page = await createPageWithOgImage(OLD_IMAGE_URL);

      await cmsService.updatePageById(page._id.toString(), {
        ogImage: OLD_IMAGE_URL,
        metaTitle: 'New title',
      });

      expect(cloudinaryHelper.deleteImage).not.toHaveBeenCalled();
    });
  });

  describe('when the page has no existing ogImage', () => {
    it('should NOT call cloudinaryHelper.deleteImage', async () => {
      const page = await createPageWithOgImage(''); // no existing image

      await cmsService.updatePageById(page._id.toString(), { ogImage: NEW_IMAGE_URL });

      expect(cloudinaryHelper.deleteImage).not.toHaveBeenCalled();
    });
  });
});
