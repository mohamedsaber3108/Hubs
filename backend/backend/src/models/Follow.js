'use strict';
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('Follow', {
  id:           { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
  follower_id:  { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  following_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
}, { tableName: 'follows', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: false });
