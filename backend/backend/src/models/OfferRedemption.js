'use strict';
const { DataTypes } = require('sequelize');

// A user's redemption of an offer. Records intent + a snapshot of the revealed
// code; non-transactional (no payment captured here).
module.exports = (sequelize) => sequelize.define('OfferRedemption', {
  id:            { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  offer_id:      { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  user_id:       { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  promo_code_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  code_snapshot: { type: DataTypes.STRING(64), allowNull: true },
  status:        { type: DataTypes.ENUM('redeemed','used','expired','cancelled'), defaultValue: 'redeemed' },
  redeemed_at:   { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, { tableName: 'offer_redemptions', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });
