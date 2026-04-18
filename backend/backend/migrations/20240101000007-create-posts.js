'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('posts', {
      id:             { type: Sequelize.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      user_id:        { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      community_id:   { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'communities', key: 'id' } },
      content:        { type: Sequelize.TEXT('long'), allowNull: false },
      media_urls:     { type: Sequelize.JSON },
      type:           { type: Sequelize.ENUM('text','image','video','link','poll'), defaultValue: 'text' },
      likes_count:    { type: Sequelize.INTEGER.UNSIGNED, defaultValue: 0 },
      comments_count: { type: Sequelize.INTEGER.UNSIGNED, defaultValue: 0 },
      is_pinned:      { type: Sequelize.BOOLEAN, defaultValue: false },
      is_published:   { type: Sequelize.BOOLEAN, defaultValue: true },
      link_url:       { type: Sequelize.TEXT, allowNull: true },
      poll_options:   { type: Sequelize.JSON, allowNull: true },
      created_at:     { type: Sequelize.DATE, allowNull: false },
      updated_at:     { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.createTable('post_likes', {
      id:         { type: Sequelize.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      post_id:    { type: Sequelize.BIGINT.UNSIGNED, allowNull: false, references: { model: 'posts', key: 'id' }, onDelete: 'CASCADE' },
      user_id:    { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      created_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('post_likes', ['post_id', 'user_id'], { unique: true });
    await queryInterface.createTable('post_comments', {
      id:           { type: Sequelize.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      post_id:      { type: Sequelize.BIGINT.UNSIGNED, allowNull: false, references: { model: 'posts', key: 'id' }, onDelete: 'CASCADE' },
      user_id:      { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      parent_id:    { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
      content:      { type: Sequelize.TEXT, allowNull: false },
      likes_count:  { type: Sequelize.INTEGER.UNSIGNED, defaultValue: 0 },
      is_deleted:   { type: Sequelize.BOOLEAN, defaultValue: false },
      created_at:   { type: Sequelize.DATE, allowNull: false },
      updated_at:   { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('posts', ['community_id', 'created_at']);
    await queryInterface.addIndex('posts', ['user_id']);
  },
  async down(queryInterface) {
    for (const t of ['post_comments','post_likes','posts'])
      await queryInterface.dropTable(t);
  }
};
