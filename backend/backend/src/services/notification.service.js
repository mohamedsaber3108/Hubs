'use strict';
const { Notification } = require('../models');
const logger = require('../utils/logger');

async function createNotification(userId, { title, message, type, data, actionUrl }) {
  try {
    const notif = await Notification.create({
      user_id: userId, title, message,
      type: type || 'info',
      data: data || {},
      action_url: actionUrl || null,
    });
    return notif;
  } catch (err) {
    logger.error('createNotification error: ' + err.message);
    return null;
  }
}

async function notifyFollow(followedUserId, followerName) {
  return createNotification(followedUserId, {
    title: 'New follower',
    message: followerName + ' started following you',
    type: 'follow',
  });
}

async function notifyLike(postOwnerId, likerName, postId) {
  return createNotification(postOwnerId, {
    title: 'Post liked',
    message: likerName + ' liked your post',
    type: 'like',
    actionUrl: '/feed#post-' + postId,
  });
}

async function notifyComment(postOwnerId, commenterName, postId) {
  return createNotification(postOwnerId, {
    title: 'New comment',
    message: commenterName + ' commented on your post',
    type: 'comment',
    actionUrl: '/feed#post-' + postId,
  });
}

async function notifyMessage(recipientId, senderName, conversationId) {
  return createNotification(recipientId, {
    title: 'New message',
    message: senderName + ' sent you a message',
    type: 'message',
    actionUrl: '/messages?c=' + conversationId,
  });
}

module.exports = {
  createNotification, notifyFollow, notifyLike, notifyComment, notifyMessage,
};
