'use strict';
const router  = require('express').Router();
const { authenticateAdmin } = require('../../middleware/adminAuth');
const { requireAdminRole }  = require('../../middleware/role');
const validate = require('../../middleware/validate');
const upload   = require('../../middleware/upload');
const { authLimiter, uploadLimiter } = require('../../middleware/rateLimiter');
const schema   = require('../../validations/admin.validation');

const authCtrl      = require('../../controllers/admin.auth.controller');
const dashCtrl      = require('../../controllers/admin.dashboard.controller');
const usersCtrl     = require('../../controllers/admin.users.controller');
const adminsCtrl    = require('../../controllers/admin.admins.controller');
const contentCtrl   = require('../../controllers/admin.content.controller');
const settingsCtrl  = require('../../controllers/admin.settings.controller');
const mediaCtrl     = require('../../controllers/admin.media.controller');
const analyticsCtrl = require('../../controllers/admin.analytics.controller');
const logsCtrl      = require('../../controllers/admin.logs.controller');
const systemCtrl    = require('../../controllers/admin.system.controller');
const offersCtrl    = require('../../controllers/admin.offers.controller');
const offerSchema   = require('../../validations/offer.validation');

// ─── Auth (public) ────────────────────────────────────────────────────────────
router.post('/auth/login',  authLimiter, validate(schema.adminLogin), authCtrl.login);

// ─── All routes below require admin JWT ───────────────────────────────────────
router.use(authenticateAdmin);

// Auth
router.post  ('/auth/logout',        authCtrl.logout);
router.get   ('/auth/me',            authCtrl.me);
router.post  ('/auth/totp/setup',    authCtrl.setupTotp);
router.post  ('/auth/totp/enable',   authCtrl.enableTotp);
router.delete('/auth/totp',          authCtrl.disableTotp);

// ─── Dashboard ────────────────────────────────────────────────────────────────
router.get('/dashboard/stats',    dashCtrl.getStats);
router.get('/dashboard/charts',   dashCtrl.getCharts);
router.get('/dashboard/activity', dashCtrl.getRecentActivity);

// ─── Users ────────────────────────────────────────────────────────────────────
router.get   ('/users',                      usersCtrl.listUsers);
router.post  ('/users',                      validate(schema.updateUserAdmin), usersCtrl.createUser);
router.get   ('/users/:id',                  usersCtrl.getUser);
router.put   ('/users/:id',                  validate(schema.updateUserAdmin), usersCtrl.updateUser);
router.delete('/users/:id',                  usersCtrl.deleteUser);
router.patch ('/users/:id/status',           validate(schema.updateUserStatus), usersCtrl.updateStatus);
router.patch ('/users/:id/role',             validate(schema.updateUserRole),   usersCtrl.updateRole);
router.post  ('/users/:id/force-reset',      usersCtrl.forcePasswordReset);
router.get   ('/users/:id/activity',         usersCtrl.getUserActivity);

// ─── Admins (super_admin only) ────────────────────────────────────────────────
router.get   ('/admins',        adminsCtrl.listAdmins);
router.post  ('/admins',        validate(schema.createAdmin),  adminsCtrl.createAdmin);
router.put   ('/admins/:id',    validate(schema.updateAdmin),  adminsCtrl.updateAdmin);
router.delete('/admins/:id',                                    adminsCtrl.deleteAdmin);
router.post  ('/admins/:id/reset-password',                     adminsCtrl.resetAdminPassword);

// ─── Content — Posts ──────────────────────────────────────────────────────────
router.get   ('/content/posts',              contentCtrl.listPosts);
router.get   ('/content/posts/:id',          contentCtrl.getPost);
router.put   ('/content/posts/:id',          contentCtrl.updatePost);
router.delete('/content/posts/:id',          contentCtrl.deletePost);
router.patch ('/content/posts/:id/pin',      contentCtrl.pinPost);
router.delete('/content/comments/:id',       contentCtrl.deleteComment);

// ─── Content — Communities ────────────────────────────────────────────────────
router.get   ('/content/communities',         contentCtrl.listCommunities);
router.post  ('/content/communities',         validate(schema.createCommunity), contentCtrl.createCommunity);
router.put   ('/content/communities/:id',     contentCtrl.updateCommunity);
router.patch ('/content/communities/:id/toggle', contentCtrl.toggleCommunity);

// ─── Content — Events ─────────────────────────────────────────────────────────
router.get   ('/content/events',             contentCtrl.listEvents);
router.put   ('/content/events/:id',         contentCtrl.updateEvent);
router.delete('/content/events/:id',         contentCtrl.deleteEvent);

// ─── Content — Challenges ─────────────────────────────────────────────────────
router.get   ('/content/challenges',         contentCtrl.listChallenges);
router.put   ('/content/challenges/:id',     contentCtrl.updateChallenge);

// ─── Content — Opportunities ──────────────────────────────────────────────────
router.get   ('/content/opportunities',      contentCtrl.listOpportunities);
router.put   ('/content/opportunities/:id',  contentCtrl.updateOpportunity);

// ─── Content — Resources ──────────────────────────────────────────────────────
router.get   ('/content/resources',          contentCtrl.listResources);
router.patch ('/content/resources/:id/approve', contentCtrl.approveResource);
router.delete('/content/resources/:id',      contentCtrl.deleteResource);

// ─── Content — Groups ─────────────────────────────────────────────────────────
router.get   ('/content/groups',             contentCtrl.listGroups);
router.put   ('/content/groups/:id',         contentCtrl.updateGroup);
router.delete('/content/groups/:id',         contentCtrl.deleteGroup);

// ─── Offers & Perks moderation ────────────────────────────────────────────────
// Reads: any authenticated admin. Review/verify: admin or super_admin.
router.get  ('/offers',                    offersCtrl.listOffers);
router.patch('/offers/:id/review',         requireAdminRole('admin', 'super_admin'), validate(offerSchema.reviewOffer), offersCtrl.reviewOffer);
router.get  ('/offers/:id/redemptions',    offersCtrl.listRedemptions);
router.get  ('/organizations',             offersCtrl.listOrganizations);
router.patch('/organizations/:id/verify',  requireAdminRole('admin', 'super_admin'), offersCtrl.setVerification);

// ─── Settings ─────────────────────────────────────────────────────────────────
// Reads: any authenticated admin. Writes: admin or super_admin (not moderator).
// (Audit finding SEC-01 — see note above the /system routes.)
router.get ('/settings',               settingsCtrl.getSettings);
router.put ('/settings',               requireAdminRole('admin', 'super_admin'), validate(schema.bulkUpdateSettings), settingsCtrl.bulkUpdateSettings);
router.get ('/settings/:key',          settingsCtrl.getSetting);
router.put ('/settings/:key',          requireAdminRole('admin', 'super_admin'), validate(schema.updateSetting), settingsCtrl.updateSetting);

// Feature Flags
router.get   ('/flags',                settingsCtrl.getFeatureFlags);
router.get   ('/flags/:name',          settingsCtrl.getFeatureFlag);
router.put   ('/flags/:name',          requireAdminRole('admin', 'super_admin'), validate(schema.updateFeatureFlag), settingsCtrl.updateFeatureFlag);
router.patch ('/flags/:name/toggle',   requireAdminRole('admin', 'super_admin'), settingsCtrl.toggleFeatureFlag);

// Pricing Plans
router.get('/pricing',                 settingsCtrl.getPricingPlans);
router.put('/pricing/:id',             requireAdminRole('admin', 'super_admin'), settingsCtrl.updatePricingPlan);

// Email Templates
router.get('/email-templates',         settingsCtrl.getEmailTemplates);
router.put('/email-templates/:name',   requireAdminRole('admin', 'super_admin'), settingsCtrl.updateEmailTemplate);

// ─── Media ────────────────────────────────────────────────────────────────────
router.get   ('/media',                mediaCtrl.listMedia);
router.get   ('/media/stats',          mediaCtrl.getStorageStats);
router.get   ('/media/:id',            mediaCtrl.getMedia);
router.post  ('/media',                uploadLimiter, upload.single('file'), mediaCtrl.uploadMedia);
router.delete('/media/:id',            mediaCtrl.deleteMedia);
router.delete('/media',                mediaCtrl.bulkDeleteMedia);

// ─── Analytics ────────────────────────────────────────────────────────────────
router.get('/analytics/users',        analyticsCtrl.getUserAnalytics);
router.get('/analytics/content',      analyticsCtrl.getContentAnalytics);
router.get('/analytics/communities',  analyticsCtrl.getCommunityAnalytics);
router.get('/analytics/engagement',   analyticsCtrl.getEngagementAnalytics);
router.get('/analytics/revenue',      analyticsCtrl.getRevenueAnalytics);

// ─── Activity Logs ────────────────────────────────────────────────────────────
router.get('/logs',          logsCtrl.listLogs);
router.get('/logs/summary',  logsCtrl.getLogSummary);
router.get('/logs/export',   logsCtrl.exportLogs);
router.get('/logs/:id',      logsCtrl.getLog);

// ─── System ───────────────────────────────────────────────────────────────────
// Read-only health/status checks: any authenticated admin (incl. moderator).
router.get   ('/system/health',       systemCtrl.getSystemHealth);
router.get   ('/system/queues',       systemCtrl.getQueueStats);
router.get   ('/system/cache',        systemCtrl.getCacheStats);
router.get   ('/system/maintenance',  systemCtrl.getMaintenanceStatus);
// Destructive/infrastructure-affecting actions: super_admin only.
// (Audit finding SEC-01 — requireAdminRole was imported but never applied
// anywhere in this file, so any admin role including `moderator` could
// pause/resume/clean job queues, flush the entire Redis cache, or toggle
// site-wide maintenance mode. See docs/audit/SECURITY_AND_PRODUCTION_GAPS.md.)
router.post  ('/system/queues/:queue/pause',  requireAdminRole('super_admin'), systemCtrl.pauseQueue);
router.post  ('/system/queues/:queue/resume', requireAdminRole('super_admin'), systemCtrl.resumeQueue);
router.post  ('/system/queues/:queue/clean',  requireAdminRole('super_admin'), systemCtrl.cleanQueue);
router.delete('/system/cache',        requireAdminRole('super_admin'), systemCtrl.flushCache);
router.put   ('/system/maintenance',  requireAdminRole('super_admin'), systemCtrl.setMaintenanceMode);

module.exports = router;
