const Service = require('./service.model');
const QueryBuilder = require('../../shared/utils/QueryBuilder');
const AppError = require('../../shared/utils/appError');

const createService = async (serviceBody) => {
  return Service.create(serviceBody);
};

const queryServices = async (queryParams) => {
  const servicesQuery = new QueryBuilder(Service.find(), queryParams)
    .filter()
    .sort()
    .select()
    .paginate();

  const services = await servicesQuery.modelQuery;
  
  const countQuery = new QueryBuilder(Service.find(), queryParams).filter();
  const total = await countQuery.modelQuery.countDocuments();

  return { services, total };
};

const getServiceById = async (serviceId) => {
  const service = await Service.findById(serviceId);
  if (!service) {
    throw new AppError(404, 'Service not found');
  }
  return service;
};

const updateServiceById = async (serviceId, updateBody) => {
  const service = await getServiceById(serviceId);
  Object.assign(service, updateBody);
  await service.save();
  return service;
};

const deleteServiceById = async (serviceId) => {
  const service = await getServiceById(serviceId);
  await service.deleteOne(); // Hard delete for services typically fine, or we could soft delete
  return service;
};

// Internal lookup function useful for booking calculations
const validateServicesAndCalculatePrice = async (serviceIds, carCategory) => {
  const services = await Service.find({ _id: { $in: serviceIds } });
  
  if (services.length !== serviceIds.length) {
    throw new AppError(400, 'One or more requested services do not exist');
  }

  let totalServicePricePerDay = 0;
  const processedServices = [];

  for (const service of services) {
    if (!service.applicableTo.includes(carCategory)) {
      throw new AppError(400, `Service ${service.name} is not applicable to car category: ${carCategory}`);
    }
    totalServicePricePerDay += service.pricePerDay;
    processedServices.push({
      service: service._id,
      name: service.name,
      pricePerDay: service.pricePerDay,
    });
  }

  return { totalServicePricePerDay, processedServices };
};

module.exports = {
  createService,
  queryServices,
  getServiceById,
  updateServiceById,
  deleteServiceById,
  validateServicesAndCalculatePrice,
};
