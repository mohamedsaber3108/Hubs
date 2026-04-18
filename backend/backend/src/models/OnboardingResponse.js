'use strict';
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('OnboardingResponse', {
  id:               { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  user_id:          { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, unique: true },
  goals:            { type: DataTypes.JSON, defaultValue: [] },
  interests:        { type: DataTypes.JSON, defaultValue: [] },
  experience_level: { type: DataTypes.ENUM('beginner','intermediate','expert'), defaultValue: 'beginner' },
  communities:      { type: DataTypes.JSON, defaultValue: [] },
  completed:        { type: DataTypes.BOOLEAN, defaultValue: false },
}, { tableName: 'onboarding_responses', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });
