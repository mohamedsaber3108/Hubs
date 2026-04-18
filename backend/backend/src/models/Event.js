'use strict';
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('Event', {
  id:              { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  community_id:    { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  created_by:      { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  title:           { type: DataTypes.STRING(255), allowNull: false },
  description:     { type: DataTypes.TEXT('long'), allowNull: true },
  cover_url:       { type: DataTypes.TEXT, allowNull: true },
  start_date:      { type: DataTypes.DATE, allowNull: false },
  end_date:        { type: DataTypes.DATE, allowNull: true },
  location:        { type: DataTypes.STRING(255), allowNull: true },
  is_online:       { type: DataTypes.BOOLEAN, defaultValue: false },
  meeting_url:     { type: DataTypes.TEXT, allowNull: true },
  max_attendees:   { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  attendees_count: { type: DataTypes.INTEGER.UNSIGNED, defaultValue: 0 },
  status:          { type: DataTypes.ENUM('upcoming','ongoing','past','cancelled'), defaultValue: 'upcoming' },
  tags:            { type: DataTypes.JSON, defaultValue: [] },
  ticket_price:    { type: DataTypes.DECIMAL(10,2), defaultValue: 0.00 },
}, { tableName: 'events', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });
