'use strict';
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('Resource', {
  id:             { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  community_id:   { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  uploaded_by:    { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  title:          { type: DataTypes.STRING(255), allowNull: false },
  description:    { type: DataTypes.TEXT, allowNull: true },
  category:       { type: DataTypes.ENUM('template','guide','tool','calculator','case-study','toolkit','other'), defaultValue: 'other' },
  file_url:       { type: DataTypes.TEXT, allowNull: true },
  external_url:   { type: DataTypes.TEXT, allowNull: true },
  file_type:      { type: DataTypes.ENUM('pdf','doc','sheet','link','video','tool','other'), defaultValue: 'other' },
  file_size:      { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  s3_key:         { type: DataTypes.STRING(500), allowNull: true },
  download_count: { type: DataTypes.INTEGER.UNSIGNED, defaultValue: 0 },
  rating_avg:     { type: DataTypes.DECIMAL(3,2), defaultValue: 0.00 },
  ratings_count:  { type: DataTypes.INTEGER.UNSIGNED, defaultValue: 0 },
  tags:           { type: DataTypes.JSON, defaultValue: [] },
  is_free:        { type: DataTypes.BOOLEAN, defaultValue: true },
  is_approved:    { type: DataTypes.BOOLEAN, defaultValue: false },
}, { tableName: 'resources', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });
