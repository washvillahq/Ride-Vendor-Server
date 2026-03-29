const catchAsync = require('../../shared/utils/catchAsync');
const seoService = require('./seo.service');

const getSitemap = catchAsync(async (req, res) => {
  const xml = await seoService.getSitemapXml();
  res.set('Content-Type', 'application/xml');
  res.set('Cache-Control', 'public, max-age=300');
  res.status(200).send(xml);
});

const getRobots = catchAsync(async (req, res) => {
  const robots = await seoService.getRobotsTxt();
  res.set('Content-Type', 'text/plain');
  res.set('Cache-Control', 'public, max-age=300');
  res.status(200).send(robots);
});

module.exports = {
  getSitemap,
  getRobots,
};
