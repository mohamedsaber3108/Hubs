'use strict';
const ApiError = require('../../src/utils/ApiError');

describe('ApiError', () => {
  test('badRequest creates 400', () => {
    const err = ApiError.badRequest('bad input');
    expect(err.statusCode).toBe(400);
    expect(err.success).toBe(false);
  });

  test('unauthorized creates 401', () => {
    expect(ApiError.unauthorized().statusCode).toBe(401);
  });

  test('forbidden creates 403', () => {
    expect(ApiError.forbidden().statusCode).toBe(403);
  });

  test('notFound creates 404', () => {
    expect(ApiError.notFound().statusCode).toBe(404);
  });

  test('conflict creates 409', () => {
    expect(ApiError.conflict('dup').statusCode).toBe(409);
  });

  test('internal creates 500', () => {
    expect(ApiError.internal().statusCode).toBe(500);
  });

  test('accepts errors array', () => {
    const errs = [{ field: 'email', message: 'invalid' }];
    const err  = ApiError.badRequest('Validation failed', errs);
    expect(err.errors).toHaveLength(1);
    expect(err.errors[0].field).toBe('email');
  });
});
