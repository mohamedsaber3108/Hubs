'use strict';
const { Op } = require('sequelize');
const { Challenge, ChallengeSubmission, ChallengeVote, Community, User, LeaderboardPoint, PointTransaction } = require('../models');
const { uploadFile } = require('../services/s3.service');
const { createNotification } = require('../services/notification.service');
const ApiError    = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { paginate } = require('../utils/paginate');

const userAttrs = ['id','first_name','last_name','username','avatar_url','headline'];

// GET /challenges
const listChallenges = async (req, res, next) => {
  try {
    const { page, limit, offset } = paginate(req.query);
    const { community, type, status, search } = req.query;
    const where = {};
    if (type)   where.type   = type;
    if (status) where.status = status;
    else where.status = { [Op.in]: ['open','voting','completed'] };
    if (search) where.title = { [Op.like]: '%' + search + '%' };
    if (community) {
      const comm = await Community.findOne({ where: { slug: community } });
      if (comm) where.community_id = comm.id;
    }
    const { count, rows } = await Challenge.findAndCountAll({
      // BUG-06: `start_date` was never a real column on Challenge (no
      // model field, no migration) -- caused GET /challenges to 500 on
      // its happy path. Sort on a real column instead.
      where, limit, offset, order: [['created_at','DESC']],
      include: [
        { model: Community, as: 'community', attributes: ['id','slug','name','emoji'] },
        { model: User, as: 'creator', attributes: userAttrs },
      ],
    });
    const data = req.user ? await Promise.all(rows.map(async (c) => {
      const sub = await ChallengeSubmission.findOne({ where: { challenge_id: c.id, user_id: req.user.id } });
      return { ...c.toJSON(), my_submission: sub ? { id: sub.id, status: sub.status } : null };
    })) : rows.map((c) => c.toJSON());
    return ApiResponse.paginated(res, data, { page, limit, total: count });
  } catch (err) { next(err); }
};

// GET /challenges/:id
const getChallenge = async (req, res, next) => {
  try {
    const challenge = await Challenge.findByPk(req.params.id, {
      include: [
        { model: Community, as: 'community', attributes: ['id','slug','name','emoji'] },
        { model: User, as: 'creator', attributes: userAttrs },
      ],
    });
    if (!challenge) return next(ApiError.notFound('Challenge not found'));
    let mySubmission = null;
    if (req.user) mySubmission = await ChallengeSubmission.findOne({ where: { challenge_id: challenge.id, user_id: req.user.id } });
    return ApiResponse.success(res, { challenge, my_submission: mySubmission });
  } catch (err) { next(err); }
};

// POST /challenges (admin/moderator)
const createChallenge = async (req, res, next) => {
  try {
    if (!['admin','moderator'].includes(req.user.role)) return next(ApiError.forbidden('Moderators only'));
    const community = await Community.findOne({ where: { slug: req.body.community_slug } });
    if (!community) return next(ApiError.notFound('Community not found'));
    let cover_image = null;
    if (req.file) { const r = await uploadFile(req.file, 'challenges'); cover_image = r.url; }
    const challenge = await Challenge.create({ ...req.body, community_id: community.id, created_by: req.user.id, cover_url: cover_image });
    return ApiResponse.created(res, { challenge }, 'Challenge created');
  } catch (err) { next(err); }
};

// PUT /challenges/:id
const updateChallenge = async (req, res, next) => {
  try {
    const challenge = await Challenge.findByPk(req.params.id);
    if (!challenge) return next(ApiError.notFound('Challenge not found'));
    if (challenge.created_by !== req.user.id && req.user.role !== 'admin') return next(ApiError.forbidden('Creator only'));
    await challenge.update(req.body);
    return ApiResponse.success(res, { challenge }, 'Challenge updated');
  } catch (err) { next(err); }
};

// POST /challenges/:id/submit
const submitEntry = async (req, res, next) => {
  try {
    const challenge = await Challenge.findByPk(req.params.id);
    if (!challenge) return next(ApiError.notFound('Challenge not found'));
    if (challenge.status !== 'active') return next(ApiError.badRequest('Challenge is not accepting submissions'));
    if (challenge.deadline && new Date() > challenge.deadline) return next(ApiError.badRequest('Submission deadline passed'));

    const existing = await ChallengeSubmission.findOne({ where: { challenge_id: challenge.id, user_id: req.user.id } });
    if (existing) return next(ApiError.conflict('You have already submitted'));

    let media_urls = [];
    if (req.files && req.files.length) {
      const uploads = await Promise.all(req.files.map((f) => uploadFile(f, 'challenge-submissions')));
      media_urls = uploads.map((u) => u.url);
    }
    const submission = await ChallengeSubmission.create({
      challenge_id: challenge.id, user_id: req.user.id,
      title:       req.body.title,
      description: req.body.description,
      submission_url: req.body.submission_url || req.body.content_url || null,
      media_urls,
    });
    await Challenge.increment('submissions_count', { where: { id: challenge.id } });
    await createNotification(challenge.created_by, {
      title: 'New submission',
      message: req.user.first_name + ' submitted to your challenge "' + challenge.title + '"',
      type: 'challenge', actionUrl: '/challenges/' + challenge.id,
    });
    return ApiResponse.created(res, { submission }, 'Submission received');
  } catch (err) { next(err); }
};

// GET /challenges/:id/submissions
const getSubmissions = async (req, res, next) => {
  try {
    const { page, limit, offset } = paginate(req.query);
    const { status } = req.query;
    const where = { challenge_id: req.params.id };
    if (status) where.status = status;
    const { count, rows } = await ChallengeSubmission.findAndCountAll({
      where, limit, offset, order: [['votes_count','DESC'],['created_at','ASC']],
      include: [{ model: User, as: 'participant', attributes: userAttrs }],
    });
    const data = req.user ? await Promise.all(rows.map(async (s) => {
      const voted = await ChallengeVote.findOne({ where: { submission_id: s.id, voter_id: req.user.id } });
      return { ...s.toJSON(), voted: !!voted };
    })) : rows.map((s) => s.toJSON());
    return ApiResponse.paginated(res, data, { page, limit, total: count });
  } catch (err) { next(err); }
};

// POST /challenges/submissions/:submissionId/vote
const voteSubmission = async (req, res, next) => {
  try {
    const submission = await ChallengeSubmission.findByPk(req.params.submissionId, {
      include: [{ model: Challenge, as: 'challenge' }],
    });
    if (!submission) return next(ApiError.notFound('Submission not found'));
    if (!['active','upcoming'].includes(submission.challenge.status)) return next(ApiError.badRequest('Challenge is not in voting phase'));
    if (submission.user_id === req.user.id) return next(ApiError.badRequest('Cannot vote for own submission'));

    const existing = await ChallengeVote.findOne({ where: { submission_id: submission.id, voter_id: req.user.id } });
    if (existing) {
      await existing.destroy();
      await ChallengeSubmission.decrement('votes_count', { where: { id: submission.id } });
      return ApiResponse.success(res, { voted: false }, 'Vote removed');
    }
    await ChallengeVote.create({ submission_id: submission.id, voter_id: req.user.id, challenge_id: submission.challenge_id });
    await ChallengeSubmission.increment('votes_count', { where: { id: submission.id } });
    return ApiResponse.success(res, { voted: true }, 'Vote cast');
  } catch (err) { next(err); }
};

// POST /challenges/:id/winners (admin/moderator)
const announceWinners = async (req, res, next) => {
  try {
    const challenge = await Challenge.findByPk(req.params.id);
    if (!challenge) return next(ApiError.notFound('Challenge not found'));
    if (challenge.created_by !== req.user.id && req.user.role !== 'admin') return next(ApiError.forbidden('Creator only'));
    const { winners } = req.body; // [{ submission_id, rank, prize }]
    if (!Array.isArray(winners)) return next(ApiError.badRequest('winners array required'));

    await Promise.all(winners.map(async (w) => {
      await ChallengeSubmission.update({ status: 'winner', rank: w.rank }, { where: { id: w.submission_id } });
      const sub = await ChallengeSubmission.findByPk(w.submission_id);
      if (sub && challenge.points_reward) {
        await LeaderboardPoint.create({ user_id: sub.user_id, community_id: challenge.community_id, points: challenge.points_reward });
        await PointTransaction.create({ user_id: sub.user_id, community_id: challenge.community_id, points: challenge.points_reward, action: 'challenge_win', entity_type: 'challenge', entity_id: challenge.id });
        await User.increment('points_total', { by: challenge.points_reward, where: { id: sub.user_id } });
        await createNotification(sub.user_id, { title: 'You won! 🏆', message: 'You placed #' + w.rank + ' in "' + challenge.title + '"', type: 'challenge', actionUrl: '/challenges/' + challenge.id });
      }
    }));

    await challenge.update({ status: 'completed' });
    return ApiResponse.success(res, null, 'Winners announced');
  } catch (err) { next(err); }
};

module.exports = { listChallenges, getChallenge, createChallenge, updateChallenge, submitEntry, getSubmissions, voteSubmission, announceWinners };
