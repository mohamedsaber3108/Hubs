'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id:             { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      uuid:           { type: Sequelize.UUID, allowNull: false, unique: true },
      first_name:     { type: Sequelize.STRING(100), allowNull: false },
      last_name:      { type: Sequelize.STRING(100), allowNull: false },
      username:       { type: Sequelize.STRING(50), unique: true, allowNull: false },
      email:          { type: Sequelize.STRING(255), unique: true, allowNull: false },
      password_hash:  { type: Sequelize.STRING(255), allowNull: true },
      avatar_url:     { type: Sequelize.TEXT, allowNull: true },
      cover_url:      { type: Sequelize.TEXT, allowNull: true },
      bio:            { type: Sequelize.TEXT, allowNull: true },
      headline:       { type: Sequelize.STRING(255), allowNull: true },
      location:       { type: Sequelize.STRING(255), allowNull: true },
      website:        { type: Sequelize.STRING(255), allowNull: true },
      role:           { type: Sequelize.ENUM('user','moderator','admin'), defaultValue: 'user' },
      status:         { type: Sequelize.ENUM('active','suspended','banned'), defaultValue: 'active' },
      email_verified: { type: Sequelize.BOOLEAN, defaultValue: false },
      provider:       { type: Sequelize.ENUM('local','google','github','facebook','linkedin'), defaultValue: 'local' },
      provider_id:    { type: Sequelize.STRING(255), allowNull: true },
      is_deleted:     { type: Sequelize.BOOLEAN, defaultValue: false },
      deleted_at:     { type: Sequelize.DATE, allowNull: true },
      last_login:     { type: Sequelize.DATE, allowNull: true },
      points_total:   { type: Sequelize.INTEGER.UNSIGNED, defaultValue: 0 },
      followers_count:{ type: Sequelize.INTEGER.UNSIGNED, defaultValue: 0 },
      following_count:{ type: Sequelize.INTEGER.UNSIGNED, defaultValue: 0 },
      created_at:     { type: Sequelize.DATE, allowNull: false },
      updated_at:     { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('users', ['email']);
    await queryInterface.addIndex('users', ['username']);
    await queryInterface.addIndex('users', ['uuid']);
  },
  async down(queryInterface) { await queryInterface.dropTable('users'); }
};
