const { Page, SeoSetting } = require('../cms/cms.model');
const BlogPost = require('../blog/blog.model');

const escapeXml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const normalizeSiteUrl = (value) => {
  const raw = value || 'https://ridevendor.com';
  return raw.endsWith('/') ? raw.slice(0, -1) : raw;
};

const mapPagePath = (slug) => {
  if (slug === 'home') return '/';
  return `/${slug}`;
};

const getSiteUrl = async () => {
  const settings = await SeoSetting.findOne({ key: 'global' });
  return normalizeSiteUrl(settings?.siteUrl);
};

const getSitemapXml = async () => {
  const siteUrl = await getSiteUrl();

  const pages = await Page.find({
    status: 'published',
  }).select('slug updatedAt');

  const posts = await BlogPost.find({
    status: 'published',
  }).select('slug updatedAt');

  const pageEntries = pages.map((page) => ({
    loc: `${siteUrl}${mapPagePath(page.slug)}`,
    lastmod: page.updatedAt?.toISOString(),
    changefreq: page.slug === 'home' ? 'daily' : 'weekly',
    priority: page.slug === 'home' ? '1.0' : '0.8',
  }));

  const postEntries = posts.map((post) => ({
    loc: `${siteUrl}/blog/${post.slug}`,
    lastmod: post.updatedAt?.toISOString(),
    changefreq: 'weekly',
    priority: '0.7',
  }));

  const entries = [...pageEntries, ...postEntries]
    .map(
      ({ loc, lastmod, changefreq, priority }) => `<url>
  <loc>${escapeXml(loc)}</loc>
  ${lastmod ? `<lastmod>${escapeXml(lastmod)}</lastmod>` : ''}
  <changefreq>${changefreq}</changefreq>
  <priority>${priority}</priority>
</url>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>`;
};

const getRobotsTxt = async () => {
  const siteUrl = await getSiteUrl();

  return `User-agent: *
Allow: /

Disallow: /dashboard/
Disallow: /admin/
Disallow: /api/

Sitemap: ${siteUrl}/api/v1/seo/sitemap.xml`;
};

module.exports = {
  getSitemapXml,
  getRobotsTxt,
};
