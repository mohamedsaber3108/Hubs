'use strict';
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('ResourceRating', {
  id:          { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  resource_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  user_id:     { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  rating:      { type: DataTypes.TINYINT.UNSIGNED, allowNull: false },
  review:      { type: DataTypes.TEXT, allowNull: true },
}, { tableName: 'resource_ratings', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: false });
