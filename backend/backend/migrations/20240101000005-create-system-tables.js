'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('settings', {
      id:         { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      key:        { type: Sequelize.STRING(100), allowNull: false, unique: true },
      value:      { type: Sequelize.TEXT, allowNull: true },
      type:       { type: Sequelize.ENUM('string','number','boolean','json'), defaultValue: 'string' },
      group:      { type: Sequelize.STRING(50), defaultValue: 'general' },
      is_public:  { type: Sequelize.BOOLEAN, defaultValue: false },
      updated_by: { type: Sequelize.INTEGER.UNSIGNED, allowNull: true },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.createTable('feature_flags', {
      id:          { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      name:        { type: Sequelize.STRING(100), allowNull: false, unique: true },
      is_enabled:  { type: Sequelize.BOOLEAN, defaultValue: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      updated_by:  { type: Sequelize.INTEGER.UNSIGNED, allowNull: true },
      updated_at:  { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.createTable('activity_logs', {
      id:          { type: Sequelize.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      user_id:     { type: Sequelize.INTEGER.UNSIGNED, allowNull: true },
      admin_id:    { type: Sequelize.INTEGER.UNSIGNED, allowNull: true },
      action:      { type: Sequelize.STRING(100), allowNull: false },
      entity_type: { type: Sequelize.STRING(50), allowNull: true },
      entity_id:   { type: Sequelize.INTEGER.UNSIGNED, allowNull: true },
      old_value:   { type: Sequelize.JSON, allowNull: true },
      new_value:   { type: Sequelize.JSON, allowNull: true },
      ip_address:  { type: Sequelize.STRING(50), allowNull: true },
      created_at:  { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.createTable('notifications', {
      id:         { type: Sequelize.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      user_id:    { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      title:      { type: Sequelize.STRING(255), allowNull: false },
      message:    { type: Sequelize.TEXT, allowNull: false },
      type:       { type: Sequelize.ENUM('info','success','warning','mention','follow','like','comment','message','challenge','opportunity','event'), defaultValue: 'info' },
      is_read:    { type: Sequelize.BOOLEAN, defaultValue: false },
      data:       { type: Sequelize.JSON },
      action_url: { type: Sequelize.STRING(255), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.createTable('media', {
      id:            { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      file_name:     { type: Sequelize.STRING(255), allowNull: false },
      original_name: { type: Sequelize.STRING(255), allowNull: false },
      file_url:      { type: Sequelize.TEXT, allowNull: false },
      s3_key:        { type: Sequelize.STRING(500), allowNull: false },
      file_type:     { type: Sequelize.STRING(50), allowNull: false },
      file_size:     { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      uploaded_by:   { type: Sequelize.INTEGER.UNSIGNED, allowNull: true },
      created_at:    { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.createTable('email_templates', {
      id:         { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      name:       { type: Sequelize.STRING(100), allowNull: false, unique: true },
      subject:    { type: Sequelize.STRING(255), allowNull: false },
      html_body:  { type: Sequelize.TEXT('long'), allowNull: false },
      variables:  { type: Sequelize.JSON },
      updated_by: { type: Sequelize.INTEGER.UNSIGNED, allowNull: true },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
  },
  async down(queryInterface) {
    for (const t of ['email_templates','media','notifications','activity_logs','feature_flags','settings'])
      await queryInterface.dropTable(t);
  }
};
