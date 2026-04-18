'use strict';
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('OpportunityApplication', {
  id:             { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  opportunity_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  user_id:        { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  cover_letter:   { type: DataTypes.TEXT, allowNull: true },
  resume_url:     { type: DataTypes.TEXT, allowNull: true },
  status:         { type: DataTypes.ENUM('pending','reviewed','shortlisted','accepted','rejected'), defaultValue: 'pending' },
}, { tableName: 'opportunity_applications', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });
