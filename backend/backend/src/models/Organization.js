'use strict';
const { DataTypes } = require('sequelize');

// Organization identity (ADR-006). `global_org_id` is a nullable placeholder
// for a future ecosystem-wide SSO org id; until then orgs are product-local.
module.exports = (sequelize) => sequelize.define('Organization', {
  id:            { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  global_org_id: { type: DataTypes.STRING(64), allowNull: true },
  owner_id:      { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  name:          { type: DataTypes.STRING(150), allowNull: false },
  slug:          { type: DataTypes.STRING(150), allowNull: false, unique: true },
  tagline:       { type: DataTypes.STRING(255), allowNull: true },
  description:   { type: DataTypes.TEXT, allowNull: true },
  logo_url:      { type: DataTypes.TEXT, allowNull: true },
  website:       { type: DataTypes.STRING(255), allowNull: true },
  industry:      { type: DataTypes.STRING(100), allowNull: true },
  is_verified:   { type: DataTypes.BOOLEAN, defaultValue: false },
  is_active:     { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'organizations', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });
