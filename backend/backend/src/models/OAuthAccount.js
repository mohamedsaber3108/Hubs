'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('OAuthAccount', {
  id:            { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  user_id:       { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  provider:      { type: DataTypes.ENUM('google','github','facebook','linkedin'), allowNull: false },
  provider_id:   { type: DataTypes.STRING(255), allowNull: false },
  access_token:  { type: DataTypes.TEXT, allowNull: true },
  refresh_token: { type: DataTypes.TEXT, allowNull: true },
}, { tableName: 'oauth_accounts', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: false });
