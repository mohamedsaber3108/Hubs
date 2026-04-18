'use strict';
const { Setting, FeatureFlag } = require('../models');
const { invalidateCache }       = require('../middleware/cache');
const { getRedisClient }         = require('../config/redis');
const ApiError    = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const logger = require('../utils/logger');

// ─── Settings ─────────────────────────────────────────────────────────────────
const getSettings = async (req, res, next) => {
  try {
    const rows    = await Setting.findAll({ order: [['key','ASC']] });
    const settings = {};
    rows.forEach((r) => { settings[r.key] = r.value; });
    return ApiResponse.success(res, { settings, raw: rows });
  } catch (err) { next(err); }
};

const getSetting = async (req, res, next) => {
  try {
    const setting = await Setting.findOne({ where: { key: req.params.key } });
    if (!setting) return next(ApiError.notFound('Setting not found'));
    return ApiResponse.success(res, { setting });
  } catch (err) { next(err); }
};

const updateSetting = async (req, res, next) => {
  try {
    const [setting, created] = await Setting.findOrCreate({
      where: { key: req.params.key },
      defaults: { value: req.body.value, type: typeof req.body.value, is_public: false },
    });
    if (!created) await setting.update({ value: req.body.value });
    await invalidateCache('cache:*');
    await getRedisClient().del('admin:settings').catch(() => {});
    return ApiResponse.success(res, { setting }, created ? 'Setting created' : 'Setting updated');
  } catch (err) { next(err); }
};

const bulkUpdateSettings = async (req, res, next) => {
  try {
    const updates = req.body; // { key: value, ... }
    const results = [];
    for (const [key, value] of Object.entries(updates)) {
      const [setting] = await Setting.findOrCreate({
        where: { key },
        defaults: { value, type: typeof value, is_public: false },
      });
      await setting.update({ value });
      results.push({ key, value });
    }
    await invalidateCache('cache:*');
    return ApiResponse.success(res, { updated: results.length, settings: results }, 'Settings saved');
  } catch (err) { next(err); }
};

// ─── Feature Flags ────────────────────────────────────────────────────────────
const getFeatureFlags = async (req, res, next) => {
  try {
    const flags = await FeatureFlag.findAll({ order: [['name','ASC']] });
    return ApiResponse.success(res, { flags });
  } catch (err) { next(err); }
};

const getFeatureFlag = async (req, res, next) => {
  try {
    const flag = await FeatureFlag.findOne({ where: { name: req.params.name } });
    if (!flag) return next(ApiError.notFound('Feature flag not found'));
    return ApiResponse.success(res, { flag });
  } catch (err) { next(err); }
};

const updateFeatureFlag = async (req, res, next) => {
  try {
    const [flag, created] = await FeatureFlag.findOrCreate({
      where: { name: req.params.name },
      defaults: { is_enabled: req.body.is_enabled, description: req.body.description || '' },
    });
    if (!created) await flag.update({ is_enabled: req.body.is_enabled, ...(req.body.description !== undefined && { description: req.body.description }) });

    // Invalidate flag cache
    await getRedisClient().del('flags:' + req.params.name).catch(() => {});
    await getRedisClient().del('flags:all').catch(() => {});

    logger.info('Feature flag ' + req.params.name + ' set to ' + req.body.is_enabled + ' by admin ' + req.admin.id);
    return ApiResponse.success(res, { flag }, created ? 'Flag created' : 'Flag updated');
  } catch (err) { next(err); }
};

const toggleFeatureFlag = async (req, res, next) => {
  try {
    const flag = await FeatureFlag.findOne({ where: { name: req.params.name } });
    if (!flag) return next(ApiError.notFound('Feature flag not found'));
    await flag.update({ is_enabled: !flag.is_enabled });
    await getRedisClient().del('flags:' + req.params.name).catch(() => {});
    await getRedisClient().del('flags:all').catch(() => {});
    return ApiResponse.success(res, { name: flag.name, is_enabled: flag.is_enabled }, 'Flag toggled');
  } catch (err) { next(err); }
};

// ─── Pricing Plans ────────────────────────────────────────────────────────────
const getPricingPlans = async (req, res, next) => {
  try {
    const { PricingPlan } = require('../models');
    const plans = await PricingPlan.findAll({ order: [['sort_order','ASC'],['id','ASC']] });
    return ApiResponse.success(res, { plans });
  } catch (err) { next(err); }
};

const updatePricingPlan = async (req, res, next) => {
  try {
    const { PricingPlan } = require('../models');
    const plan = await PricingPlan.findByPk(req.params.id);
    if (!plan) return next(ApiError.notFound('Plan not found'));
    await plan.update(req.body);
    await invalidateCache('cache:/api/v1/pricing*');
    return ApiResponse.success(res, { plan }, 'Plan updated');
  } catch (err) { next(err); }
};

// ─── Email Templates ──────────────────────────────────────────────────────────
const getEmailTemplates = async (req, res, next) => {
  try {
    const { EmailTemplate } = require('../models');
    const templates = await EmailTemplate.findAll({ order: [['name','ASC']] });
    return ApiResponse.success(res, { templates });
  } catch (err) { next(err); }
};

const updateEmailTemplate = async (req, res, next) => {
  try {
    const { EmailTemplate } = require('../models');
    const tpl = await EmailTemplate.findOne({ where: { name: req.params.name } });
    if (!tpl) return next(ApiError.notFound('Template not found'));
    await tpl.update({ subject: req.body.subject, html_body: req.body.html_body });
    return ApiResponse.success(res, { template: tpl }, 'Template updated');
  } catch (err) { next(err); }
};

module.exports = {
  getSettings, getSetting, updateSetting, bulkUpdateSettings,
  getFeatureFlags, getFeatureFlag, updateFeatureFlag, toggleFeatureFlag,
  getPricingPlans, updatePricingPlan,
  getEmailTemplates, updateEmailTemplate,
};
