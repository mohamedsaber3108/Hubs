'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('admins', {
      id:           { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      email:        { type: Sequelize.STRING(255), unique: true, allowNull: false },
      password_hash:{ type: Sequelize.STRING(255), allowNull: false },
      name:         { type: Sequelize.STRING(255), allowNull: false },
      role:         { type: Sequelize.ENUM('super_admin','admin','moderator'), defaultValue: 'admin' },
      permissions:  { type: Sequelize.JSON },
      totp_secret:  { type: Sequelize.STRING(255), allowNull: true },
      totp_enabled: { type: Sequelize.BOOLEAN, defaultValue: false },
      is_active:    { type: Sequelize.BOOLEAN, defaultValue: true },
      last_login:   { type: Sequelize.DATE, allowNull: true },
      created_at:   { type: Sequelize.DATE, allowNull: false },
      updated_at:   { type: Sequelize.DATE, allowNull: false },
    });
  },
  async down(queryInterface) { await queryInterface.dropTable('admins'); }
};
