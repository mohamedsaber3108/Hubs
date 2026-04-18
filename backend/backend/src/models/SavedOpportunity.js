'use strict';
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('SavedOpportunity', {
  id:             { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  opportunity_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  user_id:        { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
}, { tableName: 'saved_opportunities', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: false });
