'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('communities', {
      id:            { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      slug:          { type: Sequelize.STRING(50), allowNull: false, unique: true },
      name:          { type: Sequelize.STRING(100), allowNull: false },
      emoji:         { type: Sequelize.STRING(10), allowNull: true },
      tagline:       { type: Sequelize.STRING(255), allowNull: true },
      description:   { type: Sequelize.TEXT, allowNull: true },
      accent_color:  { type: Sequelize.STRING(20), allowNull: true },
      cover_url:     { type: Sequelize.TEXT, allowNull: true },
      members_count: { type: Sequelize.INTEGER.UNSIGNED, defaultValue: 0 },
      is_active:     { type: Sequelize.BOOLEAN, defaultValue: true },
      features:      { type: Sequelize.JSON },
      created_at:    { type: Sequelize.DATE, allowNull: false },
      updated_at:    { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.createTable('community_memberships', {
      id:           { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      user_id:      { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      community_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'communities', key: 'id' }, onDelete: 'CASCADE' },
      role:         { type: Sequelize.ENUM('member','moderator','admin'), defaultValue: 'member' },
      joined_at:    { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('community_memberships', ['user_id', 'community_id'], { unique: true });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('community_memberships');
    await queryInterface.dropTable('communities');
  }
};
