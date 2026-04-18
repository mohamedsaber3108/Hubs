'use strict';
require('dotenv').config({ path: '.env.test' });
process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET  = 'test_access_secret_at_least_32_chars_long_';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_at_least_32_chars_long';
process.env.JWT_ACCESS_EXPIRES  = '15m';
process.env.JWT_REFRESH_EXPIRES = '7d';
process.env.REDIS_HOST = '127.0.0.1';
process.env.PORT = 3001;

const { sequelize } = require('../src/models');

beforeAll(async () => {
  await sequelize.authenticate();
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});
