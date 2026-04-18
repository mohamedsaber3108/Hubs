'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('conversations', {
      id:         { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      type:       { type: Sequelize.ENUM('direct','group'), defaultValue: 'direct' },
      name:            { type: Sequelize.STRING(100), allowNull: true },
      avatar_url:      { type: Sequelize.TEXT, allowNull: true },
      last_message_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.createTable('conversation_participants', {
      id:               { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      conversation_id:  { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'conversations', key: 'id' }, onDelete: 'CASCADE' },
      user_id:          { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      joined_at:        { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      last_read_at:     { type: Sequelize.DATE, allowNull: true },
      is_admin:         { type: Sequelize.BOOLEAN, defaultValue: false },
    });
    await queryInterface.createTable('chat_messages', {
      id:               { type: Sequelize.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      conversation_id:  { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'conversations', key: 'id' }, onDelete: 'CASCADE' },
      sender_id:        { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' } },
      content:          { type: Sequelize.TEXT, allowNull: true },
      type:             { type: Sequelize.ENUM('text','image','file','system'), defaultValue: 'text' },
      media_url:        { type: Sequelize.TEXT, allowNull: true },
      is_deleted:       { type: Sequelize.BOOLEAN, defaultValue: false },
      created_at:       { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('conversation_participants', ['conversation_id', 'user_id'], { unique: true });
    await queryInterface.addIndex('chat_messages', ['conversation_id', 'created_at']);
  },
  async down(queryInterface) {
    for (const t of ['chat_messages','conversation_participants','conversations'])
      await queryInterface.dropTable(t);
  }
};
