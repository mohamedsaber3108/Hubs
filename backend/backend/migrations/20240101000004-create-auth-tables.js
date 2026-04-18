'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('password_resets', {
      id:         { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      email:      { type: Sequelize.STRING(255), allowNull: false },
      token_hash: { type: Sequelize.STRING(255), allowNull: false },
      expires_at: { type: Sequelize.DATE, allowNull: false },
      used:       { type: Sequelize.BOOLEAN, defaultValue: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.createTable('email_verifications', {
      id:         { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      user_id:    { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      token_hash: { type: Sequelize.STRING(255), allowNull: false },
      expires_at: { type: Sequelize.DATE, allowNull: false },
      used:       { type: Sequelize.BOOLEAN, defaultValue: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.createTable('oauth_accounts', {
      id:            { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      user_id:       { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      provider:      { type: Sequelize.ENUM('google','github','facebook','linkedin'), allowNull: false },
      provider_id:   { type: Sequelize.STRING(255), allowNull: false },
      access_token:  { type: Sequelize.TEXT, allowNull: true },
      refresh_token: { type: Sequelize.TEXT, allowNull: true },
      created_at:    { type: Sequelize.DATE, allowNull: false },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('oauth_accounts');
    await queryInterface.dropTable('email_verifications');
    await queryInterface.dropTable('password_resets');
  }
};
