'use strict';
const { Op } = require('sequelize');
const { Organization, OrganizationMember, User, PartnershipRequest } = require('../models');
const ApiError    = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { paginate } = require('../utils/paginate');

const userAttrs = ['id', 'first_name', 'last_name', 'username', 'avatar_url', 'headline'];

// Build a URL-safe slug and ensure uniqueness by suffixing -2, -3, ... .
async function uniqueSlug(name) {
  const base = String(name).toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 140) || 'org';
  let slug = base;
  let n = 1;
  // eslint-disable-next-line no-await-in-loop
  while (await Organization.findOne({ where: { slug } })) {
    n += 1;
    slug = `${base}-${n}`;
  }
  return slug;
}

// Resolve the viewer's role within an org (owner/admin/member) or null.
// Platform admins are treated as org admins for management actions.
async function memberRole(orgId, user) {
  if (!user) return null;
  const m = await OrganizationMember.findOne({ where: { organization_id: orgId, user_id: user.id } });
  return m ? m.role : null;
}
function canManage(role, platformUser) {
  return role === 'owner' || role === 'admin' || (platformUser && platformUser.role === 'admin');
}

// GET /organizations — public list of active orgs.
const listOrganizations = async (req, res, next) => {
  try {
    const { page, limit, offset } = paginate(req.query);
    const { search, verified } = req.query;
    const where = { is_active: true };
    if (verified === 'true') where.is_verified = true;
    if (search) where.name = { [Op.like]: '%' + search + '%' };
    const { count, rows } = await Organization.findAndCountAll({
      where, limit, offset, order: [['is_verified', 'DESC'], ['name', 'ASC']],
      include: [{ model: User, as: 'owner', attributes: userAttrs }],
    });
    return ApiResponse.paginated(res, rows, { page, limit, total: count });
  } catch (err) { next(err); }
};

// GET /organizations/:slug — public profile + the viewer's role.
const getOrganization = async (req, res, next) => {
  try {
    const org = await Organization.findOne({
      where: { slug: req.params.slug },
      include: [{ model: User, as: 'owner', attributes: userAttrs }],
    });
    if (!org) return next(ApiError.notFound('Organization not found'));
    const role = await memberRole(org.id, req.user);
    return ApiResponse.success(res, { organization: org, my_role: role });
  } catch (err) { next(err); }
};

// POST /organizations — any authenticated user can create an org; becomes owner.
const createOrganization = async (req, res, next) => {
  try {
    const slug = await uniqueSlug(req.body.name);
    const org = await Organization.create({ ...req.body, slug, owner_id: req.user.id });
    await OrganizationMember.create({ organization_id: org.id, user_id: req.user.id, role: 'owner' });
    return ApiResponse.created(res, { organization: org }, 'Organization created');
  } catch (err) { next(err); }
};

// PUT /organizations/:slug — owner/admin (or platform admin).
const updateOrganization = async (req, res, next) => {
  try {
    const org = await Organization.findOne({ where: { slug: req.params.slug } });
    if (!org) return next(ApiError.notFound('Organization not found'));
    const role = await memberRole(org.id, req.user);
    if (!canManage(role, req.user)) return next(ApiError.forbidden('Organization managers only'));
    await org.update(req.body);
    return ApiResponse.success(res, { organization: org }, 'Organization updated');
  } catch (err) { next(err); }
};

// GET /organizations/:slug/members — managers only (member list may expose emails).
const getMembers = async (req, res, next) => {
  try {
    const org = await Organization.findOne({ where: { slug: req.params.slug } });
    if (!org) return next(ApiError.notFound('Organization not found'));
    const role = await memberRole(org.id, req.user);
    if (!canManage(role, req.user)) return next(ApiError.forbidden('Organization managers only'));
    const members = await OrganizationMember.findAll({
      where: { organization_id: org.id },
      include: [{ model: User, as: 'user', attributes: userAttrs }],
      order: [['role', 'ASC']],
    });
    return ApiResponse.success(res, { members });
  } catch (err) { next(err); }
};

// ─── Partnerships ──────────────────────────────────────────────────────────────
const orgCardAttrs = ['id', 'slug', 'name', 'logo_url', 'is_verified'];

// POST /organizations/:slug/partnerships — managers of :slug request a
// partnership with { target_slug }.
const requestPartnership = async (req, res, next) => {
  try {
    const org = await Organization.findOne({ where: { slug: req.params.slug } });
    if (!org) return next(ApiError.notFound('Organization not found'));
    const role = await memberRole(org.id, req.user);
    if (!canManage(role, req.user)) return next(ApiError.forbidden('Organization managers only'));

    const target = await Organization.findOne({ where: { slug: req.body.target_slug } });
    if (!target) return next(ApiError.notFound('Target organization not found'));
    if (target.id === org.id) return next(ApiError.badRequest('An organization cannot partner with itself'));

    // Reject if a request already exists in EITHER direction (avoid duplicates /
    // crossed invites).
    const existing = await PartnershipRequest.findOne({
      where: {
        [Op.or]: [
          { requester_org_id: org.id, recipient_org_id: target.id },
          { requester_org_id: target.id, recipient_org_id: org.id },
        ],
        status: { [Op.in]: ['pending', 'accepted'] },
      },
    });
    if (existing) return next(ApiError.conflict('A partnership or pending request already exists between these organizations'));

    const pr = await PartnershipRequest.create({
      requester_org_id: org.id,
      recipient_org_id: target.id,
      created_by: req.user.id,
      message: req.body.message || null,
      status: 'pending',
    });
    return ApiResponse.created(res, { partnership: pr }, 'Partnership request sent');
  } catch (err) { next(err); }
};

// GET /organizations/:slug/partnerships — managers see this org's partnerships
// (sent + received), optionally filtered by status.
const listPartnerships = async (req, res, next) => {
  try {
    const org = await Organization.findOne({ where: { slug: req.params.slug } });
    if (!org) return next(ApiError.notFound('Organization not found'));
    const role = await memberRole(org.id, req.user);
    if (!canManage(role, req.user)) return next(ApiError.forbidden('Organization managers only'));

    const where = {
      [Op.or]: [{ requester_org_id: org.id }, { recipient_org_id: org.id }],
    };
    if (req.query.status) where.status = req.query.status;

    const rows = await PartnershipRequest.findAll({
      where, order: [['created_at', 'DESC']],
      include: [
        { model: Organization, as: 'requesterOrg', attributes: orgCardAttrs },
        { model: Organization, as: 'recipientOrg', attributes: orgCardAttrs },
      ],
    });
    // Annotate direction relative to the viewing org.
    const data = rows.map((r) => ({ ...r.toJSON(), direction: r.requester_org_id === org.id ? 'outgoing' : 'incoming' }));
    return ApiResponse.success(res, { partnerships: data });
  } catch (err) { next(err); }
};

// PATCH /organizations/:slug/partnerships/:id — the RECIPIENT org's managers
// accept/decline a pending request, or either side ends an accepted one.
const respondPartnership = async (req, res, next) => {
  try {
    const org = await Organization.findOne({ where: { slug: req.params.slug } });
    if (!org) return next(ApiError.notFound('Organization not found'));
    const role = await memberRole(org.id, req.user);
    if (!canManage(role, req.user)) return next(ApiError.forbidden('Organization managers only'));

    const pr = await PartnershipRequest.findByPk(req.params.id);
    if (!pr) return next(ApiError.notFound('Partnership request not found'));
    // The acting org must be a party to this request.
    if (pr.requester_org_id !== org.id && pr.recipient_org_id !== org.id) {
      return next(ApiError.forbidden('Your organization is not party to this request'));
    }

    const { action } = req.body; // accept | decline | end
    if (action === 'accept' || action === 'decline') {
      if (pr.status !== 'pending') return next(ApiError.badRequest('Only pending requests can be responded to'));
      // Only the RECIPIENT may accept/decline.
      if (pr.recipient_org_id !== org.id) return next(ApiError.forbidden('Only the recipient organization can respond'));
      await pr.update({
        status: action === 'accept' ? 'accepted' : 'declined',
        responded_by: req.user.id,
        responded_at: new Date(),
      });
    } else if (action === 'end') {
      if (pr.status !== 'accepted') return next(ApiError.badRequest('Only an accepted partnership can be ended'));
      await pr.update({ status: 'ended', responded_by: req.user.id, responded_at: new Date() });
    } else {
      return next(ApiError.badRequest('Invalid action'));
    }
    return ApiResponse.success(res, { partnership: pr }, 'Partnership updated');
  } catch (err) { next(err); }
};

module.exports = {
  listOrganizations, getOrganization, createOrganization, updateOrganization, getMembers,
  requestPartnership, listPartnerships, respondPartnership,
  // exported for reuse by the offer controller + tests
  _internal: { memberRole, canManage, uniqueSlug },
};
