'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Session', {
  id:                  { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  user_id:             { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  token_hash:          { type: DataTypes.STRING(255), allowNull: false, unique: true },
  refresh_token_hash:  { type: DataTypes.STRING(255), allowNull: true, unique: true },
  expires_at:          { type: DataTypes.DATE, allowNull: false },
  ip_address:          { type: DataTypes.STRING(50), allowNull: true },
  user_agent:          { type: DataTypes.TEXT, allowNull: true },
  is_revoked:          { type: DataTypes.BOOLEAN, defaultValue: false },
}, { tableName: 'sessions', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: false });
