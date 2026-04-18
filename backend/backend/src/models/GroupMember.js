'use strict';
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('GroupMember', {
  id:        { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  group_id:  { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  user_id:   { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  role:      { type: DataTypes.ENUM('member','moderator','admin'), defaultValue: 'member' },
  status:    { type: DataTypes.ENUM('pending','approved','rejected'), defaultValue: 'approved' },
  joined_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { tableName: 'group_members', underscored: true, timestamps: false });
