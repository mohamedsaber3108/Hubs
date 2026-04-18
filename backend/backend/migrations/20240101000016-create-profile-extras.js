'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('user_skills', {
      id:      { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      user_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      skill:   { type: Sequelize.STRING(100), allowNull: false },
      level:   { type: Sequelize.ENUM('beginner','intermediate','expert'), defaultValue: 'intermediate' },
      created_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.createTable('user_experiences', {
      id:          { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      user_id:     { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      title:       { type: Sequelize.STRING(255), allowNull: false },
      company:     { type: Sequelize.STRING(255), allowNull: false },
      location:    { type: Sequelize.STRING(255), allowNull: true },
      start_date:  { type: Sequelize.DATEONLY, allowNull: false },
      end_date:    { type: Sequelize.DATEONLY, allowNull: true },
      is_current:  { type: Sequelize.BOOLEAN, defaultValue: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      created_at:  { type: Sequelize.DATE, allowNull: false },
      updated_at:  { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.createTable('user_educations', {
      id:          { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      user_id:     { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      institution: { type: Sequelize.STRING(255), allowNull: false },
      degree:      { type: Sequelize.STRING(100), allowNull: true },
      field:       { type: Sequelize.STRING(100), allowNull: true },
      start_year:  { type: Sequelize.SMALLINT.UNSIGNED, allowNull: true },
      end_year:    { type: Sequelize.SMALLINT.UNSIGNED, allowNull: true },
      is_current:  { type: Sequelize.BOOLEAN, defaultValue: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      created_at:  { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.createTable('follows', {
      id:           { type: Sequelize.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      follower_id:  { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      following_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      created_at:   { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('follows', ['follower_id', 'following_id'], { unique: true });
    await queryInterface.createTable('onboarding_responses', {
      id:               { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      user_id:          { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, unique: true, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      goals:            { type: Sequelize.JSON },
      interests:        { type: Sequelize.JSON },
      experience_level: { type: Sequelize.ENUM('beginner','intermediate','expert'), defaultValue: 'beginner' },
      communities:      { type: Sequelize.JSON },
      completed:        { type: Sequelize.BOOLEAN, defaultValue: false },
      created_at:       { type: Sequelize.DATE, allowNull: false },
      updated_at:       { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.createTable('pricing_plans', {
      id:            { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      name:          { type: Sequelize.STRING(50), allowNull: false },
      slug:          { type: Sequelize.STRING(50), allowNull: false, unique: true },
      price_monthly: { type: Sequelize.DECIMAL(10,2), defaultValue: 0.00 },
      price_yearly:  { type: Sequelize.DECIMAL(10,2), defaultValue: 0.00 },
      features:      { type: Sequelize.JSON },
      limits:        { type: Sequelize.JSON },
      is_active:     { type: Sequelize.BOOLEAN, defaultValue: true },
      sort_order:    { type: Sequelize.TINYINT.UNSIGNED, defaultValue: 0 },
      created_at:    { type: Sequelize.DATE, allowNull: false },
      updated_at:    { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.createTable('subscriptions', {
      id:           { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      user_id:      { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      plan_id:      { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'pricing_plans', key: 'id' } },
      status:       { type: Sequelize.ENUM('active','cancelled','expired','trial'), defaultValue: 'active' },
      billing:      { type: Sequelize.ENUM('monthly','yearly'), defaultValue: 'monthly' },
      started_at:   { type: Sequelize.DATE, allowNull: false },
      expires_at:   { type: Sequelize.DATE, allowNull: true },
      cancelled_at: { type: Sequelize.DATE, allowNull: true },
      payment_ref:  { type: Sequelize.STRING(255), allowNull: true },
      created_at:   { type: Sequelize.DATE, allowNull: false },
      updated_at:   { type: Sequelize.DATE, allowNull: false },
    });
  },
  async down(queryInterface) {
    for (const t of ['subscriptions','pricing_plans','onboarding_responses','follows','user_educations','user_experiences','user_skills'])
      await queryInterface.dropTable(t);
  }
};
