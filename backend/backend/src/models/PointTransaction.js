'use strict';
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('PointTransaction', {
  id:           { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
  user_id:      { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  community_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  points:       { type: DataTypes.INTEGER, allowNull: false },
  action:       { type: DataTypes.STRING(100), allowNull: false },
  entity_type:  { type: DataTypes.STRING(50), allowNull: true },
  entity_id:    { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
  description:  { type: DataTypes.STRING(255), allowNull: true },
}, { tableName: 'point_transactions', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: false });
