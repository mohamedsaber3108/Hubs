'use strict';
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('Group', {
  id:            { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  community_id:  { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  created_by:    { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  name:          { type: DataTypes.STRING(100), allowNull: false },
  description:   { type: DataTypes.TEXT, allowNull: true },
  avatar_url:    { type: DataTypes.TEXT, allowNull: true },
  cover_url:     { type: DataTypes.TEXT, allowNull: true },
  type:          { type: DataTypes.ENUM('public','private','invite_only'), defaultValue: 'public' },
  member_count:  { type: DataTypes.INTEGER.UNSIGNED, defaultValue: 0 },
  tags:          { type: DataTypes.JSON, defaultValue: [] },
  is_active:     { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'groups', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });
