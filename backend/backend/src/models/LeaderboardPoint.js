'use strict';
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('LeaderboardPoint', {
  id:           { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  user_id:      { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  community_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  points:       { type: DataTypes.INTEGER.UNSIGNED, defaultValue: 0 },
  rank:         { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  period_month: { type: DataTypes.TINYINT.UNSIGNED, allowNull: true },
  period_year:  { type: DataTypes.SMALLINT.UNSIGNED, allowNull: true },
}, { tableName: 'leaderboard_points', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });
