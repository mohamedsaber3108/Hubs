'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('opportunities', {
      id:                 { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      community_id:       { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'communities', key: 'id' } },
      posted_by:          { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' } },
      title:              { type: Sequelize.STRING(255), allowNull: false },
      description:        { type: Sequelize.TEXT('long'), allowNull: false },
      type:               { type: Sequelize.ENUM('gig','full-time','part-time','internship','volunteer','scholarship','mentorship','collaboration'), allowNull: false },
      company:            { type: Sequelize.STRING(255), allowNull: true },
      company_logo_url:   { type: Sequelize.TEXT, allowNull: true },
      location:           { type: Sequelize.STRING(255), allowNull: true },
      is_remote:          { type: Sequelize.BOOLEAN, defaultValue: false },
      salary_range:       { type: Sequelize.STRING(100), allowNull: true },
      skills:             { type: Sequelize.JSON },
      deadline:           { type: Sequelize.DATE, allowNull: true },
      apply_url:          { type: Sequelize.TEXT, allowNull: true },
      status:             { type: Sequelize.ENUM('open','closed','filled'), defaultValue: 'open' },
      applications_count: { type: Sequelize.INTEGER.UNSIGNED, defaultValue: 0 },
      created_at:         { type: Sequelize.DATE, allowNull: false },
      updated_at:         { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.createTable('opportunity_applications', {
      id:             { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      opportunity_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'opportunities', key: 'id' }, onDelete: 'CASCADE' },
      user_id:        { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      cover_letter:   { type: Sequelize.TEXT, allowNull: true },
      resume_url:     { type: Sequelize.TEXT, allowNull: true },
      status:         { type: Sequelize.ENUM('pending','reviewed','shortlisted','accepted','rejected'), defaultValue: 'pending' },
      created_at:     { type: Sequelize.DATE, allowNull: false },
      updated_at:     { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.createTable('saved_opportunities', {
      id:             { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      opportunity_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'opportunities', key: 'id' }, onDelete: 'CASCADE' },
      user_id:        { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      created_at:     { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('saved_opportunities', ['opportunity_id', 'user_id'], { unique: true });
    await queryInterface.addIndex('opportunity_applications', ['opportunity_id', 'user_id'], { unique: true });
    await queryInterface.addIndex('opportunities', ['community_id', 'status']);
  },
  async down(queryInterface) {
    for (const t of ['saved_opportunities','opportunity_applications','opportunities'])
      await queryInterface.dropTable(t);
  }
};
