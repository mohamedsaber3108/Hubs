'use strict';
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('EmailTemplate', {
  id:         { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  name:       { type: DataTypes.STRING(100), allowNull: false, unique: true },
  subject:    { type: DataTypes.STRING(255), allowNull: false },
  html_body:  { type: DataTypes.TEXT('long'), allowNull: false },
  variables:  { type: DataTypes.JSON, defaultValue: [] },
  updated_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
}, { tableName: 'email_templates', underscored: true, timestamps: true, createdAt: false, updatedAt: 'updated_at' });
