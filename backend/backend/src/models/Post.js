'use strict';
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('Post', {
  id:             { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
  user_id:        { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  community_id:   { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  content:        { type: DataTypes.TEXT('long'), allowNull: false },
  media_urls:     { type: DataTypes.JSON, defaultValue: [] },
  type:           { type: DataTypes.ENUM('text','image','video','link','poll'), defaultValue: 'text' },
  likes_count:    { type: DataTypes.INTEGER.UNSIGNED, defaultValue: 0 },
  comments_count: { type: DataTypes.INTEGER.UNSIGNED, defaultValue: 0 },
  is_pinned:      { type: DataTypes.BOOLEAN, defaultValue: false },
  is_published:   { type: DataTypes.BOOLEAN, defaultValue: true },
  link_url:       { type: DataTypes.TEXT, allowNull: true },
  poll_options:   { type: DataTypes.JSON, allowNull: true },
}, { tableName: 'posts', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });
