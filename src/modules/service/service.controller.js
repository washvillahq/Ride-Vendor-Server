const serviceService = require('./service.service');
const catchAsync = require('../../shared/utils/catchAsync');
const responseHelper = require('../../shared/utils/response');
const { calculatePagination } = require('../../shared/utils/helpers');

const createService = catchAsync(async (req, res) => {
  const service = await serviceService.createService(req.body);
  responseHelper(res, 201, 'Service created successfully', service);
});

const getServices = catchAsync(async (req, res) => {
  const { services, total } = await serviceService.queryServices(req.query);
  const meta = calculatePagination(total, req.query.page || 1, req.query.limit || 10);
  
  responseHelper(res, 200, 'Services retrieved successfully', { pagination: meta, services });
});

const getService = catchAsync(async (req, res) => {
  const service = await serviceService.getServiceById(req.params.serviceId);
  responseHelper(res, 200, 'Service retrieved successfully', service);
});

const updateService = catchAsync(async (req, res) => {
  const service = await serviceService.updateServiceById(req.params.serviceId, req.body);
  responseHelper(res, 200, 'Service updated successfully', service);
});

const deleteService = catchAsync(async (req, res) => {
  await serviceService.deleteServiceById(req.params.serviceId);
  responseHelper(res, 200, 'Service deleted successfully');
});

module.exports = {
  createService,
  getServices,
  getService,
  updateService,
  deleteService,
};
