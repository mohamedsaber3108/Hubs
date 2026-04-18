'use strict';
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('PostComment', {
  id:           { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
  post_id:      { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  user_id:      { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  parent_id:    { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
  content:      { type: DataTypes.TEXT, allowNull: false },
  likes_count:  { type: DataTypes.INTEGER.UNSIGNED, defaultValue: 0 },
  is_deleted:   { type: DataTypes.BOOLEAN, defaultValue: false },
}, { tableName: 'post_comments', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });
