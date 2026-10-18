'use strict';
const { Op } = require('sequelize');
const { Mentor, MentorRequest, User, Community } = require('../models');
const { uploadFile } = require('../services/s3.service');
const { createNotification } = require('../services/notification.service');
const ApiError    = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { paginate } = require('../utils/paginate');

const userAttrs = ['id','first_name','last_name','username','avatar_url','headline','bio','location'];

// GET /mentors
const listMentors = async (req, res, next) => {
  try {
    const { page, limit, offset } = paginate(req.query);
    const { community, expertise, search, available } = req.query;
    const where = { is_approved: true };
    if (available === 'true') where.is_available = true;
    if (expertise) where.expertise = { [Op.like]: '%' + expertise + '%' };
    if (search) {
      const users = await User.findAll({ where: { [Op.or]: [
        { first_name: { [Op.like]: '%' + search + '%' } },
        { last_name:  { [Op.like]: '%' + search + '%' } },
        { username:   { [Op.like]: '%' + search + '%' } },
      ]}, attributes: ['id'] });
      where.user_id = { [Op.in]: users.map((u) => u.id) };
    }
    if (community) {
      const comm = await Community.findOne({ where: { slug: community } });
      if (comm) where.community_id = comm.id;
    }
    const { count, rows } = await Mentor.findAndCountAll({
      // BUG-04: two real columns/associations that don't exist --
      // 'rating' (the actual column is `rating_avg`) and a
      // Mentor->Community Sequelize association (Mentor only has a
      // loose `communities` JSON field, no real FK/association is
      // defined in models/index.js). Both caused GET /mentors to 500
      // on its happy path. Sort on real columns; drop the impossible
      // eager-load (community filtering above still works via the
      // plain `where.community_id` lookup).
      where, limit, offset, order: [['rating_avg','DESC'],['sessions_count','DESC']],
      include: [
        { model: User, as: 'user', attributes: userAttrs },
      ],
    });
    return ApiResponse.paginated(res, rows, { page, limit, total: count });
  } catch (err) { next(err); }
};

// GET /mentors/:id
const getMentor = async (req, res, next) => {
  try {
    const mentor = await Mentor.findByPk(req.params.id, {
      // BUG-04: no Mentor->Community association exists, see note above.
      include: [
        { model: User, as: 'user', attributes: userAttrs },
      ],
    });
    if (!mentor || !mentor.is_approved) return next(ApiError.notFound('Mentor not found'));
    let myRequest = null;
    if (req.user) {
      myRequest = await MentorRequest.findOne({ where: { mentor_id: mentor.id, mentee_id: req.user.id, status: { [Op.in]: ['pending','accepted'] } } });
    }
    return ApiResponse.success(res, { mentor, my_request: myRequest });
  } catch (err) { next(err); }
};

// POST /mentors (become a mentor)
const becomeMentor = async (req, res, next) => {
  try {
    const existing = await Mentor.findOne({ where: { user_id: req.user.id } });
    if (existing) return next(ApiError.conflict('You already have a mentor profile'));
    // BUG-14b: Mentor.community_id is nullable (a mentor can register
    // without picking a single community -- see models/Mentor.js), but
    // this unconditionally called Community.findOne({ where: { slug:
    // req.body.community_slug }}) even when community_slug was never
    // sent, hitting the same "WHERE parameter slug has invalid
    // undefined value" 500 as the other create* bugs. Only look it up
    // when actually provided.
    let community_id = null;
    if (req.body.community_slug) {
      const community = await Community.findOne({ where: { slug: req.body.community_slug } });
      if (!community) return next(ApiError.notFound('Community not found'));
      community_id = community.id;
    }
    const mentor = await Mentor.create({ ...req.body, user_id: req.user.id, community_id, is_approved: false });
    return ApiResponse.created(res, { mentor }, 'Mentor application submitted for review');
  } catch (err) { next(err); }
};

// PUT /mentors/me
const updateMyProfile = async (req, res, next) => {
  try {
    const mentor = await Mentor.findOne({ where: { user_id: req.user.id } });
    if (!mentor) return next(ApiError.notFound('You are not a mentor'));
    if (req.file) { const r = await uploadFile(req.file, 'mentors'); req.body.profile_image = r.url; }
    await mentor.update(req.body);
    return ApiResponse.success(res, { mentor }, 'Mentor profile updated');
  } catch (err) { next(err); }
};

// POST /mentors/:id/request
const requestSession = async (req, res, next) => {
  try {
    const mentor = await Mentor.findByPk(req.params.id, { include: [{ model: User, as: 'user', attributes: ['id','first_name','last_name','email'] }] });
    if (!mentor || !mentor.is_approved) return next(ApiError.notFound('Mentor not found'));
    if (!mentor.is_available) return next(ApiError.badRequest('Mentor is not available'));
    if (mentor.user_id === req.user.id) return next(ApiError.badRequest('Cannot request session with yourself'));

    const pending = await MentorRequest.findOne({ where: { mentor_id: mentor.id, mentee_id: req.user.id, status: { [Op.in]: ['pending','accepted'] } } });
    if (pending) return next(ApiError.conflict('You already have an active request with this mentor'));

    const session = await MentorRequest.create({
      mentor_id: mentor.id, mentee_id: req.user.id,
      topic:    req.body.topic,
      message:  req.body.message || null,
      preferred_time: req.body.preferred_time || null,
      session_type: req.body.session_type || 'video',
    });

    await createNotification(mentor.user_id, {
      title: 'New mentorship request',
      message: req.user.first_name + ' ' + req.user.last_name + ' wants to connect about: ' + req.body.topic,
      type: 'mentor', actionUrl: '/mentors/requests',
    });
    return ApiResponse.created(res, { session }, 'Session request sent');
  } catch (err) { next(err); }
};

// GET /mentors/requests (my incoming + outgoing)
const getMyRequests = async (req, res, next) => {
  try {
    const { type = 'all' } = req.query;
    const { page, limit, offset } = paginate(req.query);

    let where = {};
    if (type === 'incoming') {
      const mentor = await Mentor.findOne({ where: { user_id: req.user.id } });
      if (!mentor) return ApiResponse.paginated(res, [], { page, limit, total: 0 });
      where.mentor_id = mentor.id;
    } else if (type === 'outgoing') {
      where.mentee_id = req.user.id;
    } else {
      const mentor = await Mentor.findOne({ where: { user_id: req.user.id } });
      where[Op.or] = [
        { mentee_id: req.user.id },
        ...(mentor ? [{ mentor_id: mentor.id }] : []),
      ];
    }

    const { count, rows } = await MentorRequest.findAndCountAll({
      where, limit, offset, order: [['created_at','DESC']],
      include: [
        { model: User, as: 'mentee', attributes: userAttrs },
        { model: Mentor, as: 'mentor', include: [{ model: User, as: 'user', attributes: userAttrs }] },
      ],
    });
    return ApiResponse.paginated(res, rows, { page, limit, total: count });
  } catch (err) { next(err); }
};

// PATCH /mentors/requests/:id
const updateRequest = async (req, res, next) => {
  try {
    const request = await MentorRequest.findByPk(req.params.id, {
      include: [{ model: Mentor, as: 'mentor' }],
    });
    if (!request) return next(ApiError.notFound('Request not found'));
    const isMentor = request.mentor.user_id === req.user.id;
    const isMentee = request.mentee_id === req.user.id;
    if (!isMentor && !isMentee) return next(ApiError.forbidden('Not your request'));

    const { status, scheduled_time, notes, meeting_url } = req.body;
    await request.update({ status, scheduled_time: scheduled_time || null, notes: notes || null, meeting_url: meeting_url || null });

    if (status === 'completed') {
      await Mentor.increment('sessions_count', { where: { id: request.mentor_id } });
    }

    const notifyUserId = isMentor ? request.mentee_id : request.mentor.user_id;
    const actionVerb = status === 'accepted' ? 'accepted' : status === 'rejected' ? 'declined' : 'updated';
    await createNotification(notifyUserId, {
      title: 'Session request ' + actionVerb,
      message: 'Your mentorship session has been ' + actionVerb,
      type: 'mentor',
    });

    return ApiResponse.success(res, { request }, 'Request updated');
  } catch (err) { next(err); }
};

module.exports = { listMentors, getMentor, becomeMentor, updateMyProfile, requestSession, getMyRequests, updateRequest };
