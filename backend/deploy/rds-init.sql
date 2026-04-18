-- ══════════════════════════════════════════════════════════
-- USAM Hub — RDS MySQL 8 Initialization Script
-- Run this ONCE on your RDS instance before first deploy
-- ══════════════════════════════════════════════════════════

-- Create database
CREATE DATABASE IF NOT EXISTS `usam_hub`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS `usam_hub_test`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- Create app user with limited privileges
CREATE USER IF NOT EXISTS 'usam_user'@'%' IDENTIFIED BY 'CHANGE_THIS_PASSWORD';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, INDEX, ALTER, REFERENCES
  ON `usam_hub`.* TO 'usam_user'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, INDEX, ALTER
  ON `usam_hub_test`.* TO 'usam_user'@'%';
FLUSH PRIVILEGES;

USE usam_hub;
