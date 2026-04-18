'use strict';
const ApiResponse = require('../../src/utils/ApiResponse');

describe('ApiResponse', () => {
  it('creates success response with data', () => {
    const r = new ApiResponse(200, { id: 1 }, 'Created');
    expect(r.statusCode).toBe(200);
    expect(r.success).toBe(true);
    expect(r.data).toEqual({ id: 1 });
    expect(r.message).toBe('Created');
  });

  it('success is false for 4xx codes', () => {
    const r = new ApiResponse(400, null, 'Bad request');
    expect(r.success).toBe(false);
  });

  it('success is false for 5xx codes', () => {
    const r = new ApiResponse(500, null, 'Server error');
    expect(r.success).toBe(false);
  });

  it('data defaults to null', () => {
    const r = new ApiResponse(200, undefined, 'ok');
    expect(r.data).toBeNull();
  });
});
