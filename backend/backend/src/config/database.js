'use strict';
require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'usam_hub_dev',
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT) || 3306,
    dialect: 'mysql',
    dialectOptions: { charset: 'utf8mb4' },
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    pool: { min: 2, max: 10, acquire: 30000, idle: 10000 },
    logging: false,
  },
  test: {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME_TEST || 'usam_hub_test',
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT) || 3306,
    dialect: 'mysql',
    dialectOptions: { charset: 'utf8mb4' },
    pool: { min: 1, max: 5 },
    logging: false,
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 3306,
    dialect: 'mysql',
    dialectOptions: {
      charset: 'utf8mb4',
      ssl: { rejectUnauthorized: true },
    },
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    pool: { min: 2, max: 10, acquire: 30000, idle: 10000 },
    logging: false,
  },
};
