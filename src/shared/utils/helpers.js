/**
 * Filters an object to only include specific allowed fields
 * @param {Object} obj The object to filter
 * @param {...string} allowedFields The fields allowed to be returned
 * @returns {Object} A new filtered object
 */
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

/**
 * Calculates the total number of days between two dates.
 * Returns at least 1 day if the start and end are the same.
 * @param {Date|string} startDate 
 * @param {Date|string} endDate 
 * @returns {number} total days
 */
const calculateTotalDays = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  return diffDays === 0 ? 1 : diffDays;
};

/**
 * Checks if a requested date range overlaps with any existing date ranges.
 * @param {Date|string} requestStart 
 * @param {Date|string} requestEnd 
 * @param {Array<{start: Date, end: Date}>} existingRanges 
 * @returns {boolean} true if overlap exists, false otherwise
 */
const checkDateOverlap = (requestStart, requestEnd, existingRanges) => {
  const reqStart = new Date(requestStart).getTime();
  const reqEnd = new Date(requestEnd).getTime();

  return existingRanges.some((range) => {
    const existingStart = new Date(range.start).getTime();
    const existingEnd = new Date(range.end).getTime();

    // Logic for overlapping: 
    // Request starts before existing ends AND Request ends after existing starts
    return reqStart <= existingEnd && reqEnd >= existingStart;
  });
};

/**
 * Pagination metadata helper
 * @param {number} totalDocuments 
 * @param {number} page 
 * @param {number} limit 
 * @returns {Object} pagination data
 */
const calculatePagination = (totalDocuments, page, limit) => {
  const totalPages = Math.ceil(totalDocuments / limit);
  return {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    total: totalDocuments,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1
  };
};

module.exports = {
  filterObj,
  calculateTotalDays,
  checkDateOverlap,
  calculatePagination
};
