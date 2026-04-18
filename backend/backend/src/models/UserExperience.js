'use strict';
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('UserExperience', {
  id:          { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  user_id:     { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  title:       { type: DataTypes.STRING(255), allowNull: false },
  company:     { type: DataTypes.STRING(255), allowNull: false },
  location:    { type: DataTypes.STRING(255), allowNull: true },
  start_date:  { type: DataTypes.DATEONLY, allowNull: false },
  end_date:    { type: DataTypes.DATEONLY, allowNull: true },
  is_current:  { type: DataTypes.BOOLEAN, defaultValue: false },
  description: { type: DataTypes.TEXT, allowNull: true },
}, { tableName: 'user_experiences', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });
