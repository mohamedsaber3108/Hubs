'use strict';

/**
 * Track B-8 — Organizations + Offers & Perks catalog.
 *
 * Non-transactional by design: redemptions record intent and reveal a
 * code / redemption instructions; NO payment is processed (payments wait
 * for an approved provider — see ADR-008 / project constraints).
 *
 * ADR-006: organization identity is modeled locally with a nullable
 * `global_org_id` placeholder so a future ecosystem SSO can reconcile orgs
 * without a schema change. Membership + data stay product-local.
 *
 * All additive; no existing table is altered.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    // ─── organizations ──────────────────────────────────────────────────────
    await queryInterface.createTable('organizations', {
      id:            { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      // Nullable reference to a future global (SSO) org identity. Local until then.
      global_org_id: { type: Sequelize.STRING(64), allowNull: true },
      owner_id:      { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      name:          { type: Sequelize.STRING(150), allowNull: false },
      slug:          { type: Sequelize.STRING(150), allowNull: false, unique: true },
      tagline:       { type: Sequelize.STRING(255), allowNull: true },
      description:   { type: Sequelize.TEXT, allowNull: true },
      logo_url:      { type: Sequelize.TEXT, allowNull: true },
      website:       { type: Sequelize.STRING(255), allowNull: true },
      industry:      { type: Sequelize.STRING(100), allowNull: true },
      // Admin-gated verification — an org must be verified before its offers
      // can go live (approval workflow references this).
      is_verified:   { type: Sequelize.BOOLEAN, defaultValue: false },
      is_active:     { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at:    { type: Sequelize.DATE, allowNull: false },
      updated_at:    { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('organizations', ['is_active', 'is_verified']);

    // ─── organization_members ───────────────────────────────────────────────
    await queryInterface.createTable('organization_members', {
      id:              { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      organization_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'organizations', key: 'id' }, onDelete: 'CASCADE' },
      user_id:         { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      // Product-local role, distinct from platform User.role and Community role.
      role:            { type: Sequelize.ENUM('owner', 'admin', 'member'), defaultValue: 'member' },
      created_at:      { type: Sequelize.DATE, allowNull: false },
      updated_at:      { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('organization_members', ['organization_id', 'user_id'], { unique: true });

    // ─── offers ─────────────────────────────────────────────────────────────
    await queryInterface.createTable('offers', {
      id:              { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      organization_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'organizations', key: 'id' }, onDelete: 'CASCADE' },
      created_by:      { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' } },
      title:           { type: Sequelize.STRING(255), allowNull: false },
      description:     { type: Sequelize.TEXT('long'), allowNull: false },
      category:        { type: Sequelize.ENUM('discount','freebie','trial','cashback','service','event','course','other'), defaultValue: 'discount' },
      // Discount expression. `none` supports non-discount perks (freebies/trials).
      discount_type:   { type: Sequelize.ENUM('percentage','fixed','bogo','none'), defaultValue: 'percentage' },
      discount_value:  { type: Sequelize.DECIMAL(10, 2), allowNull: true },
      currency:        { type: Sequelize.STRING(3), defaultValue: 'USD' },
      // How the perk is claimed once redeemed (shown to the user on redeem).
      redemption_type: { type: Sequelize.ENUM('code','url','manual'), defaultValue: 'code' },
      redemption_url:  { type: Sequelize.TEXT, allowNull: true },
      redemption_instructions: { type: Sequelize.TEXT, allowNull: true },
      // Eligibility: personas allowed to redeem (empty = everyone). JSON array
      // mirrors users.professional_roles values.
      eligible_personas: { type: Sequelize.JSON, defaultValue: [] },
      // Targeting: community slugs this offer surfaces in (empty = all communities).
      target_communities: { type: Sequelize.JSON, defaultValue: [] },
      // Approval workflow: draft -> pending -> approved | rejected; archived is terminal.
      status:          { type: Sequelize.ENUM('draft','pending','approved','rejected','archived'), defaultValue: 'draft' },
      rejection_reason:{ type: Sequelize.STRING(500), allowNull: true },
      reviewed_by:     { type: Sequelize.INTEGER.UNSIGNED, allowNull: true },
      reviewed_at:     { type: Sequelize.DATE, allowNull: true },
      // Usage limits: total across all users, and per-user cap.
      total_limit:     { type: Sequelize.INTEGER.UNSIGNED, allowNull: true },
      per_user_limit:  { type: Sequelize.INTEGER.UNSIGNED, defaultValue: 1 },
      redemptions_count: { type: Sequelize.INTEGER.UNSIGNED, defaultValue: 0 },
      // Validity window.
      starts_at:       { type: Sequelize.DATE, allowNull: true },
      expires_at:      { type: Sequelize.DATE, allowNull: true },
      is_featured:     { type: Sequelize.BOOLEAN, defaultValue: false },
      created_at:      { type: Sequelize.DATE, allowNull: false },
      updated_at:      { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('offers', ['status', 'expires_at']);
    await queryInterface.addIndex('offers', ['organization_id']);

    // ─── promo_codes ────────────────────────────────────────────────────────
    // An offer can carry zero or more promo codes. A shared code (no cap) or
    // single-use codes allocated on redemption are both supported.
    await queryInterface.createTable('promo_codes', {
      id:            { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      offer_id:      { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'offers', key: 'id' }, onDelete: 'CASCADE' },
      code:          { type: Sequelize.STRING(64), allowNull: false },
      max_uses:      { type: Sequelize.INTEGER.UNSIGNED, allowNull: true }, // null = unlimited
      uses_count:    { type: Sequelize.INTEGER.UNSIGNED, defaultValue: 0 },
      expires_at:    { type: Sequelize.DATE, allowNull: true },
      is_active:     { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at:    { type: Sequelize.DATE, allowNull: false },
      updated_at:    { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('promo_codes', ['offer_id', 'code'], { unique: true });

    // ─── offer_redemptions ──────────────────────────────────────────────────
    await queryInterface.createTable('offer_redemptions', {
      id:            { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      offer_id:      { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'offers', key: 'id' }, onDelete: 'CASCADE' },
      user_id:       { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      promo_code_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: true, references: { model: 'promo_codes', key: 'id' }, onDelete: 'SET NULL' },
      // Snapshot of the code revealed to the user (so history survives code edits).
      code_snapshot: { type: Sequelize.STRING(64), allowNull: true },
      status:        { type: Sequelize.ENUM('redeemed','used','expired','cancelled'), defaultValue: 'redeemed' },
      redeemed_at:   { type: Sequelize.DATE, allowNull: false },
      created_at:    { type: Sequelize.DATE, allowNull: false },
      updated_at:    { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('offer_redemptions', ['offer_id', 'user_id']);
    await queryInterface.addIndex('offer_redemptions', ['user_id']);
  },

  async down(queryInterface) {
    for (const t of ['offer_redemptions', 'promo_codes', 'offers', 'organization_members', 'organizations']) {
      await queryInterface.dropTable(t);
    }
  },
};
