'use strict';
const { DataTypes } = require('sequelize');

// A promo code attached to an offer. A code with no max_uses is effectively a
// shared code; codes with max_uses act as a limited pool.
module.exports = (sequelize) => {
  const PromoCode = sequelize.define('PromoCode', {
    id:         { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    offer_id:   { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    code:       { type: DataTypes.STRING(64), allowNull: false },
    max_uses:   { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    uses_count: { type: DataTypes.INTEGER.UNSIGNED, defaultValue: 0 },
    expires_at: { type: DataTypes.DATE, allowNull: true },
    is_active:  { type: DataTypes.BOOLEAN, defaultValue: true },
  }, { tableName: 'promo_codes', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });

  // Can this code still be handed out?
  PromoCode.prototype.isRedeemable = function (now = new Date()) {
    if (!this.is_active) return false;
    if (this.expires_at && now > new Date(this.expires_at)) return false;
    if (this.max_uses != null && this.uses_count >= this.max_uses) return false;
    return true;
  };

  return PromoCode;
};
