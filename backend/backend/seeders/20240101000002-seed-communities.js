'use strict';
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('communities', [
      {
        slug: 'freelancespace',
        name: 'FreelanceSpace',
        emoji: '🔥',
        tagline: 'For freelancers across all industries',
        description: 'Connect with fellow freelancers, find gigs, share tips, and grow your independent career in a supportive community.',
        accent_color: '#F97316',
        members_count: 12500,
        is_active: true,
        features: JSON.stringify(['Gig marketplace & project boards','Portfolio showcase & peer reviews','Client management resources','Pricing & negotiation workshops','Freelancer success stories','Tax & legal guides']),
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        slug: 'studentzone',
        name: 'StudentZone',
        emoji: '🎓',
        tagline: 'Nomad Student Activities Community',
        description: 'Your hub for student life — activities, study groups, campus events, and peer mentoring for Arab students worldwide.',
        accent_color: '#8B5CF6',
        members_count: 18000,
        is_active: true,
        features: JSON.stringify(['Campus event discovery','Study group matching','Scholarship database','Peer mentoring circles','Student discount marketplace','Academic resource sharing']),
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        slug: 'hrconnect',
        name: 'HR Connect',
        emoji: '💼',
        tagline: 'HR professionals and recruiters',
        description: 'The premier network for HR leaders, recruiters, and talent professionals across the MENA region and beyond.',
        accent_color: '#06B6D4',
        members_count: 8200,
        is_active: true,
        features: JSON.stringify(['Talent pipeline tools','HR best practices library','Recruitment event hosting','Salary benchmarking data','Diversity & inclusion forums','HR tech reviews & demos']),
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        slug: 'launchpad',
        name: 'LaunchPad',
        emoji: '🚀',
        tagline: 'Undergraduates and fresh graduates',
        description: 'Launch your career with confidence — internships, entry-level roles, resume help, and career coaching for new grads.',
        accent_color: '#22C55E',
        members_count: 15300,
        is_active: true,
        features: JSON.stringify(['Internship & job board','Resume builder & review','Mock interview sessions','Career path exploration','Startup incubator access','Mentor matching program']),
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },
  async down(queryInterface) {
    await queryInterface.bulkDelete('communities', null, {});
  }
};
