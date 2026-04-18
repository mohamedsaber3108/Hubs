'use strict';
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('UserEducation', {
  id:          { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  user_id:     { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  institution: { type: DataTypes.STRING(255), allowNull: false },
  degree:      { type: DataTypes.STRING(100), allowNull: true },
  field:       { type: DataTypes.STRING(100), allowNull: true },
  start_year:  { type: DataTypes.SMALLINT.UNSIGNED, allowNull: true },
  end_year:    { type: DataTypes.SMALLINT.UNSIGNED, allowNull: true },
  is_current:  { type: DataTypes.BOOLEAN, defaultValue: false },
  description: { type: DataTypes.TEXT, allowNull: true },
}, { tableName: 'user_educations', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: false });
