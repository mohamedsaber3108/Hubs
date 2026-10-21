'use strict';
const { DataTypes } = require('sequelize');

// Product-local membership of a user in an organization. `role` here is
// distinct from the platform User.role and from CommunityMembership.role.
module.exports = (sequelize) => sequelize.define('OrganizationMember', {
  id:              { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  organization_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  user_id:         { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  role:            { type: DataTypes.ENUM('owner', 'admin', 'member'), defaultValue: 'member' },
}, { tableName: 'organization_members', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });
