'use strict';
const bcrypt = require('bcrypt');

module.exports = {
  async up(queryInterface) {
    const userHash = await bcrypt.hash('User@2025!', 12);
    const demoHash = await bcrypt.hash('Demo@2025!', 12);
    const now = new Date();

    await queryInterface.bulkInsert('users', [
      // Primary test user (audit prompt)
      {
        uuid: '550e8400-e29b-41d4-a716-446655440000',
        first_name: 'Test', last_name: 'User', username: 'testuser',
        email: 'user@gmail.com', password_hash: userHash,
        bio: 'Primary test account.', headline: 'Test User',
        location: 'Cairo, Egypt', role: 'user', status: 'active',
        email_verified: true, provider: 'local', points_total: 0,
        followers_count: 0, following_count: 0,
        created_at: now, updated_at: now,
      },
      // Demo users
      {
        uuid: '550e8400-e29b-41d4-a716-446655440001',
        first_name: 'Ahmed', last_name: 'Hassan', username: 'ahmed.hassan',
        email: 'ahmed@demo.usam.hub', password_hash: demoHash,
        bio: 'Full-stack developer & freelancer.', headline: 'Full-Stack Developer | Freelancer',
        location: 'Cairo, Egypt', role: 'user', status: 'active',
        email_verified: true, provider: 'local', points_total: 1250,
        followers_count: 340, following_count: 120,
        created_at: now, updated_at: now,
      },
      {
        uuid: '550e8400-e29b-41d4-a716-446655440002',
        first_name: 'Sara', last_name: 'Mohamed', username: 'sara.design',
        email: 'sara@demo.usam.hub', password_hash: demoHash,
        bio: 'UX/UI Designer passionate about creating beautiful experiences.', headline: 'UX/UI Designer | Freelancer',
        location: 'Dubai, UAE', role: 'user', status: 'active',
        email_verified: true, provider: 'local', points_total: 2100,
        followers_count: 520, following_count: 89,
        created_at: now, updated_at: now,
      },
      {
        uuid: '550e8400-e29b-41d4-a716-446655440003',
        first_name: 'Omar', last_name: 'Khalil', username: 'omar.hr',
        email: 'omar@demo.usam.hub', password_hash: demoHash,
        bio: 'HR Director with 10+ years of talent acquisition experience.', headline: 'HR Director | Talent Acquisition',
        location: 'Riyadh, Saudi Arabia', role: 'user', status: 'active',
        email_verified: true, provider: 'local', points_total: 870,
        followers_count: 210, following_count: 145,
        created_at: now, updated_at: now,
      },
      {
        uuid: '550e8400-e29b-41d4-a716-446655440004',
        first_name: 'Nour', last_name: 'Ibrahim', username: 'nour.student',
        email: 'nour@demo.usam.hub', password_hash: demoHash,
        bio: 'CS student at AUC, passionate about AI and startups.', headline: 'CS Student | Aspiring Entrepreneur',
        location: 'Cairo, Egypt', role: 'user', status: 'active',
        email_verified: true, provider: 'local', points_total: 650,
        followers_count: 95, following_count: 200,
        created_at: now, updated_at: now,
      },
    ], {});

    await queryInterface.bulkInsert('community_memberships', [
      { user_id: 2, community_id: 1, role: 'member', joined_at: now },
      { user_id: 2, community_id: 4, role: 'member', joined_at: now },
      { user_id: 3, community_id: 1, role: 'moderator', joined_at: now },
      { user_id: 4, community_id: 3, role: 'member', joined_at: now },
      { user_id: 5, community_id: 2, role: 'member', joined_at: now },
      { user_id: 5, community_id: 4, role: 'member', joined_at: now },
    ], {});
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('community_memberships', null, {});
    await queryInterface.bulkDelete('users', {
      email: {
        [require('sequelize').Op.in]: [
          'user@gmail.com',
          'ahmed@demo.usam.hub', 'sara@demo.usam.hub',
          'omar@demo.usam.hub',  'nour@demo.usam.hub',
        ],
      },
    }, {});
  },
};
