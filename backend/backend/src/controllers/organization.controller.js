'use strict';
const { Op } = require('sequelize');
const { Organization, OrganizationMember, User, Offer } = require('../models');
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

module.exports = {
  listOrganizations, getOrganization, createOrganization, updateOrganization, getMembers,
  // exported for reuse by the offer controller + tests
  _internal: { memberRole, canManage, uniqueSlug },
};
