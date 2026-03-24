class QueryBuilder {
  constructor(modelQuery, queryParams) {
    this.modelQuery = modelQuery;
    this.queryParams = queryParams;
  }

  filter() {
    const queryObj = { ...this.queryParams };
    const excludedFields = ['page', 'sort', 'limit', 'fields', 'searchTerm'];
    excludedFields.forEach((el) => delete queryObj[el]);

    // Remove empty string fields to prevent searching for empty values
    Object.keys(queryObj).forEach((key) => {
      if (queryObj[key] === '') {
        delete queryObj[key];
      }
    });

    // Advanced filtering (e.g. gte, gt, lte, lt)
    // Strictly whitelist allowed operators to prevent NoSQL injection via JSON.parse
    const allowedOperators = ['gte', 'gt', 'lte', 'lt', 'ne', 'in'];
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(
      new RegExp(`\\b(${allowedOperators.join('|')})\\b`, 'g'), 
      (match) => `$${match}`
    );

    this.modelQuery = this.modelQuery.find(JSON.parse(queryStr));
    return this;
  }

  search(searchableFields) {
    if (this.queryParams.searchTerm) {
      const searchTerm = this.queryParams.searchTerm;
      const orConditions = searchableFields.map((field) => ({
        [field]: {
          $regex: searchTerm,
          $options: 'i',
        },
      }));

      this.modelQuery = this.modelQuery.find({ $or: orConditions });
    }
    return this;
  }

  sort() {
    if (this.queryParams.sort) {
      const sortBy = this.queryParams.sort.split(',').join(' ');
      this.modelQuery = this.modelQuery.sort(sortBy);
    } else {
      this.modelQuery = this.modelQuery.sort('-createdAt'); // Default sort
    }
    return this;
  }

  select() {
    if (this.queryParams.fields) {
      const fields = this.queryParams.fields.split(',').join(' ');
      this.modelQuery = this.modelQuery.select(fields);
    } else {
      this.modelQuery = this.modelQuery.select('-__v'); // Exclude mongoose version key
    }
    return this;
  }

  paginate() {
    const page = parseInt(this.queryParams.page, 10) || 1;
    const limit = parseInt(this.queryParams.limit, 10) || 10;
    const skip = (page - 1) * limit;

    this.modelQuery = this.modelQuery.skip(skip).limit(limit);
    return this;
  }
}

module.exports = QueryBuilder;
