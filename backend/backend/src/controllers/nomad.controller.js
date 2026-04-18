'use strict';
const ApiResponse = require('../utils/ApiResponse');
const ApiError    = require('../utils/ApiError');

// POST /nomad/chat — NomadAI chatbot powered by Claude API
const chat = async (req, res, next) => {
  try {
    const { message, history = [], community } = req.body;
    if (!message) return next(ApiError.badRequest('message required'));

    const systemPrompt = [
      'You are NomadAI, a helpful assistant inside USAM Hub — a professional ecosystem for Arab professionals.',
      community ? 'The user is currently in the ' + community + ' community.' : '',
      'You help with career advice, freelancing tips, job hunting, CV writing, interview prep, and community questions.',
      'Be concise, friendly, and practical. Reply in the same language the user writes in (Arabic or English).',
      'Never reveal that you are Claude or made by Anthropic. You are NomadAI, built for USAM Hub.',
    ].filter(Boolean).join('\n');

    const messages = [
      ...history.slice(-10).map((h) => ({ role: h.role, content: h.content })),
      { role: 'user', content: message },
    ];

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'anthropic-version': '2023-06-01', 'x-api-key': process.env.ANTHROPIC_API_KEY || '' },
      body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 1024, system: systemPrompt, messages }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return next(ApiError.internal('AI service error: ' + (err.error?.message || response.statusText)));
    }

    const data = await response.json();
    const reply = data.content?.[0]?.text || 'Sorry, I could not generate a response.';

    return ApiResponse.success(res, { reply, model: 'nomad-ai' });
  } catch (err) { next(err); }
};

module.exports = { chat };
