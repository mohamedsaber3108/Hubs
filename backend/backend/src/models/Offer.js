'use strict';
const { DataTypes } = require('sequelize');

// An organization-owned perk/offer in the Communities catalog. Non-transactional:
// redemption reveals a code / URL / instructions; no payment is processed.
module.exports = (sequelize) => {
  const Offer = sequelize.define('Offer', {
    id:              { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    organization_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    created_by:      { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    title:           { type: DataTypes.STRING(255), allowNull: false },
    description:     { type: DataTypes.TEXT('long'), allowNull: false },
    category:        { type: DataTypes.ENUM('discount','freebie','trial','cashback','service','event','course','other'), defaultValue: 'discount' },
    discount_type:   { type: DataTypes.ENUM('percentage','fixed','bogo','none'), defaultValue: 'percentage' },
    discount_value:  { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    currency:        { type: DataTypes.STRING(3), defaultValue: 'USD' },
    redemption_type: { type: DataTypes.ENUM('code','url','manual'), defaultValue: 'code' },
    redemption_url:  { type: DataTypes.TEXT, allowNull: true },
    redemption_instructions: { type: DataTypes.TEXT, allowNull: true },
    eligible_personas:  { type: DataTypes.JSON, defaultValue: [] },
    target_communities: { type: DataTypes.JSON, defaultValue: [] },
    status:          { type: DataTypes.ENUM('draft','pending','approved','rejected','archived'), defaultValue: 'draft' },
    rejection_reason:{ type: DataTypes.STRING(500), allowNull: true },
    reviewed_by:     { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    reviewed_at:     { type: DataTypes.DATE, allowNull: true },
    total_limit:     { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    per_user_limit:  { type: DataTypes.INTEGER.UNSIGNED, defaultValue: 1 },
    redemptions_count: { type: DataTypes.INTEGER.UNSIGNED, defaultValue: 0 },
    starts_at:       { type: DataTypes.DATE, allowNull: true },
    expires_at:      { type: DataTypes.DATE, allowNull: true },
    is_featured:     { type: DataTypes.BOOLEAN, defaultValue: false },
  }, { tableName: 'offers', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });

  // ─── Domain helpers (pure, unit-testable) ──────────────────────────────────

  // Is the offer live right now (approved + within its validity window)?
  Offer.prototype.isLive = function (now = new Date()) {
    if (this.status !== 'approved') return false;
    if (this.starts_at && now < new Date(this.starts_at)) return false;
    if (this.expires_at && now > new Date(this.expires_at)) return false;
    return true;
  };

  // Has the offer hit its global usage cap?
  Offer.prototype.isSoldOut = function () {
    return this.total_limit != null && this.redemptions_count >= this.total_limit;
  };

  // Does a user with the given personas satisfy eligibility? Empty eligibility
  // list = open to everyone.
  Offer.prototype.isEligible = function (personas = []) {
    const required = Array.isArray(this.eligible_personas) ? this.eligible_personas : [];
    if (required.length === 0) return true;
    const have = Array.isArray(personas) ? personas : [];
    return required.some((p) => have.includes(p));
  };

  return Offer;
};
