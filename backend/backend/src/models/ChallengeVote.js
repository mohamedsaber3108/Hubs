'use strict';
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('ChallengeVote', {
  id:            { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  submission_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  user_id:       { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
}, { tableName: 'challenge_votes', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: false });
