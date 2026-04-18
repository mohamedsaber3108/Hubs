'use strict';
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('Conversation', {
  id:        { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  type:      { type: DataTypes.ENUM('direct','group'), defaultValue: 'direct' },
  name:      { type: DataTypes.STRING(100), allowNull: true },
  avatar_url:      { type: DataTypes.TEXT, allowNull: true },
  last_message_at: { type: DataTypes.DATE, allowNull: true },
}, { tableName: 'conversations', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });
