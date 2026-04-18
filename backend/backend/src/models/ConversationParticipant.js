'use strict';
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('ConversationParticipant', {
  id:               { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  conversation_id:  { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  user_id:          { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  joined_at:        { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  last_read_at:     { type: DataTypes.DATE, allowNull: true },
  is_admin:         { type: DataTypes.BOOLEAN, defaultValue: false },
}, { tableName: 'conversation_participants', underscored: true, timestamps: false });
