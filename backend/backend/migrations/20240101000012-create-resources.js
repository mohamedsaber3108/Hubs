'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('resources', {
      id:             { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      community_id:   { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'communities', key: 'id' } },
      uploaded_by:    { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' } },
      title:          { type: Sequelize.STRING(255), allowNull: false },
      description:    { type: Sequelize.TEXT, allowNull: true },
      category:       { type: Sequelize.ENUM('template','guide','tool','calculator','case-study','toolkit','other'), defaultValue: 'other' },
      file_url:       { type: Sequelize.TEXT, allowNull: true },
      file_type:      { type: Sequelize.ENUM('pdf','doc','sheet','link','video','tool','other'), defaultValue: 'other' },
      file_size:      { type: Sequelize.INTEGER.UNSIGNED, allowNull: true },
      s3_key:         { type: Sequelize.STRING(500), allowNull: true },
      download_count: { type: Sequelize.INTEGER.UNSIGNED, defaultValue: 0 },
      rating_avg:     { type: Sequelize.DECIMAL(3,2), defaultValue: 0.00 },
      ratings_count:  { type: Sequelize.INTEGER.UNSIGNED, defaultValue: 0 },
      tags:           { type: Sequelize.JSON },
      is_free:        { type: Sequelize.BOOLEAN, defaultValue: true },
      external_url:   { type: Sequelize.TEXT, allowNull: true },
      is_approved:    { type: Sequelize.BOOLEAN, defaultValue: false },
      created_at:     { type: Sequelize.DATE, allowNull: false },
      updated_at:     { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.createTable('resource_ratings', {
      id:          { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      resource_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'resources', key: 'id' }, onDelete: 'CASCADE' },
      user_id:     { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      rating:      { type: Sequelize.TINYINT.UNSIGNED, allowNull: false },
      review:      { type: Sequelize.TEXT, allowNull: true },
      created_at:  { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('resource_ratings', ['resource_id', 'user_id'], { unique: true });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('resource_ratings');
    await queryInterface.dropTable('resources');
  }
};
