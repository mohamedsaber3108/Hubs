'use strict';
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('ChallengeSubmission', {
  id:             { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  challenge_id:   { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  user_id:        { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  title:          { type: DataTypes.STRING(255), allowNull: false },
  description:    { type: DataTypes.TEXT, allowNull: true },
  submission_url: { type: DataTypes.TEXT, allowNull: true },
  media_urls:     { type: DataTypes.JSON, defaultValue: [] },
  votes_count:    { type: DataTypes.INTEGER.UNSIGNED, defaultValue: 0 },
  status:         { type: DataTypes.ENUM('pending','approved','rejected','winner'), defaultValue: 'pending' },
  prize_rank:     { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
}, { tableName: 'challenge_submissions', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });
