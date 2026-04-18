'use strict';
const { Op } = require('sequelize');
const { Conversation, ConversationParticipant, ChatMessage, User } = require('../models');
const { notifyMessage } = require('../services/notification.service');
const ApiError    = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { paginate } = require('../utils/paginate');

const userAttrs = ['id','first_name','last_name','username','avatar_url'];

// ─── Helper: ensure user is conversation participant ──────────────────────────
async function ensureParticipant(conversationId, userId) {
  const p = await ConversationParticipant.findOne({ where: { conversation_id: conversationId, user_id: userId } });
  if (!p) throw ApiError.forbidden('Not a participant of this conversation');
  return p;
}

// GET /messages — list conversations
const listConversations = async (req, res, next) => {
  try {
    const { page, limit, offset } = paginate(req.query);
    const participantRows = await ConversationParticipant.findAll({
      where: { user_id: req.user.id },
      attributes: ['conversation_id'],
    });
    const convoIds = participantRows.map((p) => p.conversation_id);
    if (!convoIds.length) return ApiResponse.paginated(res, [], { page, limit, total: 0 });

    const { count, rows } = await Conversation.findAndCountAll({
      where: { id: { [Op.in]: convoIds } },
      order: [['last_message_at','DESC'],['created_at','DESC']],
      limit, offset,
      include: [
        { model: ConversationParticipant, as: 'participants',
          include: [{ model: User, as: 'user', attributes: userAttrs }] },
      ],
    });

    // Attach unread count and last message per conversation
    const data = await Promise.all(rows.map(async (conv) => {
      const [lastMsg, unread] = await Promise.all([
        ChatMessage.findOne({ where: { conversation_id: conv.id }, order: [['created_at','DESC']] }),
        ChatMessage.count({ where: { conversation_id: conv.id, sender_id: { [Op.ne]: req.user.id }, is_read: false } }),
      ]);
      return { ...conv.toJSON(), last_message: lastMsg, unread_count: unread };
    }));

    return ApiResponse.paginated(res, data, { page, limit, total: count });
  } catch (err) { next(err); }
};

// GET /messages/:conversationId — get messages in a conversation
const getMessages = async (req, res, next) => {
  try {
    await ensureParticipant(req.params.conversationId, req.user.id);
    const { page, limit, offset } = paginate(req.query);
    const { count, rows } = await ChatMessage.findAndCountAll({
      where: { conversation_id: req.params.conversationId },
      order: [['created_at','DESC']],
      limit, offset,
      include: [{ model: User, as: 'sender', attributes: userAttrs }],
    });
    // Mark messages as read
    await ChatMessage.update(
      { is_read: true },
      { where: { conversation_id: req.params.conversationId, sender_id: { [Op.ne]: req.user.id }, is_read: false } }
    );
    return ApiResponse.paginated(res, rows.reverse(), { page, limit, total: count });
  } catch (err) { next(err); }
};

// POST /messages — start conversation or get existing
const startConversation = async (req, res, next) => {
  try {
    const { user_id, message } = req.body;
    if (!user_id || !message) return next(ApiError.badRequest('user_id and message required'));
    if (user_id === req.user.id) return next(ApiError.badRequest('Cannot message yourself'));

    const otherUser = await User.findOne({ where: { id: user_id, is_deleted: false } });
    if (!otherUser) return next(ApiError.notFound('User not found'));

    // Check for existing direct conversation
    const existingParticipantRows = await ConversationParticipant.findAll({
      where: { user_id: req.user.id },
      attributes: ['conversation_id'],
    });
    const myConvoIds = existingParticipantRows.map((p) => p.conversation_id);

    let conversation = null;
    if (myConvoIds.length) {
      const shared = await ConversationParticipant.findOne({
        where: { conversation_id: { [Op.in]: myConvoIds }, user_id },
      });
      if (shared) {
        conversation = await Conversation.findOne({
          where: { id: shared.conversation_id, type: 'direct' },
        });
      }
    }

    if (!conversation) {
      conversation = await Conversation.create({ type: 'direct' });
      await ConversationParticipant.bulkCreate([
        { conversation_id: conversation.id, user_id: req.user.id },
        { conversation_id: conversation.id, user_id },
      ]);
    }

    const msg = await ChatMessage.create({ conversation_id: conversation.id, sender_id: req.user.id, content: message });
    await Conversation.update({ last_message_at: new Date() }, { where: { id: conversation.id } });
    await notifyMessage(user_id, req.user.first_name + ' ' + req.user.last_name, conversation.id);

    // Emit via socket
    const io = req.app.get('io');
    if (io) {
      io.of('/chat').to('conversation:' + conversation.id).emit('new-message', {
        ...msg.toJSON(), sender: { id: req.user.id, first_name: req.user.first_name, last_name: req.user.last_name, username: req.user.username, avatar_url: req.user.avatar_url },
      });
    }

    return ApiResponse.created(res, { conversation_id: conversation.id, message: msg }, 'Message sent');
  } catch (err) { next(err); }
};

// POST /messages/:conversationId — send message to existing conversation
const sendMessage = async (req, res, next) => {
  try {
    await ensureParticipant(req.params.conversationId, req.user.id);
    const { content, type = 'text', media_url } = req.body;
    if (!content && !media_url) return next(ApiError.badRequest('content or media_url required'));

    const msg = await ChatMessage.create({
      conversation_id: req.params.conversationId,
      sender_id: req.user.id, content, type, media_url: media_url || null,
    });
    await Conversation.update({ last_message_at: new Date() }, { where: { id: req.params.conversationId } });

    const full = await ChatMessage.findByPk(msg.id, { include: [{ model: User, as: 'sender', attributes: userAttrs }] });

    // Notify other participants
    const others = await ConversationParticipant.findAll({
      where: { conversation_id: req.params.conversationId, user_id: { [Op.ne]: req.user.id } },
    });
    await Promise.all(others.map((p) => notifyMessage(p.user_id, req.user.first_name + ' ' + req.user.last_name, req.params.conversationId)));

    // Emit via socket
    const io = req.app.get('io');
    if (io) io.of('/chat').to('conversation:' + req.params.conversationId).emit('new-message', full.toJSON());

    return ApiResponse.created(res, { message: full });
  } catch (err) { next(err); }
};

// DELETE /messages/:conversationId/messages/:messageId
const deleteMessage = async (req, res, next) => {
  try {
    const msg = await ChatMessage.findOne({ where: { id: req.params.messageId, conversation_id: req.params.conversationId, sender_id: req.user.id } });
    if (!msg) return next(ApiError.notFound('Message not found'));
    await msg.update({ is_deleted: true, content: null });
    return ApiResponse.success(res, null, 'Message deleted');
  } catch (err) { next(err); }
};

// GET /messages/:conversationId/participants
const getParticipants = async (req, res, next) => {
  try {
    await ensureParticipant(req.params.conversationId, req.user.id);
    const participants = await ConversationParticipant.findAll({
      where: { conversation_id: req.params.conversationId },
      include: [{ model: User, as: 'user', attributes: userAttrs }],
    });
    return ApiResponse.success(res, { participants });
  } catch (err) { next(err); }
};

module.exports = { listConversations, getMessages, startConversation, sendMessage, deleteMessage, getParticipants };
