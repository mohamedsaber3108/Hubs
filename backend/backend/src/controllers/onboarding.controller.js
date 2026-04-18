'use strict';
const { OnboardingResponse, Community, CommunityMembership, User } = require('../models');
const ApiError    = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

// GET /onboarding/status
const getStatus = async (req, res, next) => {
  try {
    const response = await OnboardingResponse.findOne({ where: { user_id: req.user.id } });
    const user = await User.findByPk(req.user.id, { attributes: ['onboarding_completed','communities_joined'] });
    return ApiResponse.success(res, {
      completed: !!user.onboarding_completed,
      response: response || null,
    });
  } catch (err) { next(err); }
};

// POST /onboarding
const submitOnboarding = async (req, res, next) => {
  try {
    const {
      communities, // array of community slugs to join
      role,        // user's professional role
      goals,       // what they want from the platform
      skills,      // their key skills
      experience_level,
      headline,
      bio,
      location,
    } = req.body;

    // Update user profile
    await User.update({ headline, bio, location, role_type: role, onboarding_completed: true }, { where: { id: req.user.id } });

    // Save onboarding response
    await OnboardingResponse.findOrCreate({
      where: { user_id: req.user.id },
      defaults: { user_id: req.user.id, role, goals: goals || [], skills: skills || [], experience_level: experience_level || 'intermediate' },
    }).then(([rec]) => rec.update({ role, goals: goals || [], skills: skills || [], experience_level }));

    // Auto-join selected communities
    let joinedCommunities = [];
    if (Array.isArray(communities) && communities.length) {
      const comms = await Community.findAll({ where: { slug: communities, is_active: true } });
      for (const comm of comms) {
        await CommunityMembership.findOrCreate({ where: { user_id: req.user.id, community_id: comm.id }, defaults: { role: 'member' } });
        await Community.increment('members_count', { where: { id: comm.id } });
        joinedCommunities.push(comm.slug);
      }
    }

    return ApiResponse.success(res, { completed: true, joined_communities: joinedCommunities }, 'Onboarding complete! Welcome to USAM Hub.');
  } catch (err) { next(err); }
};

module.exports = { getStatus, submitOnboarding };
