'use strict';
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('Setting', {
  id:         { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  key:        { type: DataTypes.STRING(100), allowNull: false, unique: true },
  value:      { type: DataTypes.TEXT, allowNull: true },
  type:       { type: DataTypes.ENUM('string','number','boolean','json'), defaultValue: 'string' },
  group:      { type: DataTypes.STRING(50), defaultValue: 'general' },
  is_public:  { type: DataTypes.BOOLEAN, defaultValue: false },
  updated_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
}, { tableName: 'settings', underscored: true, timestamps: true, createdAt: false, updatedAt: 'updated_at' });
