'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('EmailVerification', {
  id:         { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  user_id:    { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  token_hash: { type: DataTypes.STRING(255), allowNull: false },
  expires_at: { type: DataTypes.DATE, allowNull: false },
  used:       { type: DataTypes.BOOLEAN, defaultValue: false },
}, { tableName: 'email_verifications', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: false });
