'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('events', {
      id:              { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      community_id:    { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'communities', key: 'id' } },
      created_by:      { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' } },
      title:           { type: Sequelize.STRING(255), allowNull: false },
      description:     { type: Sequelize.TEXT('long'), allowNull: true },
      cover_url:       { type: Sequelize.TEXT, allowNull: true },
      start_date:      { type: Sequelize.DATE, allowNull: false },
      end_date:        { type: Sequelize.DATE, allowNull: true },
      location:        { type: Sequelize.STRING(255), allowNull: true },
      is_online:       { type: Sequelize.BOOLEAN, defaultValue: false },
      meeting_url:     { type: Sequelize.TEXT, allowNull: true },
      max_attendees:   { type: Sequelize.INTEGER.UNSIGNED, allowNull: true },
      attendees_count: { type: Sequelize.INTEGER.UNSIGNED, defaultValue: 0 },
      status:          { type: Sequelize.ENUM('upcoming','ongoing','past','cancelled'), defaultValue: 'upcoming' },
      tags:            { type: Sequelize.JSON },
      ticket_price:    { type: Sequelize.DECIMAL(10,2), defaultValue: 0.00 },
      created_at:      { type: Sequelize.DATE, allowNull: false },
      updated_at:      { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.createTable('event_attendees', {
      id:         { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      event_id:   { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'events', key: 'id' }, onDelete: 'CASCADE' },
      user_id:    { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      status:     { type: Sequelize.ENUM('going','maybe','not_going'), defaultValue: 'going' },
      created_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('event_attendees', ['event_id', 'user_id'], { unique: true });
    await queryInterface.addIndex('events', ['community_id', 'start_date']);
    await queryInterface.addIndex('events', ['status']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('event_attendees');
    await queryInterface.dropTable('events');
  }
};
