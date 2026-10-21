'use strict';
const { DataTypes } = require('sequelize');

// A directed partnership request between two organizations. Status lifecycle:
// pending -> accepted | declined; an accepted partnership can later be ended.
module.exports = (sequelize) => sequelize.define('PartnershipRequest', {
  id:               { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  requester_org_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  recipient_org_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  created_by:       { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  message:          { type: DataTypes.TEXT, allowNull: true },
  status:           { type: DataTypes.ENUM('pending', 'accepted', 'declined', 'ended'), defaultValue: 'pending' },
  responded_by:     { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  responded_at:     { type: DataTypes.DATE, allowNull: true },
}, { tableName: 'partnership_requests', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });
