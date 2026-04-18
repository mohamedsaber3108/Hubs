'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('PasswordReset', {
  id:         { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  email:      { type: DataTypes.STRING(255), allowNull: false },
  token_hash: { type: DataTypes.STRING(255), allowNull: false },
  expires_at: { type: DataTypes.DATE, allowNull: false },
  used:       { type: DataTypes.BOOLEAN, defaultValue: false },
}, { tableName: 'password_resets', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: false });
