'use strict';
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('PricingPlan', {
  id:             { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  name:           { type: DataTypes.STRING(50), allowNull: false },
  slug:           { type: DataTypes.STRING(50), allowNull: false, unique: true },
  price_monthly:  { type: DataTypes.DECIMAL(10,2), defaultValue: 0.00 },
  price_yearly:   { type: DataTypes.DECIMAL(10,2), defaultValue: 0.00 },
  features:       { type: DataTypes.JSON, defaultValue: [] },
  limits:         { type: DataTypes.JSON, defaultValue: {} },
  is_active:      { type: DataTypes.BOOLEAN, defaultValue: true },
  sort_order:     { type: DataTypes.TINYINT.UNSIGNED, defaultValue: 0 },
}, { tableName: 'pricing_plans', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });
