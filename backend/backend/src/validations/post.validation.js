'use strict';
const Joi = require('joi');

// BUG-16: POST /posts and POST /posts/:id/comments had no validation
// middleware at all -- Post.content/PostComment.content are
// `allowNull: false` at the DB level, but an empty string '' still
// satisfies "not null", so creating a post/comment with empty content
// silently succeeded (201) instead of being rejected (400).

const createPost = Joi.object({
  content:        Joi.string().trim().min(1).max(10000).required(),
  type:           Joi.string().valid('text','image','video','link','poll').default('text'),
  community_slug: Joi.string().required(),
  link_url:       Joi.string().uri().allow('', null),
  poll_options:   Joi.array().items(Joi.string()).allow(null),
});

const createComment = Joi.object({
  content:   Joi.string().trim().min(1).max(2000).required(),
  parent_id: Joi.number().integer().allow(null),
});

module.exports = { createPost, createComment };
