'use strict';

const paginate = (query = {}) => {
  const page  = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

const paginationMeta = (total, { page, limit }) => ({
  page, limit, total,
  totalPages: Math.ceil(total / limit),
  hasNext: page < Math.ceil(total / limit),
  hasPrev: page > 1,
});

module.exports = { paginate, paginationMeta };
