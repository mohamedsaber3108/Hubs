'use strict';
module.exports = {
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert('pricing_plans', [
      {
        name: 'Free', slug: 'free',
        price_monthly: 0.00, price_yearly: 0.00,
        features: JSON.stringify(['Join up to 2 communities','Post & comment in feed','Apply to opportunities','Attend public events','Basic profile']),
        limits: JSON.stringify({ communities: 2, posts_per_day: 5, messages_per_day: 20 }),
        is_active: true, sort_order: 1,
        created_at: now, updated_at: now,
      },
      {
        name: 'Pro', slug: 'pro',
        price_monthly: 9.99, price_yearly: 99.99,
        features: JSON.stringify(['All communities unlimited','Unlimited posts','Priority in feed','Submit to challenges','Apply to premium opportunities','Host events','Mentor access','Analytics dashboard','Badge & verified status']),
        limits: JSON.stringify({ communities: -1, posts_per_day: -1, messages_per_day: -1 }),
        is_active: true, sort_order: 2,
        created_at: now, updated_at: now,
      },
      {
        name: 'Enterprise', slug: 'enterprise',
        price_monthly: 49.99, price_yearly: 499.99,
        features: JSON.stringify(['Everything in Pro','Team management','Custom community branding','Bulk opportunity posting','Advanced analytics','API access','Priority support','Dedicated account manager']),
        limits: JSON.stringify({ communities: -1, posts_per_day: -1, messages_per_day: -1, team_members: 10 }),
        is_active: true, sort_order: 3,
        created_at: now, updated_at: now,
      },
    ]);
  },
  async down(queryInterface) {
    await queryInterface.bulkDelete('pricing_plans', null, {});
  }
};
