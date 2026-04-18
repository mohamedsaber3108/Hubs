'use strict';
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('ChatMessage', {
  id:               { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
  conversation_id:  { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  sender_id:        { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  content:          { type: DataTypes.TEXT, allowNull: true },
  type:             { type: DataTypes.ENUM('text','image','file','system'), defaultValue: 'text' },
  media_url:        { type: DataTypes.TEXT, allowNull: true },
  is_deleted:       { type: DataTypes.BOOLEAN, defaultValue: false },
}, { tableName: 'chat_messages', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: false });
