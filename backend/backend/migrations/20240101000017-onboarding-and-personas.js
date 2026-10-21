'use strict';

/**
 * BUG-FIX + FEATURE FOUNDATION (P0-1 / P0-3 of the Communities roadmap).
 *
 * The onboarding controller was reading/writing columns that never
 * existed, so GET/POST /api/v1/onboarding both returned HTTP 500
 * (reproduced live). This migration adds the columns the onboarding
 * flow actually needs, and simultaneously introduces the `professional_roles`
 * persona field that the differentiated-community work depends on
 * (freelancer / student / recruiter / employer / entrepreneur /
 * job_seeker / mentor). Purely additive + backward compatible: all new
 * columns are nullable or have defaults; no existing column changes.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    // users.onboarding_completed — the flag the controller reads
    await queryInterface.addColumn('users', 'onboarding_completed', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    // users.professional_roles — multi-value persona (a person can be
    // e.g. student AND freelancer). JSON array of role slugs.
    await queryInterface.addColumn('users', 'professional_roles', {
      type: Sequelize.JSON,
      allowNull: true,
    });

    // onboarding_responses.skills — captured during onboarding; the
    // controller wrote this but the column didn't exist.
    await queryInterface.addColumn('onboarding_responses', 'skills', {
      type: Sequelize.JSON,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('onboarding_responses', 'skills');
    await queryInterface.removeColumn('users', 'professional_roles');
    await queryInterface.removeColumn('users', 'onboarding_completed');
  },
};
