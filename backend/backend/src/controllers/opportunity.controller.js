'use strict';
const { Op } = require('sequelize');
const { Opportunity, OpportunityApplication, SavedOpportunity, Community, User } = require('../models');
const { uploadFile } = require('../services/s3.service');
const { createNotification } = require('../services/notification.service');
const ApiError    = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { paginate } = require('../utils/paginate');

const userAttrs = ['id','first_name','last_name','username','avatar_url','headline'];

// GET /opportunities
const listOpportunities = async (req, res, next) => {
  try {
    const { page, limit, offset } = paginate(req.query);
    const { community, type, location_type, search, status = 'open', saved } = req.query;
    const where = {};
    if (status)        where.status = status;
    if (type)          where.type   = type;
    if (location_type) where.location_type = location_type;
    if (search) {
      where[Op.or] = [
        { title:       { [Op.like]: '%' + search + '%' } },
        { company:     { [Op.like]: '%' + search + '%' } },
        { description: { [Op.like]: '%' + search + '%' } },
      ];
    }
    if (community) {
      const comm = await Community.findOne({ where: { slug: community } });
      if (comm) where.community_id = comm.id;
    }

    // Show saved only
    let savedIds = null;
    if (saved === 'true' && req.user) {
      const saves = await SavedOpportunity.findAll({ where: { user_id: req.user.id }, attributes: ['opportunity_id'] });
      savedIds = saves.map((s) => s.opportunity_id);
      if (!savedIds.length) return ApiResponse.paginated(res, [], { page, limit, total: 0 });
      where.id = { [Op.in]: savedIds };
    }

    const { count, rows } = await Opportunity.findAndCountAll({
      where, limit, offset,
      // BUG-03: `is_featured` was never a real column (no model field,
      // no migration) -- every call to GET /opportunities threw
      // "Unknown column 'Opportunity.is_featured' in 'order clause'",
      // a 500 on the endpoint's happy path. Sort on real columns only.
      order: [['created_at','DESC']],
      include: [
        { model: Community, as: 'community', attributes: ['id','slug','name','emoji'] },
        { model: User, as: 'poster', attributes: userAttrs },
      ],
    });
    const data = req.user ? await Promise.all(rows.map(async (o) => {
      const [app, sav] = await Promise.all([
        OpportunityApplication.findOne({ where: { opportunity_id: o.id, user_id: req.user.id } }),
        SavedOpportunity.findOne({ where: { opportunity_id: o.id, user_id: req.user.id } }),
      ]);
      return { ...o.toJSON(), applied: !!app, saved: !!sav, application_status: app ? app.status : null };
    })) : rows.map((o) => o.toJSON());
    return ApiResponse.paginated(res, data, { page, limit, total: count });
  } catch (err) { next(err); }
};

// GET /opportunities/:id
const getOpportunity = async (req, res, next) => {
  try {
    const opp = await Opportunity.findByPk(req.params.id, {
      include: [
        { model: Community, as: 'community', attributes: ['id','slug','name','emoji'] },
        { model: User, as: 'poster', attributes: userAttrs },
      ],
    });
    if (!opp) return next(ApiError.notFound('Opportunity not found'));
    // BUG-13: `views_count` was never a real column on Opportunity (no
    // model field, no migration) -- this threw on every single
    // GET /opportunities/:id call. Removed; add a real column via
    // migration later if view tracking is wanted.
    let applied = false, saved = false, application = null;
    if (req.user) {
      [application, saved] = await Promise.all([
        OpportunityApplication.findOne({ where: { opportunity_id: opp.id, user_id: req.user.id } }),
        SavedOpportunity.findOne({ where: { opportunity_id: opp.id, user_id: req.user.id } }),
      ]);
      applied = !!application;
    }
    return ApiResponse.success(res, { opportunity: opp, applied, saved, application });
  } catch (err) { next(err); }
};

// POST /opportunities
const createOpportunity = async (req, res, next) => {
  try {
    const community = await Community.findOne({ where: { slug: req.body.community_slug } });
    if (!community) return next(ApiError.notFound('Community not found'));
    const opp = await Opportunity.create({ ...req.body, community_id: community.id, posted_by: req.user.id });
    return ApiResponse.created(res, { opportunity: opp }, 'Opportunity posted');
  } catch (err) { next(err); }
};

// PUT /opportunities/:id
const updateOpportunity = async (req, res, next) => {
  try {
    const opp = await Opportunity.findByPk(req.params.id);
    if (!opp) return next(ApiError.notFound('Opportunity not found'));
    if (opp.posted_by !== req.user.id && req.user.role !== 'admin') return next(ApiError.forbidden('Owner only'));
    await opp.update(req.body);
    return ApiResponse.success(res, { opportunity: opp }, 'Opportunity updated');
  } catch (err) { next(err); }
};

// DELETE /opportunities/:id
const deleteOpportunity = async (req, res, next) => {
  try {
    const opp = await Opportunity.findByPk(req.params.id);
    if (!opp) return next(ApiError.notFound('Opportunity not found'));
    if (opp.posted_by !== req.user.id && req.user.role !== 'admin') return next(ApiError.forbidden('Owner only'));
    await opp.update({ status: 'closed' });
    return ApiResponse.success(res, null, 'Opportunity closed');
  } catch (err) { next(err); }
};

// POST /opportunities/:id/apply
const apply = async (req, res, next) => {
  try {
    const opp = await Opportunity.findByPk(req.params.id);
    if (!opp) return next(ApiError.notFound('Opportunity not found'));
    if (opp.status !== 'open') return next(ApiError.badRequest('Opportunity is closed'));
    if (opp.deadline && new Date() > opp.deadline) return next(ApiError.badRequest('Application deadline passed'));
    const existing = await OpportunityApplication.findOne({ where: { opportunity_id: opp.id, user_id: req.user.id } });
    if (existing) return next(ApiError.conflict('Already applied'));

    let resume_url = null;
    if (req.file) { const r = await uploadFile(req.file, 'resumes', { skipResize: true }); resume_url = r.url; }

    const app = await OpportunityApplication.create({
      opportunity_id: opp.id, user_id: req.user.id,
      cover_letter: req.body.cover_letter || null, resume_url,
      portfolio_url: req.body.portfolio_url || null,
    });
    await Opportunity.increment('applications_count', { where: { id: opp.id } });
    await createNotification(opp.posted_by, {
      title: 'New application',
      message: req.user.first_name + ' ' + req.user.last_name + ' applied to "' + opp.title + '"',
      type: 'opportunity', actionUrl: '/opportunities/' + opp.id + '/applications',
    });
    return ApiResponse.created(res, { application: app }, 'Application submitted');
  } catch (err) { next(err); }
};

// GET /opportunities/:id/applications (poster only)
const getApplications = async (req, res, next) => {
  try {
    const opp = await Opportunity.findByPk(req.params.id);
    if (!opp) return next(ApiError.notFound('Opportunity not found'));
    if (opp.posted_by !== req.user.id && req.user.role !== 'admin') return next(ApiError.forbidden('Owner only'));
    const { page, limit, offset } = paginate(req.query);
    const { status } = req.query;
    const where = { opportunity_id: opp.id };
    if (status) where.status = status;
    const { count, rows } = await OpportunityApplication.findAndCountAll({
      where, limit, offset, order: [['created_at','DESC']],
      include: [{ model: User, as: 'applicant', attributes: [...userAttrs, 'email'] }],
    });
    return ApiResponse.paginated(res, rows, { page, limit, total: count });
  } catch (err) { next(err); }
};

// PATCH /opportunities/applications/:id (poster: update status)
const updateApplication = async (req, res, next) => {
  try {
    const app = await OpportunityApplication.findByPk(req.params.appId, {
      include: [{ model: Opportunity, as: 'opportunity' }],
    });
    if (!app) return next(ApiError.notFound('Application not found'));
    if (app.opportunity.user_id !== req.user.id && req.user.role !== 'admin') return next(ApiError.forbidden('Owner only'));
    await app.update({ status: req.body.status, notes: req.body.notes });
    await createNotification(app.user_id, {
      title: 'Application update',
      message: 'Your application for "' + app.opportunity.title + '" is now ' + req.body.status,
      type: 'opportunity',
    });
    return ApiResponse.success(res, { application: app }, 'Application updated');
  } catch (err) { next(err); }
};

// POST /opportunities/:id/save
const saveOpportunity = async (req, res, next) => {
  try {
    const opp = await Opportunity.findByPk(req.params.id);
    if (!opp) return next(ApiError.notFound('Opportunity not found'));
    const [, created] = await SavedOpportunity.findOrCreate({ where: { opportunity_id: opp.id, user_id: req.user.id } });
    if (!created) {
      await SavedOpportunity.destroy({ where: { opportunity_id: opp.id, user_id: req.user.id } });
      return ApiResponse.success(res, { saved: false }, 'Removed from saved');
    }
    return ApiResponse.success(res, { saved: true }, 'Saved');
  } catch (err) { next(err); }
};

module.exports = { listOpportunities, getOpportunity, createOpportunity, updateOpportunity, deleteOpportunity, apply, getApplications, updateApplication, saveOpportunity };
