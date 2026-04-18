'use strict';
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('UserSkill', {
  id:      { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  skill:   { type: DataTypes.STRING(100), allowNull: false },
  level:   { type: DataTypes.ENUM('beginner','intermediate','expert'), defaultValue: 'intermediate' },
}, { tableName: 'user_skills', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: false });
