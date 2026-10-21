'use strict';
const { Community, CommunityMembership, User } = require('../models');
const ApiError    = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

const getAll = async (req, res, next) => {
  try {
    // BUG-07: `sort_order` is a real column on PricingPlan, not on
    // Community -- caused GET /communities to 500 on its happy path.
    const communities = await Community.findAll({ where: { is_active: true }, order: [['id', 'ASC']] });
    return ApiResponse.success(res, { communities });
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const community = await Community.findOne({ where: { slug: req.params.slug, is_active: true } });
    if (!community) return next(ApiError.notFound('Community not found'));
    let membership = null;
    if (req.user) {
      membership = await CommunityMembership.findOne({ where: { user_id: req.user.id, community_id: community.id } });
    }
    return ApiResponse.success(res, { community, membership });
  } catch (err) { next(err); }
};

const join = async (req, res, next) => {
  try {
    const community = await Community.findOne({ where: { slug: req.params.slug } });
    if (!community) return next(ApiError.notFound('Community not found'));
    const [, created] = await CommunityMembership.findOrCreate({
      where: { user_id: req.user.id, community_id: community.id },
      defaults: { role: 'member' },
    });
    if (created) await Community.increment('members_count', { where: { id: community.id } });
    return ApiResponse.success(res, { joined: true }, created ? 'Joined community' : 'Already a member');
  } catch (err) { next(err); }
};

const leave = async (req, res, next) => {
  try {
    const community = await Community.findOne({ where: { slug: req.params.slug } });
    if (!community) return next(ApiError.notFound('Community not found'));
    const deleted = await CommunityMembership.destroy({ where: { user_id: req.user.id, community_id: community.id } });
    if (deleted) await Community.decrement('members_count', { where: { id: community.id } });
    return ApiResponse.success(res, { joined: false }, 'Left community');
  } catch (err) { next(err); }
};

const getMembers = async (req, res, next) => {
  try {
    const community = await Community.findOne({ where: { slug: req.params.slug } });
    if (!community) return next(ApiError.notFound('Community not found'));
    const members = await CommunityMembership.findAll({
      where: { community_id: community.id },
      include: [{ model: User, as: 'user', attributes: ['id','first_name','last_name','username','avatar_url','headline'] }],
      limit: 20, offset: 0,
    });
    return ApiResponse.success(res, { members: members.map((m) => ({ ...m.user.toJSON(), role: m.role })) });
  } catch (err) { next(err); }
};

// ─── Persona → community affinity ──────────────────────────────────────────────
// Maps each professional persona to the community slugs it most aligns with.
// Used to recommend communities to a user based on the personas they chose
// during onboarding (users.professional_roles). Kept as a plain, explainable
// mapping rather than an opaque model — easy to audit and adjust per business
// rules, and it drives the differentiated experience the product requires.
const PERSONA_COMMUNITY_AFFINITY = {
  freelancer:   { freelancespace: 3, launchpad: 1 },
  student:      { studentzone: 3, launchpad: 2 },
  entrepreneur: { launchpad: 3, freelancespace: 1 },
  recruiter:    { hrconnect: 3 },
  employer:     { hrconnect: 3, launchpad: 1 },
  job_seeker:   { launchpad: 3, hrconnect: 1, freelancespace: 1 },
  mentor:       { hrconnect: 1, studentzone: 1, launchpad: 1, freelancespace: 1 },
};

// GET /communities/recommended — persona-aware community recommendations.
// Scores every active community by the viewer's personas, annotates whether
// they're already a member, and returns communities ranked by relevance.
// Falls back to member-count ordering for users with no personas yet.
const getRecommended = async (req, res, next) => {
  try {
    const communities = await Community.findAll({ where: { is_active: true } });

    let memberIds = new Set();
    let personas = [];
    if (req.user) {
      const [memberships, fullUser] = await Promise.all([
        CommunityMembership.findAll({ where: { user_id: req.user.id }, attributes: ['community_id'] }),
        User.findByPk(req.user.id, { attributes: ['professional_roles'] }),
      ]);
      memberIds = new Set(memberships.map((m) => m.community_id));
      personas = Array.isArray(fullUser && fullUser.professional_roles) ? fullUser.professional_roles : [];
    }

    const scored = communities.map((c) => {
      const data = c.toJSON();
      let score = 0;
      const matchedPersonas = [];
      for (const persona of personas) {
        const affinity = PERSONA_COMMUNITY_AFFINITY[persona];
        if (affinity && affinity[c.slug]) {
          score += affinity[c.slug];
          matchedPersonas.push(persona);
        }
      }
      return {
        ...data,
        is_member: memberIds.has(c.id),
        match_score: score,
        matched_personas: matchedPersonas,
        // "why we recommend this" — human-readable, drives differentiated UX
        reason: matchedPersonas.length
          ? `Recommended for your ${matchedPersonas.join(', ')} profile`
          : null,
      };
    });

    // Rank: personalized score first (when the user has personas), then by
    // members_count as a stable, sensible default/tiebreaker.
    scored.sort((a, b) => (b.match_score - a.match_score) || (b.members_count - a.members_count));

    return ApiResponse.success(res, {
      communities: scored,
      personalized: personas.length > 0,
      personas,
    });
  } catch (err) { next(err); }
};

module.exports = { getAll, getOne, join, leave, getMembers, getRecommended, PERSONA_COMMUNITY_AFFINITY };
