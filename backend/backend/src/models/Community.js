'use strict';
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('Community', {
  id:           { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  slug:         { type: DataTypes.STRING(50), allowNull: false, unique: true },
  name:         { type: DataTypes.STRING(100), allowNull: false },
  emoji:        { type: DataTypes.STRING(10), allowNull: true },
  tagline:      { type: DataTypes.STRING(255), allowNull: true },
  description:  { type: DataTypes.TEXT, allowNull: true },
  accent_color: { type: DataTypes.STRING(20), allowNull: true },
  cover_url:    { type: DataTypes.TEXT, allowNull: true },
  members_count:{ type: DataTypes.INTEGER.UNSIGNED, defaultValue: 0 },
  is_active:    { type: DataTypes.BOOLEAN, defaultValue: true },
  features:     { type: DataTypes.JSON, defaultValue: [] },
}, { tableName: 'communities', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });
