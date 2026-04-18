'use strict';
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('Challenge', {
  id:                { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  community_id:      { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  created_by:        { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  title:             { type: DataTypes.STRING(255), allowNull: false },
  description:       { type: DataTypes.TEXT('long'), allowNull: false },
  cover_url:         { type: DataTypes.TEXT, allowNull: true },
  type:              { type: DataTypes.ENUM('design','code','writing','video','business','other'), defaultValue: 'other' },
  deadline:          { type: DataTypes.DATE, allowNull: false },
  prizes:            { type: DataTypes.JSON, defaultValue: [] },
  tags:              { type: DataTypes.JSON, defaultValue: [] },
  rules:             { type: DataTypes.TEXT('long'), allowNull: true },
  submissions_count: { type: DataTypes.INTEGER.UNSIGNED, defaultValue: 0 },
  participants_count:{ type: DataTypes.INTEGER.UNSIGNED, defaultValue: 0 },
  points_reward:     { type: DataTypes.INTEGER.UNSIGNED, defaultValue: 0 },
  status:            { type: DataTypes.ENUM('active','upcoming','past','cancelled'), defaultValue: 'upcoming' },
}, { tableName: 'challenges', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });
