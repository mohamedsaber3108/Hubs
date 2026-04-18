'use strict';
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('EventAttendee', {
  id:       { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  event_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  user_id:  { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  status:   { type: DataTypes.ENUM('going','maybe','not_going'), defaultValue: 'going' },
}, { tableName: 'event_attendees', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: false });
