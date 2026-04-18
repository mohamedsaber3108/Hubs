'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('mentors', {
      id:               { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      user_id:          { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, unique: true, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      community_id:     { type: Sequelize.INTEGER.UNSIGNED, allowNull: true },
      expertise:        { type: Sequelize.JSON },
      bio:              { type: Sequelize.TEXT, allowNull: true },
      profile_image:    { type: Sequelize.TEXT, allowNull: true },
      session_rate:     { type: Sequelize.DECIMAL(10,2), allowNull: true },
      session_duration: { type: Sequelize.INTEGER.UNSIGNED, defaultValue: 60 },
      is_available:     { type: Sequelize.BOOLEAN, defaultValue: true },
      is_approved:      { type: Sequelize.BOOLEAN, defaultValue: false },
      rating_avg:       { type: Sequelize.DECIMAL(3,2), defaultValue: 0.00 },
      sessions_count:   { type: Sequelize.INTEGER.UNSIGNED, defaultValue: 0 },
      communities:      { type: Sequelize.JSON },
      calendar_url:     { type: Sequelize.TEXT, allowNull: true },
      created_at:       { type: Sequelize.DATE, allowNull: false },
      updated_at:       { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.createTable('mentor_requests', {
      id:           { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      mentor_id:    { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'mentors', key: 'id' }, onDelete: 'CASCADE' },
      mentee_id:    { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      message:      { type: Sequelize.TEXT, allowNull: true },
      goals:        { type: Sequelize.TEXT, allowNull: true },
      status:       { type: Sequelize.ENUM('pending','accepted','rejected','completed'), defaultValue: 'pending' },
      scheduled_at: { type: Sequelize.DATE, allowNull: true },
      meeting_url:  { type: Sequelize.TEXT, allowNull: true },
      notes:        { type: Sequelize.TEXT, allowNull: true },
      created_at:   { type: Sequelize.DATE, allowNull: false },
      updated_at:   { type: Sequelize.DATE, allowNull: false },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('mentor_requests');
    await queryInterface.dropTable('mentors');
  }
};
