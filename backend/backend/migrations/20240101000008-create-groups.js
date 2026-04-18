'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('groups', {
      id:           { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      community_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'communities', key: 'id' } },
      created_by:   { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' } },
      name:         { type: Sequelize.STRING(100), allowNull: false },
      description:  { type: Sequelize.TEXT, allowNull: true },
      avatar_url:   { type: Sequelize.TEXT, allowNull: true },
      cover_url:    { type: Sequelize.TEXT, allowNull: true },
      type:         { type: Sequelize.ENUM('public','private','invite_only'), defaultValue: 'public' },
      member_count: { type: Sequelize.INTEGER.UNSIGNED, defaultValue: 0 },
      tags:         { type: Sequelize.JSON },
      is_active:    { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at:   { type: Sequelize.DATE, allowNull: false },
      updated_at:   { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.createTable('group_members', {
      id:        { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      group_id:  { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'groups', key: 'id' }, onDelete: 'CASCADE' },
      user_id:   { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      role:      { type: Sequelize.ENUM('member','moderator','admin'), defaultValue: 'member' },
      status:    { type: Sequelize.ENUM('pending','approved','rejected'), defaultValue: 'approved' },
      joined_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('group_members', ['group_id', 'user_id'], { unique: true });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('group_members');
    await queryInterface.dropTable('groups');
  }
};
