'use strict';
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('Media', {
  id:            { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  file_name:     { type: DataTypes.STRING(255), allowNull: false },
  original_name: { type: DataTypes.STRING(255), allowNull: false },
  file_url:      { type: DataTypes.TEXT, allowNull: false },
  s3_key:        { type: DataTypes.STRING(500), allowNull: false },
  file_type:     { type: DataTypes.STRING(50), allowNull: false },
  file_size:     { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  uploaded_by:   { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
}, { tableName: 'media', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: false });
