'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('sessions', {
      id:                 { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      user_id:            { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      token_hash:         { type: Sequelize.STRING(255), allowNull: false, unique: true },
      refresh_token_hash: { type: Sequelize.STRING(255), allowNull: true, unique: true },
      expires_at:         { type: Sequelize.DATE, allowNull: false },
      ip_address:         { type: Sequelize.STRING(50), allowNull: true },
      user_agent:         { type: Sequelize.TEXT, allowNull: true },
      is_revoked:         { type: Sequelize.BOOLEAN, defaultValue: false },
      created_at:         { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('sessions', ['user_id']);
    await queryInterface.addIndex('sessions', ['token_hash']);
  },
  async down(queryInterface) { await queryInterface.dropTable('sessions'); }
};
