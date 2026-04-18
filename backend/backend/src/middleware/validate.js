'use strict';
const ApiError = require('../utils/ApiError');

const validate = (schema, property) => {
  property = property || 'body';
  return function(req, res, next) {
    const result = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
      allowUnknown: false,
    });
    if (result.error) {
      const errors = result.error.details.map((d) => ({
        field:   (d.context && d.context.key) || 'unknown',
        message: d.message.replace(/['"]/g, ''),
      }));
      return next(ApiError.badRequest('Validation failed', errors));
    }
    req[property] = result.value;
    next();
  };
};

module.exports = validate;
