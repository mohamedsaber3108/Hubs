'use strict';
const { OnboardingResponse, Community, CommunityMembership, User } = require('../models');
const ApiResponse = require('../utils/ApiResponse');

// Persona slugs that drive differentiated community experiences.
const VALID_ROLES = ['freelancer', 'student', 'recruiter', 'employer', 'entrepreneur', 'job_seeker', 'mentor'];

// GET /onboarding
// BUG-FIX: previously read user.onboarding_completed + user.communities_joined
// (the latter never existed) and returned 500. Now reads only real columns.
const getStatus = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['onboarding_completed', 'professional_roles'],
    });
    const response = await OnboardingResponse.findOne({ where: { user_id: req.user.id } });
    return ApiResponse.success(res, {
      completed: !!(user && user.onboarding_completed),
      professional_roles: (user && user.professional_roles) || [],
      response: response || null,
    });
  } catch (err) { next(err); }
};

// POST /onboarding
// BUG-FIX: previously wrote user.role_type + OnboardingResponse.role/.skills
// (none of which existed as columns) and returned 500. Now writes the real
// columns (users.professional_roles/onboarding_completed/headline/bio/location,
// onboarding_responses.goals/interests/skills/experience_level/communities).
const submitOnboarding = async (req, res, next) => {
  try {
    const {
      communities,        // array of community slugs to join
      professional_roles, // persona(s): freelancer/student/recruiter/...
      goals,              // what they want from the platform
      interests,
      skills,
      experience_level,
      headline,
      bio,
      location,
    } = req.body;

    // Sanitize persona list to the known set (ignore anything unexpected).
    const roles = Array.isArray(professional_roles)
      ? professional_roles.filter((r) => VALID_ROLES.includes(r))
      : [];

    // Update the user's profile + persona + completion flag.
    await User.update(
      {
        ...(headline !== undefined ? { headline } : {}),
        ...(bio !== undefined ? { bio } : {}),
        ...(location !== undefined ? { location } : {}),
        professional_roles: roles,
        onboarding_completed: true,
      },
      { where: { id: req.user.id } },
    );

    // Upsert the onboarding response using only real columns.
    const [record] = await OnboardingResponse.findOrCreate({
      where: { user_id: req.user.id },
      defaults: { user_id: req.user.id },
    });
    await record.update({
      goals: Array.isArray(goals) ? goals : [],
      interests: Array.isArray(interests) ? interests : [],
      skills: Array.isArray(skills) ? skills : [],
      experience_level: ['beginner', 'intermediate', 'expert'].includes(experience_level)
        ? experience_level
        : 'beginner',
      communities: Array.isArray(communities) ? communities : [],
      completed: true,
    });

    // Auto-join selected communities (admin-created official communities only).
    const joinedCommunities = [];
    if (Array.isArray(communities) && communities.length) {
      const comms = await Community.findAll({ where: { slug: communities, is_active: true } });
      for (const comm of comms) {
        const [, created] = await CommunityMembership.findOrCreate({
          where: { user_id: req.user.id, community_id: comm.id },
          defaults: { role: 'member' },
        });
        if (created) await Community.increment('members_count', { where: { id: comm.id } });
        joinedCommunities.push(comm.slug);
      }
    }

    return ApiResponse.success(
      res,
      { completed: true, professional_roles: roles, joined_communities: joinedCommunities },
      'Onboarding complete! Welcome to USAM Hub.',
    );
  } catch (err) { next(err); }
};

module.exports = { getStatus, submitOnboarding, VALID_ROLES };
