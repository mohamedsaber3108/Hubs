'use strict';
const { Post, PostLike, PostComment, User, Community } = require('../models');
const { Op } = require('sequelize');
const { uploadFile } = require('../services/s3.service');
const { notifyLike, notifyComment } = require('../services/notification.service');
const ApiError    = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { paginate, paginationMeta } = require('../utils/paginate');

const userAttrs = ['id','first_name','last_name','username','avatar_url','headline'];

const getFeed = async (req, res, next) => {
  try {
    const { page, limit, offset } = paginate(req.query);
    const communitySlug = req.query.community;
    const where = { is_published: true };
    if (communitySlug) {
      const community = await Community.findOne({ where: { slug: communitySlug } });
      if (community) where.community_id = community.id;
    }
    const { count, rows } = await Post.findAndCountAll({
      where, limit, offset,
      include: [
        { model: User, as: 'author', attributes: userAttrs },
        { model: Community, as: 'community', attributes: ['id','slug','name','emoji'] },
      ],
      order: [['is_pinned','DESC'],['created_at','DESC']],
    });
    const postsWithLiked = await Promise.all(rows.map(async (p) => {
      const liked = req.user ? !!(await PostLike.findOne({ where: { post_id: p.id, user_id: req.user.id } })) : false;
      return { ...p.toJSON(), liked };
    }));
    return ApiResponse.paginated(res, postsWithLiked, { page, limit, total: count });
  } catch (err) { next(err); }
};

const createPost = async (req, res, next) => {
  try {
    const { content, type, community_slug, link_url, poll_options } = req.body;
    const community = await Community.findOne({ where: { slug: community_slug } });
    if (!community) return next(ApiError.notFound('Community not found'));

    let media_urls = [];
    if (req.files && req.files.length) {
      const uploads = await Promise.all(req.files.map((f) => uploadFile(f, 'posts')));
      media_urls = uploads.map((u) => u.url);
    }

    const post = await Post.create({
      user_id: req.user.id, community_id: community.id,
      content, type: type || 'text', media_urls, link_url, poll_options,
    });

    const full = await Post.findByPk(post.id, {
      include: [
        { model: User, as: 'author', attributes: userAttrs },
        { model: Community, as: 'community', attributes: ['id','slug','name','emoji'] },
      ],
    });
    return ApiResponse.created(res, { post: full }, 'Post created');
  } catch (err) { next(err); }
};

const getPost = async (req, res, next) => {
  try {
    const post = await Post.findByPk(req.params.id, {
      include: [
        { model: User, as: 'author', attributes: userAttrs },
        { model: Community, as: 'community', attributes: ['id','slug','name','emoji'] },
        { model: PostComment, as: 'comments', where: { parent_id: null, is_deleted: false }, required: false,
          include: [{ model: User, as: 'author', attributes: userAttrs },
                    { model: PostComment, as: 'replies', required: false,
                      where: { is_deleted: false }, include: [{ model: User, as: 'author', attributes: userAttrs }] }] },
      ],
    });
    if (!post) return next(ApiError.notFound('Post not found'));
    const liked = req.user ? !!(await PostLike.findOne({ where: { post_id: post.id, user_id: req.user.id } })) : false;
    return ApiResponse.success(res, { post: { ...post.toJSON(), liked } });
  } catch (err) { next(err); }
};

const updatePost = async (req, res, next) => {
  try {
    const post = await Post.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!post) return next(ApiError.notFound('Post not found or not yours'));
    await post.update({ content: req.body.content });
    return ApiResponse.success(res, { post }, 'Post updated');
  } catch (err) { next(err); }
};

const deletePost = async (req, res, next) => {
  try {
    const where = req.user.role === 'admin' ? { id: req.params.id } : { id: req.params.id, user_id: req.user.id };
    const post = await Post.findOne({ where });
    if (!post) return next(ApiError.notFound('Post not found'));
    await post.update({ is_published: false });
    return ApiResponse.success(res, null, 'Post deleted');
  } catch (err) { next(err); }
};

const likePost = async (req, res, next) => {
  try {
    const post = await Post.findByPk(req.params.id);
    if (!post) return next(ApiError.notFound('Post not found'));
    const [, created] = await PostLike.findOrCreate({ where: { post_id: post.id, user_id: req.user.id } });
    if (created) {
      await Post.increment('likes_count', { where: { id: post.id } });
      if (post.user_id !== req.user.id)
        await notifyLike(post.user_id, req.user.first_name + ' ' + req.user.last_name, post.id);
    } else {
      await PostLike.destroy({ where: { post_id: post.id, user_id: req.user.id } });
      await Post.decrement('likes_count', { where: { id: post.id } });
    }
    return ApiResponse.success(res, { liked: created }, created ? 'Post liked' : 'Post unliked');
  } catch (err) { next(err); }
};

const addComment = async (req, res, next) => {
  try {
    const post = await Post.findByPk(req.params.id);
    if (!post) return next(ApiError.notFound('Post not found'));
    const comment = await PostComment.create({
      post_id: post.id, user_id: req.user.id,
      content: req.body.content, parent_id: req.body.parent_id || null,
    });
    await Post.increment('comments_count', { where: { id: post.id } });
    const full = await PostComment.findByPk(comment.id, { include: [{ model: User, as: 'author', attributes: userAttrs }] });
    if (post.user_id !== req.user.id)
      await notifyComment(post.user_id, req.user.first_name + ' ' + req.user.last_name, post.id);
    return ApiResponse.created(res, { comment: full });
  } catch (err) { next(err); }
};

const deleteComment = async (req, res, next) => {
  try {
    const where = req.user.role === 'admin' ? { id: req.params.commentId } : { id: req.params.commentId, user_id: req.user.id };
    const comment = await PostComment.findOne({ where });
    if (!comment) return next(ApiError.notFound('Comment not found'));
    await comment.update({ is_deleted: true });
    return ApiResponse.success(res, null, 'Comment deleted');
  } catch (err) { next(err); }
};

module.exports = { getFeed, createPost, getPost, updatePost, deletePost, likePost, addComment, deleteComment };
