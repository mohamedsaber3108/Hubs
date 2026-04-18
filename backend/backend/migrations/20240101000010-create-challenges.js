'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('challenges', {
      id:                 { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      community_id:       { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'communities', key: 'id' } },
      created_by:         { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' } },
      title:              { type: Sequelize.STRING(255), allowNull: false },
      description:        { type: Sequelize.TEXT('long'), allowNull: false },
      cover_url:          { type: Sequelize.TEXT, allowNull: true },
      type:               { type: Sequelize.ENUM('design','code','writing','video','business','other'), defaultValue: 'other' },
      deadline:           { type: Sequelize.DATE, allowNull: false },
      prizes:             { type: Sequelize.JSON },
      tags:               { type: Sequelize.JSON },
      rules:              { type: Sequelize.TEXT('long'), allowNull: true },
      submissions_count:  { type: Sequelize.INTEGER.UNSIGNED, defaultValue: 0 },
      participants_count: { type: Sequelize.INTEGER.UNSIGNED, defaultValue: 0 },
      points_reward:      { type: Sequelize.INTEGER.UNSIGNED, defaultValue: 0 },
      status:             { type: Sequelize.ENUM('active','upcoming','past','cancelled'), defaultValue: 'upcoming' },
      created_at:         { type: Sequelize.DATE, allowNull: false },
      updated_at:         { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.createTable('challenge_submissions', {
      id:             { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      challenge_id:   { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'challenges', key: 'id' }, onDelete: 'CASCADE' },
      user_id:        { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      title:          { type: Sequelize.STRING(255), allowNull: false },
      description:    { type: Sequelize.TEXT, allowNull: true },
      submission_url: { type: Sequelize.TEXT, allowNull: true },
      media_urls:     { type: Sequelize.JSON },
      votes_count:    { type: Sequelize.INTEGER.UNSIGNED, defaultValue: 0 },
      status:         { type: Sequelize.ENUM('pending','approved','rejected','winner'), defaultValue: 'pending' },
      prize_rank:     { type: Sequelize.INTEGER.UNSIGNED, allowNull: true },
      created_at:     { type: Sequelize.DATE, allowNull: false },
      updated_at:     { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.createTable('challenge_votes', {
      id:            { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      submission_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'challenge_submissions', key: 'id' }, onDelete: 'CASCADE' },
      user_id:       { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      created_at:    { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('challenge_votes', ['submission_id', 'user_id'], { unique: true });
  },
  async down(queryInterface) {
    for (const t of ['challenge_votes','challenge_submissions','challenges'])
      await queryInterface.dropTable(t);
  }
};
