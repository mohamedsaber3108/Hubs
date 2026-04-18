'use strict';
const bcrypt = require('bcrypt');

module.exports = {
  async up(queryInterface) {
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
