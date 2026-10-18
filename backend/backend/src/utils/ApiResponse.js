'use strict';

class ApiResponse {
  constructor(statusCode, data, message = 'Success', meta = null) {
    this.statusCode = statusCode;
    this.success = statusCode < 400;
    // Default to null, not undefined. JSON.stringify() drops undefined
    // object properties entirely, so passing no data previously made the
    // "data" key vanish from the JSON response instead of serializing as
    // `"data": null` -- a silent API contract inconsistency for any
    // caller that checks response.data === null. (Found via unit test
    // tests/unit/apiResponse.test.js during Jest unit/integration split.)
    this.data = data === undefined ? null : data;
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
