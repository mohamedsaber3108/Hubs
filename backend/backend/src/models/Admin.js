'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Admin', {
  id:           { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  email:        { type: DataTypes.STRING(255), unique: true, allowNull: false },
  password_hash:{ type: DataTypes.STRING(255), allowNull: false },
  name:         { type: DataTypes.STRING(255), allowNull: false },
  role:         { type: DataTypes.ENUM('super_admin','admin','moderator'), defaultValue: 'admin' },
  permissions:  { type: DataTypes.JSON, defaultValue: {} },
  totp_secret:  { type: DataTypes.STRING(255), allowNull: true },
  totp_enabled: { type: DataTypes.BOOLEAN, defaultValue: false },
  is_active:    { type: DataTypes.BOOLEAN, defaultValue: true },
  last_login:   { type: DataTypes.DATE, allowNull: true },
}, { tableName: 'admins', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });
