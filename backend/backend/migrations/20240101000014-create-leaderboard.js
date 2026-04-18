'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('leaderboard_points', {
      id:           { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      user_id:      { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      community_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'communities', key: 'id' } },
      points:       { type: Sequelize.INTEGER.UNSIGNED, defaultValue: 0 },
      rank:         { type: Sequelize.INTEGER.UNSIGNED, allowNull: true },
      period_month: { type: Sequelize.TINYINT.UNSIGNED, allowNull: true },
      period_year:  { type: Sequelize.SMALLINT.UNSIGNED, allowNull: true },
      created_at:   { type: Sequelize.DATE, allowNull: false },
      updated_at:   { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.createTable('point_transactions', {
      id:           { type: Sequelize.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      user_id:      { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      community_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'communities', key: 'id' } },
      points:       { type: Sequelize.INTEGER, allowNull: false },
      action:       { type: Sequelize.STRING(100), allowNull: false },
      entity_type:  { type: Sequelize.STRING(50), allowNull: true },
      entity_id:    { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
      description:  { type: Sequelize.STRING(255), allowNull: true },
      created_at:   { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('leaderboard_points', ['user_id', 'community_id', 'period_year', 'period_month'], { unique: true });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('point_transactions');
    await queryInterface.dropTable('leaderboard_points');
  }
};
