'use strict';
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('FeatureFlag', {
  id:          { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  name:        { type: DataTypes.STRING(100), allowNull: false, unique: true },
  is_enabled:  { type: DataTypes.BOOLEAN, defaultValue: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  updated_by:  { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
}, { tableName: 'feature_flags', underscored: true, timestamps: true, createdAt: false, updatedAt: 'updated_at' });
