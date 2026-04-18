'use strict';
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('Notification', {
  id:       { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
  user_id:  { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  title:    { type: DataTypes.STRING(255), allowNull: false },
  message:  { type: DataTypes.TEXT, allowNull: false },
  type:     { type: DataTypes.ENUM('info','success','warning','mention','follow','like','comment','message','challenge','opportunity','event'), defaultValue: 'info' },
  is_read:  { type: DataTypes.BOOLEAN, defaultValue: false },
  data:     { type: DataTypes.JSON, defaultValue: {} },
  action_url: { type: DataTypes.STRING(255), allowNull: true },
}, { tableName: 'notifications', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: false });
