'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('User', {
  id:             { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  uuid:           { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, allowNull: false, unique: true },
  first_name:     { type: DataTypes.STRING(100), allowNull: false },
  last_name:      { type: DataTypes.STRING(100), allowNull: false },
  username:       { type: DataTypes.STRING(50), unique: true, allowNull: false },
  email:          { type: DataTypes.STRING(255), unique: true, allowNull: false },
  password_hash:  { type: DataTypes.STRING(255), allowNull: true },
  avatar_url:     { type: DataTypes.TEXT, allowNull: true },
  cover_url:      { type: DataTypes.TEXT, allowNull: true },
  bio:            { type: DataTypes.TEXT, allowNull: true },
  headline:       { type: DataTypes.STRING(255), allowNull: true },
  location:       { type: DataTypes.STRING(255), allowNull: true },
  website:        { type: DataTypes.STRING(255), allowNull: true },
  role:           { type: DataTypes.ENUM('user','moderator','admin'), defaultValue: 'user' },
  status:         { type: DataTypes.ENUM('active','suspended','banned'), defaultValue: 'active' },
  email_verified: { type: DataTypes.BOOLEAN, defaultValue: false },
  provider:       { type: DataTypes.ENUM('local','google','github','facebook','linkedin'), defaultValue: 'local' },
  provider_id:    { type: DataTypes.STRING(255), allowNull: true },
  is_deleted:     { type: DataTypes.BOOLEAN, defaultValue: false },
  deleted_at:     { type: DataTypes.DATE, allowNull: true },
  last_login:     { type: DataTypes.DATE, allowNull: true },
  points_total:   { type: DataTypes.INTEGER.UNSIGNED, defaultValue: 0 },
  followers_count:{ type: DataTypes.INTEGER.UNSIGNED, defaultValue: 0 },
  following_count:{ type: DataTypes.INTEGER.UNSIGNED, defaultValue: 0 },
  // Onboarding + persona (migration 20240101000017). professional_roles
  // is a multi-value persona (freelancer/student/recruiter/employer/
  // entrepreneur/job_seeker/mentor) that drives differentiated community
  // experiences; onboarding_completed gates the onboarding flow.
  onboarding_completed: { type: DataTypes.BOOLEAN, defaultValue: false },
  professional_roles:   { type: DataTypes.JSON, defaultValue: [] },
}, {
  tableName: 'users',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});
