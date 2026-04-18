'use strict';
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('ActivityLog', {
  id:          { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
  user_id:     { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  admin_id:    { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  action:      { type: DataTypes.STRING(100), allowNull: false },
  entity_type: { type: DataTypes.STRING(50), allowNull: true },
  entity_id:   { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  old_value:   { type: DataTypes.JSON, allowNull: true },
  new_value:   { type: DataTypes.JSON, allowNull: true },
  ip_address:  { type: DataTypes.STRING(50), allowNull: true },
}, { tableName: 'activity_logs', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: false });
