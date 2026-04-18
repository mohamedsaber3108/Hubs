'use strict';
const { Media, User } = require('../models');
const { deleteFile }   = require('../services/s3.service');
const { uploadFile }   = require('../services/s3.service');
const ApiError    = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { paginate } = require('../utils/paginate');
const { Op } = require('sequelize');

// ─── List media ───────────────────────────────────────────────────────────────
const listMedia = async (req, res, next) => {
  try {
    const { page, limit, offset } = paginate(req.query);
    const { type, search, user_id } = req.query;
    const where = {};
    if (type)    where.type    = type;
    if (user_id) where.user_id = user_id;
    if (search)  where.original_name = { [Op.like]: '%' + search + '%' };

    const { count, rows } = await Media.findAndCountAll({
      where, limit, offset, order: [['created_at','DESC']],
      include: [{ model: User, as: 'uploader', attributes: ['id','first_name','last_name','username'], required: false }],
    });
    return ApiResponse.paginated(res, rows, { page, limit, total: count });
  } catch (err) { next(err); }
};

// ─── Get single media ─────────────────────────────────────────────────────────
const getMedia = async (req, res, next) => {
  try {
    const media = await Media.findByPk(req.params.id, {
      include: [{ model: User, as: 'uploader', attributes: ['id','first_name','last_name','username'] }],
    });
    if (!media) return next(ApiError.notFound('Media not found'));
    return ApiResponse.success(res, { media });
  } catch (err) { next(err); }
};

// ─── Upload media (admin) ─────────────────────────────────────────────────────
const uploadMedia = async (req, res, next) => {
  try {
    if (!req.file) return next(ApiError.badRequest('No file uploaded'));
    const folder = req.body.folder || 'admin-uploads';
    const result = await uploadFile(req.file, folder);
    const media  = await Media.create({
      user_id: req.admin.id,
      url: result.url, key: result.key,
      type: req.file.mimetype.startsWith('image/') ? 'image' : 'document',
      original_name: req.file.originalname,
      size: result.size, mime_type: req.file.mimetype,
    });
    return ApiResponse.created(res, { media }, 'File uploaded');
  } catch (err) { next(err); }
};

// ─── Delete media ─────────────────────────────────────────────────────────────
const deleteMedia = async (req, res, next) => {
  try {
    const media = await Media.findByPk(req.params.id);
    if (!media) return next(ApiError.notFound('Media not found'));
    if (media.key) await deleteFile(media.key);
    await media.destroy();
    return ApiResponse.success(res, null, 'Media deleted');
  } catch (err) { next(err); }
};

// ─── Bulk delete ──────────────────────────────────────────────────────────────
const bulkDeleteMedia = async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || !ids.length) return next(ApiError.badRequest('ids array required'));
    const mediaItems = await Media.findAll({ where: { id: { [Op.in]: ids } } });
    await Promise.all(mediaItems.map((m) => m.key ? deleteFile(m.key) : Promise.resolve()));
    await Media.destroy({ where: { id: { [Op.in]: ids } } });
    return ApiResponse.success(res, { deleted: mediaItems.length }, mediaItems.length + ' files deleted');
  } catch (err) { next(err); }
};

// ─── Storage stats ────────────────────────────────────────────────────────────
const getStorageStats = async (req, res, next) => {
  try {
    const { fn, col, literal } = require('sequelize');
    const stats = await Media.findAll({
      attributes: [
        'type',
        [fn('COUNT', col('id')), 'count'],
        [fn('SUM', col('size')), 'total_size'],
      ],
      group: ['type'],
      raw: true,
    });
    const totalCount = await Media.count();
    const totalSize  = await Media.sum('size') || 0;
    return ApiResponse.success(res, {
      total_files: totalCount,
      total_size_bytes: totalSize,
      total_size_mb: (totalSize / 1024 / 1024).toFixed(2),
      by_type: stats,
    });
  } catch (err) { next(err); }
};

module.exports = { listMedia, getMedia, uploadMedia, deleteMedia, bulkDeleteMedia, getStorageStats };
