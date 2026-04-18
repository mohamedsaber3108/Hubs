'use strict';
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('MentorRequest', {
  id:           { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  mentor_id:    { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  mentee_id:    { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  message:      { type: DataTypes.TEXT, allowNull: true },
  goals:        { type: DataTypes.TEXT, allowNull: true },
  status:       { type: DataTypes.ENUM('pending','accepted','rejected','completed'), defaultValue: 'pending' },
  scheduled_at: { type: DataTypes.DATE, allowNull: true },
  meeting_url:  { type: DataTypes.TEXT, allowNull: true },
  notes:        { type: DataTypes.TEXT, allowNull: true },
}, { tableName: 'mentor_requests', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });
