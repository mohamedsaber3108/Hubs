'use strict';
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('PostLike', {
  id:         { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
  post_id:    { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  user_id:    { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
}, { tableName: 'post_likes', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: false });
