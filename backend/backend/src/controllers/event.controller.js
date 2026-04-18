'use strict';
const { Op } = require('sequelize');
const { Event, EventAttendee, Community, User } = require('../models');
const { uploadFile } = require('../services/s3.service');
const { createNotification } = require('../services/notification.service');
const ApiError    = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { paginate } = require('../utils/paginate');
const Joi = require('joi');

const userAttrs = ['id','first_name','last_name','username','avatar_url','headline'];

const createSchema = Joi.object({
  title:         Joi.string().trim().max(255).required(),
  description:   Joi.string().max(5000).optional(),
  community_slug:Joi.string().required(),
  type:          Joi.string().valid('online','in_person','hybrid').default('online'),
  start_date:    Joi.date().iso().required(),
  end_date:      Joi.date().iso().min(Joi.ref('start_date')).required(),
  timezone:      Joi.string().max(100).optional(),
  location:      Joi.string().max(500).allow('', null),
  meeting_url:   Joi.string().uri().allow('', null),
  max_attendees: Joi.number().integer().min(1).allow(null),
  is_free:       Joi.boolean().default(true),
  price:         Joi.number().min(0).allow(null),
  tags:          Joi.array().items(Joi.string()).default([]),
  requirements:  Joi.string().max(2000).allow('', null),
});

// GET /events
const listEvents = async (req, res, next) => {
  try {
    const { page, limit, offset } = paginate(req.query);
    const { community, type, status, upcoming, search } = req.query;
    const where = {};
    if (type)   where.type   = type;
    if (status) where.status = status;
    if (search) where.title  = { [Op.like]: '%' + search + '%' };
    if (upcoming === 'true') where.start_date = { [Op.gte]: new Date() };
    if (community) {
      const comm = await Community.findOne({ where: { slug: community } });
      if (comm) where.community_id = comm.id;
    }
    const { count, rows } = await Event.findAndCountAll({
      where, limit, offset, order: [['start_date','ASC']],
      include: [
        { model: Community, as: 'community', attributes: ['id','slug','name','emoji'] },
        { model: User, as: 'organizer', attributes: userAttrs },
      ],
    });
    const data = req.user ? await Promise.all(rows.map(async (e) => {
      const rsvp = await EventAttendee.findOne({ where: { event_id: e.id, user_id: req.user.id } });
      return { ...e.toJSON(), rsvp_status: rsvp ? rsvp.status : null };
    })) : rows.map((e) => e.toJSON());
    return ApiResponse.paginated(res, data, { page, limit, total: count });
  } catch (err) { next(err); }
};

// GET /events/:id
const getEvent = async (req, res, next) => {
  try {
    const event = await Event.findByPk(req.params.id, {
      include: [
        { model: Community, as: 'community', attributes: ['id','slug','name','emoji'] },
        { model: User, as: 'organizer', attributes: userAttrs },
      ],
    });
    if (!event) return next(ApiError.notFound('Event not found'));
    let rsvp = null;
    if (req.user) {
      rsvp = await EventAttendee.findOne({ where: { event_id: event.id, user_id: req.user.id } });
    }
    return ApiResponse.success(res, { event, rsvp });
  } catch (err) { next(err); }
};

// POST /events
const createEvent = async (req, res, next) => {
  try {
    const { error, value } = createSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) return next(ApiError.badRequest('Validation failed', error.details.map((d) => ({ field: d.context.key, message: d.message }))));

    const community = await Community.findOne({ where: { slug: value.community_slug } });
    if (!community) return next(ApiError.notFound('Community not found'));

    let cover_image = null;
    if (req.file) { const r = await uploadFile(req.file, 'events'); cover_image = r.url; }

    const event = await Event.create({
      ...value, community_id: community.id, created_by: req.user.id, cover_url: cover_image,
    });
    return ApiResponse.created(res, { event }, 'Event created');
  } catch (err) { next(err); }
};

// PUT /events/:id
const updateEvent = async (req, res, next) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) return next(ApiError.notFound('Event not found'));
    if (event.created_by !== req.user.id && req.user.role !== 'admin') return next(ApiError.forbidden('Organizer only'));
    if (req.file) { const r = await uploadFile(req.file, 'events'); req.body.cover_url = r.url; }
    await event.update(req.body);
    return ApiResponse.success(res, { event }, 'Event updated');
  } catch (err) { next(err); }
};

// DELETE /events/:id
const deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) return next(ApiError.notFound('Event not found'));
    if (event.created_by !== req.user.id && req.user.role !== 'admin') return next(ApiError.forbidden('Organizer only'));
    await event.update({ status: 'cancelled' });
    return ApiResponse.success(res, null, 'Event cancelled');
  } catch (err) { next(err); }
};

// POST /events/:id/rsvp
const rsvp = async (req, res, next) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) return next(ApiError.notFound('Event not found'));
    if (event.status === 'cancelled') return next(ApiError.badRequest('Event is cancelled'));
    const status = req.body.status || 'going';
    if (!['going','maybe','not_going'].includes(status)) return next(ApiError.badRequest('Invalid RSVP status'));
    if (status === 'going' && event.max_attendees) {
      const goingCount = await EventAttendee.count({ where: { event_id: event.id, status: 'going' } });
      if (goingCount >= event.max_attendees) return next(ApiError.badRequest('Event is full'));
    }
    const [attendee, created] = await EventAttendee.findOrCreate({
      where: { event_id: event.id, user_id: req.user.id },
      defaults: { status },
    });
    if (!created) await attendee.update({ status });
    if (created && status === 'going') await Event.increment('attendees_count', { where: { id: event.id } });
    if (!created && status === 'not_going') await Event.decrement('attendees_count', { where: { id: event.id } });
    return ApiResponse.success(res, { status: attendee.status }, 'RSVP saved');
  } catch (err) { next(err); }
};

// GET /events/:id/attendees
const getAttendees = async (req, res, next) => {
  try {
    const { page, limit, offset } = paginate(req.query);
    const { status = 'going' } = req.query;
    const { count, rows } = await EventAttendee.findAndCountAll({
      where: { event_id: req.params.id, status },
      include: [{ model: User, as: 'user', attributes: userAttrs }],
      limit, offset,
    });
    return ApiResponse.paginated(res, rows, { page, limit, total: count });
  } catch (err) { next(err); }
};

module.exports = { listEvents, getEvent, createEvent, updateEvent, deleteEvent, rsvp, getAttendees };
