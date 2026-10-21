'use strict';
const { Op } = require('sequelize');
const { Offer, Organization, OfferRedemption, User, ActivityLog } = require('../models');
const ApiError    = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { paginate } = require('../utils/paginate');
const logger = require('../utils/logger');

async function logAction(adminId, action, req, extra) {
  try { await ActivityLog.create({ admin_id: adminId, action, ip_address: req.ip, ...extra }); }
  catch (e) { logger.warn('Log error: ' + e.message); }
}

const orgAttrs = ['id', 'slug', 'name', 'is_verified'];

// ─── Offers moderation ────────────────────────────────────────────────────────

// GET /admin/offers — all offers, filterable by status (default: pending queue).
const listOffers = async (req, res, next) => {
  try {
    const { page, limit, offset } = paginate(req.query);
    const { status = 'pending', search } = req.query;
    const where = {};
    if (status !== 'all') where.status = status;
    if (search) where.title = { [Op.like]: '%' + search + '%' };
    const { count, rows } = await Offer.findAndCountAll({
      where, limit, offset, order: [['created_at', 'DESC']],
      include: [
        { model: Organization, as: 'organization', attributes: orgAttrs },
        { model: User, as: 'creator', attributes: ['id', 'first_name', 'last_name', 'username'] },
      ],
    });
    return ApiResponse.paginated(res, rows, { page, limit, total: count });
  } catch (err) { next(err); }
};

// PATCH /admin/offers/:id/review — approve or reject a pending offer.
const reviewOffer = async (req, res, next) => {
  try {
    const offer = await Offer.findByPk(req.params.id);
    if (!offer) return next(ApiError.notFound('Offer not found'));
    if (offer.status !== 'pending') return next(ApiError.badRequest('Only pending offers can be reviewed'));

    const { decision, reason } = req.body;
    await offer.update({
      status: decision, // 'approved' | 'rejected'
      rejection_reason: decision === 'rejected' ? reason : null,
      reviewed_by: req.admin.id,
      reviewed_at: new Date(),
    });
    await logAction(req.admin.id, 'offer.' + decision, req, { entity_type: 'offer', entity_id: offer.id });
    return ApiResponse.success(res, { offer }, 'Offer ' + decision);
  } catch (err) { next(err); }
};

// GET /admin/offers/:id/redemptions — redemption audit for an offer.
const listRedemptions = async (req, res, next) => {
  try {
    const { page, limit, offset } = paginate(req.query);
    const { count, rows } = await OfferRedemption.findAndCountAll({
      where: { offer_id: req.params.id }, limit, offset, order: [['created_at', 'DESC']],
      include: [{ model: User, as: 'user', attributes: ['id', 'first_name', 'last_name', 'username', 'email'] }],
    });
    return ApiResponse.paginated(res, rows, { page, limit, total: count });
  } catch (err) { next(err); }
};

// ─── Organization verification ────────────────────────────────────────────────

// GET /admin/organizations
const listOrganizations = async (req, res, next) => {
  try {
    const { page, limit, offset } = paginate(req.query);
    const { verified, search } = req.query;
    const where = {};
    if (verified === 'true')  where.is_verified = true;
    if (verified === 'false') where.is_verified = false;
    if (search) where.name = { [Op.like]: '%' + search + '%' };
    const { count, rows } = await Organization.findAndCountAll({
      where, limit, offset, order: [['created_at', 'DESC']],
      include: [{ model: User, as: 'owner', attributes: ['id', 'first_name', 'last_name', 'username'] }],
    });
    return ApiResponse.paginated(res, rows, { page, limit, total: count });
  } catch (err) { next(err); }
};

// PATCH /admin/organizations/:id/verify — toggle verification.
const setVerification = async (req, res, next) => {
  try {
    const org = await Organization.findByPk(req.params.id);
    if (!org) return next(ApiError.notFound('Organization not found'));
    const verified = req.body.verified !== false;
    await org.update({ is_verified: verified });
    await logAction(req.admin.id, verified ? 'org.verify' : 'org.unverify', req, { entity_type: 'organization', entity_id: org.id });
    return ApiResponse.success(res, { organization: org }, verified ? 'Organization verified' : 'Verification revoked');
  } catch (err) { next(err); }
};

module.exports = { listOffers, reviewOffer, listRedemptions, listOrganizations, setVerification };
