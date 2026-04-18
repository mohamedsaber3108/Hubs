'use strict';
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('CommunityMembership', {
  id:           { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  user_id:      { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  community_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  role:         { type: DataTypes.ENUM('member','moderator','admin'), defaultValue: 'member' },
  joined_at:    { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { tableName: 'community_memberships', underscored: true, timestamps: false });
