'use strict';
const { Op } = require('sequelize');
const {
  sequelize, Offer, Organization, OrganizationMember, PromoCode, OfferRedemption, User,
} = require('../models');
const ApiError    = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { paginate } = require('../utils/paginate');
const { createNotification } = require('../services/notification.service');

const orgAttrs = ['id', 'slug', 'name', 'logo_url', 'is_verified'];

// Resolve the viewer's management rights over the offer's org.
async function canManageOffer(offer, user) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  const m = await OrganizationMember.findOne({ where: { organization_id: offer.organization_id, user_id: user.id } });
  return !!m && (m.role === 'owner' || m.role === 'admin');
}

// Fetch the viewer's personas (for eligibility). Returns [] when anonymous.
async function viewerPersonas(user) {
  if (!user) return [];
  const full = await User.findByPk(user.id, { attributes: ['professional_roles'] });
  return Array.isArray(full && full.professional_roles) ? full.professional_roles : [];
}

// ─── Public catalog ─────────────────────────────────────────────────────────

// GET /offers — live catalog (approved + within window), filterable by
// category, organization, community targeting, and search.
const listOffers = async (req, res, next) => {
  try {
    const { page, limit, offset } = paginate(req.query);
    const { category, organization, community, search, featured } = req.query;
    const now = new Date();

    const where = {
      status: 'approved',
      [Op.and]: [
        { [Op.or]: [{ starts_at: null }, { starts_at: { [Op.lte]: now } }] },
        { [Op.or]: [{ expires_at: null }, { expires_at: { [Op.gt]: now } }] },
      ],
    };
    if (category) where.category = category;
    if (featured === 'true') where.is_featured = true;
    if (search) where.title = { [Op.like]: '%' + search + '%' };

    const include = [{ model: Organization, as: 'organization', attributes: orgAttrs }];
    if (organization) include[0].where = { slug: organization };

    const { count, rows } = await Offer.findAndCountAll({
      where, include, limit, offset,
      order: [['is_featured', 'DESC'], ['created_at', 'DESC']],
      distinct: true,
    });

    // Community targeting is stored as a JSON array; filter in-app (MySQL JSON
    // predicate portability is poor across versions). Empty target = all.
    let data = rows.map((o) => o.toJSON());
    if (community) {
      data = data.filter((o) => {
        const t = Array.isArray(o.target_communities) ? o.target_communities : [];
        return t.length === 0 || t.includes(community);
      });
    }

    // Annotate eligibility + sold-out for the viewer (does not hide ineligible
    // offers — they are shown as locked so users understand what's available).
    const personas = await viewerPersonas(req.user);
    data = data.map((o) => {
      const eligible = !Array.isArray(o.eligible_personas) || o.eligible_personas.length === 0
        || o.eligible_personas.some((p) => personas.includes(p));
      const soldOut = o.total_limit != null && o.redemptions_count >= o.total_limit;
      return { ...o, eligible, sold_out: soldOut };
    });

    return ApiResponse.paginated(res, data, { page, limit, total: community ? data.length : count });
  } catch (err) { next(err); }
};

// GET /offers/:id — single offer. Live offers are public; non-live offers are
// visible only to managers.
const getOffer = async (req, res, next) => {
  try {
    const offer = await Offer.findByPk(req.params.id, {
      include: [{ model: Organization, as: 'organization', attributes: orgAttrs }],
    });
    if (!offer) return next(ApiError.notFound('Offer not found'));

    const manage = await canManageOffer(offer, req.user);
    if (!offer.isLive() && !manage) return next(ApiError.notFound('Offer not found'));

    const personas = await viewerPersonas(req.user);
    let myRedemption = null;
    if (req.user) {
      myRedemption = await OfferRedemption.findOne({
        where: { offer_id: offer.id, user_id: req.user.id },
        order: [['created_at', 'DESC']],
      });
    }
    return ApiResponse.success(res, {
      offer,
      eligible: offer.isEligible(personas),
      sold_out: offer.isSoldOut(),
      my_redemption: myRedemption,
      can_manage: manage,
    });
  } catch (err) { next(err); }
};

// ─── Org-owned management ─────────────────────────────────────────────────────

// POST /organizations/:slug/offers — create an offer under an org (managers).
const createOffer = async (req, res, next) => {
  try {
    const org = await Organization.findOne({ where: { slug: req.params.slug } });
    if (!org) return next(ApiError.notFound('Organization not found'));
    const m = await OrganizationMember.findOne({ where: { organization_id: org.id, user_id: req.user.id } });
    const manage = (m && (m.role === 'owner' || m.role === 'admin')) || req.user.role === 'admin';
    if (!manage) return next(ApiError.forbidden('Organization managers only'));

    const offer = await Offer.create({
      ...req.body,
      organization_id: org.id,
      created_by: req.user.id,
      status: 'draft',
    });
    return ApiResponse.created(res, { offer }, 'Offer created as draft');
  } catch (err) { next(err); }
};

// PUT /offers/:id — managers. Editing an approved/pending offer sends it back
// to draft so changes are re-reviewed.
const updateOffer = async (req, res, next) => {
  try {
    const offer = await Offer.findByPk(req.params.id);
    if (!offer) return next(ApiError.notFound('Offer not found'));
    if (!(await canManageOffer(offer, req.user))) return next(ApiError.forbidden('Organization managers only'));
    if (offer.status === 'archived') return next(ApiError.badRequest('Archived offers cannot be edited'));

    const patch = { ...req.body };
    if (['approved', 'pending', 'rejected'].includes(offer.status)) {
      patch.status = 'draft';
      patch.reviewed_by = null;
      patch.reviewed_at = null;
      patch.rejection_reason = null;
    }
    await offer.update(patch);
    return ApiResponse.success(res, { offer }, 'Offer updated');
  } catch (err) { next(err); }
};

// POST /offers/:id/submit — managers move a draft/rejected offer to pending.
const submitOffer = async (req, res, next) => {
  try {
    const offer = await Offer.findByPk(req.params.id, { include: [{ model: Organization, as: 'organization' }] });
    if (!offer) return next(ApiError.notFound('Offer not found'));
    if (!(await canManageOffer(offer, req.user))) return next(ApiError.forbidden('Organization managers only'));
    if (!['draft', 'rejected'].includes(offer.status)) return next(ApiError.badRequest('Only draft or rejected offers can be submitted'));
    if (!offer.organization || !offer.organization.is_verified) {
      return next(ApiError.badRequest('Organization must be verified before submitting offers'));
    }
    await offer.update({ status: 'pending', rejection_reason: null });
    return ApiResponse.success(res, { offer }, 'Offer submitted for review');
  } catch (err) { next(err); }
};

// DELETE /offers/:id — managers archive (soft) an offer.
const archiveOffer = async (req, res, next) => {
  try {
    const offer = await Offer.findByPk(req.params.id);
    if (!offer) return next(ApiError.notFound('Offer not found'));
    if (!(await canManageOffer(offer, req.user))) return next(ApiError.forbidden('Organization managers only'));
    await offer.update({ status: 'archived' });
    return ApiResponse.success(res, null, 'Offer archived');
  } catch (err) { next(err); }
};

// GET /organizations/:slug/offers — managers see all their offers (any status).
const listOrgOffers = async (req, res, next) => {
  try {
    const org = await Organization.findOne({ where: { slug: req.params.slug } });
    if (!org) return next(ApiError.notFound('Organization not found'));
    const m = await OrganizationMember.findOne({ where: { organization_id: org.id, user_id: req.user.id } });
    const manage = (m && (m.role === 'owner' || m.role === 'admin')) || req.user.role === 'admin';
    if (!manage) return next(ApiError.forbidden('Organization managers only'));
    const offers = await Offer.findAll({
      where: { organization_id: org.id },
      order: [['created_at', 'DESC']],
    });
    return ApiResponse.success(res, { offers });
  } catch (err) { next(err); }
};

// ─── Promo codes (managers) ───────────────────────────────────────────────────

// POST /offers/:id/promo-codes
const addPromoCode = async (req, res, next) => {
  try {
    const offer = await Offer.findByPk(req.params.id);
    if (!offer) return next(ApiError.notFound('Offer not found'));
    if (!(await canManageOffer(offer, req.user))) return next(ApiError.forbidden('Organization managers only'));
    const existing = await PromoCode.findOne({ where: { offer_id: offer.id, code: req.body.code } });
    if (existing) return next(ApiError.conflict('Code already exists for this offer'));
    const code = await PromoCode.create({ ...req.body, offer_id: offer.id });
    return ApiResponse.created(res, { promo_code: code }, 'Promo code added');
  } catch (err) { next(err); }
};

// GET /offers/:id/promo-codes
const listPromoCodes = async (req, res, next) => {
  try {
    const offer = await Offer.findByPk(req.params.id);
    if (!offer) return next(ApiError.notFound('Offer not found'));
    if (!(await canManageOffer(offer, req.user))) return next(ApiError.forbidden('Organization managers only'));
    const codes = await PromoCode.findAll({ where: { offer_id: offer.id }, order: [['created_at', 'DESC']] });
    return ApiResponse.success(res, { promo_codes: codes });
  } catch (err) { next(err); }
};

// ─── Redemption (end users) ───────────────────────────────────────────────────

// POST /offers/:id/redeem — records a redemption, enforcing live-status,
// eligibility, per-user + total usage limits, and promo-code availability.
// Non-transactional: reveals a code / URL / instructions; no payment.
const redeemOffer = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    // Lock the offer row so concurrent redemptions can't oversell the limit.
    const offer = await Offer.findByPk(req.params.id, { lock: t.LOCK.UPDATE, transaction: t });
    if (!offer) { await t.rollback(); return next(ApiError.notFound('Offer not found')); }
    if (!offer.isLive()) { await t.rollback(); return next(ApiError.badRequest('Offer is not currently available')); }
    if (offer.isSoldOut()) { await t.rollback(); return next(ApiError.badRequest('Offer has reached its redemption limit')); }

    const personas = await viewerPersonas(req.user);
    if (!offer.isEligible(personas)) {
      await t.rollback();
      return next(ApiError.forbidden('You are not eligible for this offer'));
    }

    const userCount = await OfferRedemption.count({
      where: { offer_id: offer.id, user_id: req.user.id, status: { [Op.ne]: 'cancelled' } },
      transaction: t,
    });
    if (offer.per_user_limit != null && userCount >= offer.per_user_limit) {
      await t.rollback();
      return next(ApiError.conflict('You have already redeemed this offer'));
    }

    // Allocate a promo code if the offer uses codes.
    let promoCode = null;
    let codeSnapshot = null;
    if (offer.redemption_type === 'code') {
      const now = new Date();
      const candidates = await PromoCode.findAll({
        where: {
          offer_id: offer.id, is_active: true,
          [Op.or]: [{ expires_at: null }, { expires_at: { [Op.gt]: now } }],
        },
        order: [['id', 'ASC']],
        lock: t.LOCK.UPDATE,
        transaction: t,
      });
      promoCode = candidates.find((c) => c.max_uses == null || c.uses_count < c.max_uses) || null;
      if (!promoCode) {
        await t.rollback();
        return next(ApiError.badRequest('No promo codes available for this offer'));
      }
      await promoCode.increment('uses_count', { transaction: t });
      codeSnapshot = promoCode.code;
    }

    const redemption = await OfferRedemption.create({
      offer_id: offer.id, user_id: req.user.id,
      promo_code_id: promoCode ? promoCode.id : null,
      code_snapshot: codeSnapshot,
      status: 'redeemed', redeemed_at: new Date(),
    }, { transaction: t });

    await offer.increment('redemptions_count', { transaction: t });
    await t.commit();

    // Notify the offer creator (best-effort, outside the transaction).
    createNotification(offer.created_by, {
      // Notification.type ENUM has no 'offer' value; use 'info' + an action_url
      // so the link still points at the offer. (Avoids an ENUM migration for a
      // best-effort notification.)
      title: 'Offer redeemed',
      message: `${req.user.first_name} ${req.user.last_name} redeemed "${offer.title}"`,
      type: 'info',
      actionUrl: '/offers/' + offer.id,
    });

    return ApiResponse.created(res, {
      redemption,
      code: codeSnapshot,
      redemption_url: offer.redemption_url,
      redemption_instructions: offer.redemption_instructions,
    }, 'Offer redeemed');
  } catch (err) {
    await t.rollback();
    next(err);
  }
};

// GET /offers/redemptions/me — the viewer's redemption history.
const myRedemptions = async (req, res, next) => {
  try {
    const { page, limit, offset } = paginate(req.query);
    const { count, rows } = await OfferRedemption.findAndCountAll({
      where: { user_id: req.user.id },
      include: [{ model: Offer, as: 'offer', include: [{ model: Organization, as: 'organization', attributes: orgAttrs }] }],
      order: [['created_at', 'DESC']], limit, offset,
    });
    return ApiResponse.paginated(res, rows, { page, limit, total: count });
  } catch (err) { next(err); }
};

module.exports = {
  listOffers, getOffer,
  createOffer, updateOffer, submitOffer, archiveOffer, listOrgOffers,
  addPromoCode, listPromoCodes,
  redeemOffer, myRedemptions,
};
