'use strict';
const { Op } = require('sequelize');
const { Resource, ResourceRating, Community, User } = require('../models');
const { uploadFile } = require('../services/s3.service');
const ApiError    = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { paginate } = require('../utils/paginate');

const userAttrs = ['id','first_name','last_name','username','avatar_url'];

// GET /resources
const listResources = async (req, res, next) => {
  try {
    const { page, limit, offset } = paginate(req.query);
    const { community, type, search, is_free } = req.query;
    const where = { is_approved: true };
    if (type) where.type = type;
    if (is_free !== undefined) where.is_free = is_free === 'true';
    if (search) {
      where[Op.or] = [
        { title:       { [Op.like]: '%' + search + '%' } },
        { description: { [Op.like]: '%' + search + '%' } },
        { tags:        { [Op.like]: '%' + search + '%' } },
      ];
    }
    if (community) {
      const comm = await Community.findOne({ where: { slug: community } });
      if (comm) where.community_id = comm.id;
    }
    const { count, rows } = await Resource.findAndCountAll({
      where, limit, offset, order: [['downloads_count','DESC'],['created_at','DESC']],
      include: [
        { model: Community, as: 'community', attributes: ['id','slug','name','emoji'] },
        { model: User, as: 'uploader', attributes: userAttrs },
      ],
    });
    const data = req.user ? await Promise.all(rows.map(async (r) => {
      const rating = await ResourceRating.findOne({ where: { resource_id: r.id, user_id: req.user.id } });
      return { ...r.toJSON(), my_rating: rating ? rating.rating : null };
    })) : rows.map((r) => r.toJSON());
    return ApiResponse.paginated(res, data, { page, limit, total: count });
  } catch (err) { next(err); }
};

// GET /resources/:id
const getResource = async (req, res, next) => {
  try {
    const resource = await Resource.findOne({
      where: { id: req.params.id, is_approved: true },
      include: [
        { model: Community, as: 'community', attributes: ['id','slug','name','emoji'] },
        { model: User, as: 'uploader', attributes: userAttrs },
      ],
    });
    if (!resource) return next(ApiError.notFound('Resource not found'));
    let myRating = null;
    if (req.user) {
      const r = await ResourceRating.findOne({ where: { resource_id: resource.id, user_id: req.user.id } });
      myRating = r ? r.rating : null;
    }
    return ApiResponse.success(res, { resource, my_rating: myRating });
  } catch (err) { next(err); }
};

// POST /resources
const createResource = async (req, res, next) => {
  try {
    const community = await Community.findOne({ where: { slug: req.body.community_slug } });
    if (!community) return next(ApiError.notFound('Community not found'));

    let file_url = req.body.file_url || null;
    if (req.file) { const r = await uploadFile(req.file, 'resources', { skipResize: true }); file_url = r.url; }
    if (!file_url && !req.body.external_url) return next(ApiError.badRequest('Provide a file or external URL'));

    const isAuto = req.user.role === 'admin' || req.user.role === 'moderator';
    const resource = await Resource.create({
      ...req.body, community_id: community.id, uploaded_by: req.user.id,
      file_url, external_url: req.body.external_url || null,
      is_approved: isAuto,
    });
    return ApiResponse.created(res, { resource }, isAuto ? 'Resource published' : 'Resource submitted for review');
  } catch (err) { next(err); }
};

// PUT /resources/:id
const updateResource = async (req, res, next) => {
  try {
    const resource = await Resource.findByPk(req.params.id);
    if (!resource) return next(ApiError.notFound('Resource not found'));
    if (resource.uploaded_by !== req.user.id && req.user.role !== 'admin') return next(ApiError.forbidden('Owner only'));
    await resource.update(req.body);
    return ApiResponse.success(res, { resource }, 'Resource updated');
  } catch (err) { next(err); }
};

// DELETE /resources/:id
const deleteResource = async (req, res, next) => {
  try {
    const resource = await Resource.findByPk(req.params.id);
    if (!resource) return next(ApiError.notFound('Resource not found'));
    if (resource.uploaded_by !== req.user.id && req.user.role !== 'admin') return next(ApiError.forbidden('Owner only'));
    await resource.destroy();
    return ApiResponse.success(res, null, 'Resource deleted');
  } catch (err) { next(err); }
};

// POST /resources/:id/download (increments counter)
const downloadResource = async (req, res, next) => {
  try {
    const resource = await Resource.findOne({ where: { id: req.params.id, is_approved: true } });
    if (!resource) return next(ApiError.notFound('Resource not found'));
    await Resource.increment('downloads_count', { where: { id: resource.id } });
    const url = resource.file_url || resource.external_url;
    return ApiResponse.success(res, { url }, 'Download started');
  } catch (err) { next(err); }
};

// POST /resources/:id/rate
const rateResource = async (req, res, next) => {
  try {
    const { rating, review } = req.body;
    if (!rating || rating < 1 || rating > 5) return next(ApiError.badRequest('Rating must be 1-5'));
    const resource = await Resource.findByPk(req.params.id);
    if (!resource) return next(ApiError.notFound('Resource not found'));

    const [ratingObj, created] = await ResourceRating.findOrCreate({
      where: { resource_id: resource.id, user_id: req.user.id },
      defaults: { rating, review: review || null },
    });
    if (!created) await ratingObj.update({ rating, review: review || null });

    // Recalculate avg
    const all = await ResourceRating.findAll({ where: { resource_id: resource.id }, attributes: ['rating'] });
    const avg = all.reduce((s, r) => s + r.rating, 0) / all.length;
    await Resource.update({ avg_rating: avg.toFixed(1), ratings_count: all.length }, { where: { id: resource.id } });

    return ApiResponse.success(res, { rating: ratingObj }, created ? 'Rated' : 'Rating updated');
  } catch (err) { next(err); }
};

module.exports = { listResources, getResource, createResource, updateResource, deleteResource, downloadResource, rateResource };
