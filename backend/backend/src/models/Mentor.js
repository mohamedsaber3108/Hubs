'use strict';
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('Mentor', {
  id:               { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  user_id:          { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, unique: true },
  community_id:     { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  expertise:        { type: DataTypes.JSON, defaultValue: [] },
  bio:              { type: DataTypes.TEXT, allowNull: true },
  profile_image:    { type: DataTypes.TEXT, allowNull: true },
  session_rate:     { type: DataTypes.DECIMAL(10,2), allowNull: true },
  session_duration: { type: DataTypes.INTEGER.UNSIGNED, defaultValue: 60 },
  is_available:     { type: DataTypes.BOOLEAN, defaultValue: true },
  is_approved:      { type: DataTypes.BOOLEAN, defaultValue: false },
  rating_avg:       { type: DataTypes.DECIMAL(3,2), defaultValue: 0.00 },
  sessions_count:   { type: DataTypes.INTEGER.UNSIGNED, defaultValue: 0 },
  communities:      { type: DataTypes.JSON, defaultValue: [] },
  calendar_url:     { type: DataTypes.TEXT, allowNull: true },
}, { tableName: 'mentors', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });
