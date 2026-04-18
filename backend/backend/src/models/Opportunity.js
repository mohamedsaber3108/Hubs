'use strict';
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('Opportunity', {
  id:                   { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  community_id:         { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  posted_by:            { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  title:                { type: DataTypes.STRING(255), allowNull: false },
  description:          { type: DataTypes.TEXT('long'), allowNull: false },
  type:                 { type: DataTypes.ENUM('gig','full-time','part-time','internship','volunteer','scholarship','mentorship','collaboration'), allowNull: false },
  company:              { type: DataTypes.STRING(255), allowNull: true },
  company_logo_url:     { type: DataTypes.TEXT, allowNull: true },
  location:             { type: DataTypes.STRING(255), allowNull: true },
  is_remote:            { type: DataTypes.BOOLEAN, defaultValue: false },
  salary_range:         { type: DataTypes.STRING(100), allowNull: true },
  skills:               { type: DataTypes.JSON, defaultValue: [] },
  deadline:             { type: DataTypes.DATE, allowNull: true },
  apply_url:            { type: DataTypes.TEXT, allowNull: true },
  status:               { type: DataTypes.ENUM('open','closed','filled'), defaultValue: 'open' },
  applications_count:   { type: DataTypes.INTEGER.UNSIGNED, defaultValue: 0 },
}, { tableName: 'opportunities', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });
