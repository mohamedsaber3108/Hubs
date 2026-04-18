'use strict';
const bcrypt  = require('bcrypt');
const { Admin, ActivityLog } = require('../models');
const ApiError    = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { paginate } = require('../utils/paginate');
const logger = require('../utils/logger');

async function logAction(adminId, action, req, extra) {
  try { await ActivityLog.create({ admin_id: adminId, action, ip_address: req.ip, ...extra }); }
  catch (e) { logger.warn('Log error: ' + e.message); }
}

// List admins
const listAdmins = async (req, res, next) => {
  try {
    // Only super_admin can list all admins
    if (req.admin.role !== 'super_admin') return next(ApiError.forbidden('Super admin only'));
    const { page, limit, offset } = paginate(req.query);
    const { count, rows } = await Admin.findAndCountAll({
      attributes: { exclude: ['password_hash','totp_secret'] },
      limit, offset, order: [['created_at','ASC']],
    });
    return ApiResponse.paginated(res, rows, { page, limit, total: count });
  } catch (err) { next(err); }
};

// Create admin
const createAdmin = async (req, res, next) => {
  try {
    if (req.admin.role !== 'super_admin') return next(ApiError.forbidden('Super admin only'));
    const { email, password, name, role, permissions } = req.body;
    const existing = await Admin.findOne({ where: { email } });
    if (existing) return next(ApiError.conflict('Admin email already exists'));
    const password_hash = await bcrypt.hash(password, 12);
    const admin = await Admin.create({ email, password_hash, name, role: role || 'admin', permissions: permissions || {} });
    await logAction(req.admin.id, 'admin_create_admin', req, { entity_type: 'admin', entity_id: admin.id, new_value: { email, role } });
    return ApiResponse.created(res, {
      admin: { id: admin.id, email: admin.email, name: admin.name, role: admin.role },
    }, 'Admin created');
  } catch (err) { next(err); }
};

// Update admin
const updateAdmin = async (req, res, next) => {
  try {
    if (req.admin.role !== 'super_admin') return next(ApiError.forbidden('Super admin only'));
    const admin = await Admin.findByPk(req.params.id);
    if (!admin) return next(ApiError.notFound('Admin not found'));
    if (admin.id === req.admin.id && req.body.role && req.body.role !== req.admin.role)
      return next(ApiError.badRequest('Cannot change your own role'));
    const old = admin.toJSON();
    await admin.update(req.body);
    await logAction(req.admin.id, 'admin_update_admin', req, { entity_type: 'admin', entity_id: admin.id, old_value: old, new_value: req.body });
    return ApiResponse.success(res, { admin: { id: admin.id, email: admin.email, role: admin.role, name: admin.name } });
  } catch (err) { next(err); }
};

// Delete admin
const deleteAdmin = async (req, res, next) => {
  try {
    if (req.admin.role !== 'super_admin') return next(ApiError.forbidden('Super admin only'));
    const admin = await Admin.findByPk(req.params.id);
    if (!admin) return next(ApiError.notFound('Admin not found'));
    if (admin.id === req.admin.id) return next(ApiError.badRequest('Cannot delete yourself'));
    await admin.destroy();
    await logAction(req.admin.id, 'admin_delete_admin', req, { entity_type: 'admin', entity_id: admin.id });
    return ApiResponse.success(res, null, 'Admin deleted');
  } catch (err) { next(err); }
};

// Reset admin password
const resetAdminPassword = async (req, res, next) => {
  try {
    if (req.admin.role !== 'super_admin') return next(ApiError.forbidden('Super admin only'));
    const admin = await Admin.findByPk(req.params.id);
    if (!admin) return next(ApiError.notFound('Admin not found'));
    const hash = await bcrypt.hash(req.body.new_password, 12);
    await admin.update({ password_hash: hash });
    await logAction(req.admin.id, 'admin_reset_admin_password', req, { entity_type: 'admin', entity_id: admin.id });
    return ApiResponse.success(res, null, 'Password reset');
  } catch (err) { next(err); }
};

module.exports = { listAdmins, createAdmin, updateAdmin, deleteAdmin, resetAdminPassword };
