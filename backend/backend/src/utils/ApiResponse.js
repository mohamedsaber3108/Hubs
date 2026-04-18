'use strict';

class ApiResponse {
  constructor(statusCode, data, message = 'Success', meta = null) {
    this.statusCode = statusCode;
    this.success = statusCode < 400;
    this.data = data;
    this.message = message;
    if (meta) this.meta = meta;
  }

  static success(res, data, message = 'Success', statusCode = 200, meta = null) {
    return res.status(statusCode).json(new ApiResponse(statusCode, data, message, meta));
  }

  static created(res, data, message = 'Created') {
    return res.status(201).json(new ApiResponse(201, data, message));
  }

  static paginated(res, data, { page, limit, total }) {
    const totalPages = Math.ceil(total / limit);
    return res.status(200).json({
      success: true,
      data,
      pagination: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
    });
  }
}

module.exports = ApiResponse;
