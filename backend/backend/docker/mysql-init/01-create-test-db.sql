-- Runs automatically on first container start (MySQL's
-- docker-entrypoint-initdb.d mechanism). Creates the second schema used
-- by NODE_ENV=test (see src/config/database.js's `test` block, which
-- reads DB_NAME_TEST) alongside the primary dev database that
-- MYSQL_DATABASE already creates.
CREATE DATABASE IF NOT EXISTS usam_hub_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON usam_hub_test.* TO 'usam_dev'@'%';
FLUSH PRIVILEGES;
