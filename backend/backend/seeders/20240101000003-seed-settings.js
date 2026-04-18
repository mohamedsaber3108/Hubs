'use strict';
module.exports = {
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert('settings', [
      { key: 'site_name', value: 'USAM Hub', type: 'string', group: 'general', is_public: true, updated_at: now },
      { key: 'site_tagline', value: 'Your Professional Ecosystem', type: 'string', group: 'general', is_public: true, updated_at: now },
      { key: 'site_description', value: 'Connect, learn, and grow with USAM Hub — the professional ecosystem for Arab professionals worldwide.', type: 'string', group: 'general', is_public: true, updated_at: now },
      { key: 'maintenance_mode', value: 'false', type: 'boolean', group: 'general', is_public: false, updated_at: now },
      { key: 'registration_enabled', value: 'true', type: 'boolean', group: 'auth', is_public: false, updated_at: now },
      { key: 'email_verification_required', value: 'true', type: 'boolean', group: 'auth', is_public: false, updated_at: now },
      { key: 'max_file_size_mb', value: '10', type: 'number', group: 'uploads', is_public: false, updated_at: now },
      { key: 'allowed_file_types', value: 'jpg,png,webp,pdf,doc,docx,xlsx', type: 'string', group: 'uploads', is_public: false, updated_at: now },
      { key: 'support_email', value: 'support@usam.hub', type: 'string', group: 'contact', is_public: true, updated_at: now },
      { key: 'contact_email', value: 'hello@usam.hub', type: 'string', group: 'contact', is_public: true, updated_at: now },
    ]);
    await queryInterface.bulkInsert('feature_flags', [
      { name: 'ai_assistant', is_enabled: true, description: 'NomadAI assistant chatbot', updated_at: now },
      { name: 'real_time_messaging', is_enabled: true, description: 'Real-time Socket.io messaging', updated_at: now },
      { name: 'challenges', is_enabled: true, description: 'Community challenges feature', updated_at: now },
      { name: 'leaderboard', is_enabled: true, description: 'Community leaderboard and points', updated_at: now },
      { name: 'mentor_matching', is_enabled: true, description: 'Mentor matching and requests', updated_at: now },
      { name: 'paid_subscriptions', is_enabled: false, description: 'Paid subscription plans', updated_at: now },
      { name: 'job_applications', is_enabled: true, description: 'In-platform job applications', updated_at: now },
    ]);
  },
  async down(queryInterface) {
    await queryInterface.bulkDelete('feature_flags', null, {});
    await queryInterface.bulkDelete('settings', null, {});
  }
};
