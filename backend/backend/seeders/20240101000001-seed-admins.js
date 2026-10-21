'use strict';
const bcrypt = require('bcrypt');

module.exports = {
  async up(queryInterface) {
    // PRODUCTION SAFETY: the three fixed-credential admin accounts below are
    // DEV/TEST fixtures with publicly-known passwords. Never seed them into a
    // production database. In production the initial super-admin is created
    // explicitly and securely via `npm run provision:admin`
    // (scripts/provision-admin.js), which reads a strong password from env.
    if (process.env.NODE_ENV === 'production') {
      // eslint-disable-next-line no-console
      console.log('[seed-admins] NODE_ENV=production — skipping default admin seed. Use `npm run provision:admin`.');
      return;
    }

    const superAdminHash = await bcrypt.hash('SuperAdmin@2025!', 12);
    const adminHash      = await bcrypt.hash('Admin@2025!', 12);
    const modHash        = await bcrypt.hash('Moderator@2025!', 12);

    await queryInterface.bulkInsert('admins', [
      {
        email:         'superadmin@gmail.com',
        password_hash: superAdminHash,
        name:          'Super Admin',
        role:          'super_admin',
        permissions:   JSON.stringify({ all: true }),
        totp_enabled:  false,
        is_active:     true,
        created_at:    new Date(),
        updated_at:    new Date(),
      },
      {
        email:         'admin@gmail.com',
        password_hash: adminHash,
        name:          'Admin User',
        role:          'admin',
        permissions:   JSON.stringify({ users: true, content: true, media: true }),
        totp_enabled:  false,
        is_active:     true,
        created_at:    new Date(),
        updated_at:    new Date(),
      },
      {
        email:         'moderator@gmail.com',
        password_hash: modHash,
        name:          'Moderator User',
        role:          'moderator',
        permissions:   JSON.stringify({ content: true }),
        totp_enabled:  false,
        is_active:     true,
        created_at:    new Date(),
        updated_at:    new Date(),
      },
    ], {});
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('admins', {
      email: ['superadmin@gmail.com', 'admin@gmail.com', 'moderator@gmail.com'],
    }, {});
  },
};
