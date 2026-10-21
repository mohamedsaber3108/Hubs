'use strict';

/**
 * Track B-9 / Priority 3 — Partnership requests between organizations.
 *
 * A directed request from one org (requester) to another (recipient) to form
 * a partnership. Recipients accept/decline; either side can later end an
 * accepted partnership. Builds on the B-8 organizations table (ADR-006);
 * does NOT duplicate org identity or membership.
 *
 * Additive; no existing table altered.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('partnership_requests', {
      id:               { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      requester_org_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'organizations', key: 'id' }, onDelete: 'CASCADE' },
      recipient_org_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'organizations', key: 'id' }, onDelete: 'CASCADE' },
      // Who initiated (an org manager); kept for audit.
      created_by:       { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' } },
      message:          { type: Sequelize.TEXT, allowNull: true },
      // pending -> accepted | declined; ended is a terminal state for a prior
      // accepted partnership.
      status:           { type: Sequelize.ENUM('pending', 'accepted', 'declined', 'ended'), defaultValue: 'pending' },
      responded_by:     { type: Sequelize.INTEGER.UNSIGNED, allowNull: true },
      responded_at:     { type: Sequelize.DATE, allowNull: true },
      created_at:       { type: Sequelize.DATE, allowNull: false },
      updated_at:       { type: Sequelize.DATE, allowNull: false },
    });
    // One active request/partnership per ordered pair (requester -> recipient).
    await queryInterface.addIndex('partnership_requests', ['requester_org_id', 'recipient_org_id'], {
      unique: true, name: 'partnership_pair_unique',
    });
    await queryInterface.addIndex('partnership_requests', ['recipient_org_id', 'status']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('partnership_requests');
  },
};
