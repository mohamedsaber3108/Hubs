'use strict';
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('Subscription', {
  id:         { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  user_id:    { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  plan_id:    { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  status:     { type: DataTypes.ENUM('active','cancelled','expired','trial'), defaultValue: 'active' },
  billing:    { type: DataTypes.ENUM('monthly','yearly'), defaultValue: 'monthly' },
  started_at: { type: DataTypes.DATE, allowNull: false },
  expires_at: { type: DataTypes.DATE, allowNull: true },
  cancelled_at:{ type: DataTypes.DATE, allowNull: true },
  payment_ref:{ type: DataTypes.STRING(255), allowNull: true },
}, { tableName: 'subscriptions', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });
