'use strict';
const { paginate, paginationMeta } = require('../../src/utils/paginate');

describe('Paginate', () => {
  test('defaults to page 1, limit 20', () => {
    const r = paginate({});
    expect(r.page).toBe(1);
    expect(r.limit).toBe(20);
    expect(r.offset).toBe(0);
  });

  test('calculates correct offset for page 3 limit 10', () => {
    const r = paginate({ page: '3', limit: '10' });
    expect(r.offset).toBe(20);
  });

  test('caps limit at 100', () => {
    expect(paginate({ limit: '999' }).limit).toBe(100);
  });

  test('paginationMeta calculates totalPages and hasNext', () => {
    const meta = paginationMeta(55, { page: 1, limit: 10 });
    expect(meta.totalPages).toBe(6);
    expect(meta.hasNext).toBe(true);
    expect(meta.hasPrev).toBe(false);
  });
});
