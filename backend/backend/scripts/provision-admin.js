#!/usr/bin/env node
'use strict';
/**
 * Secure initial-administrator provisioning for production (and any env).
 *
 * Replaces the old approach of seeding a fixed, publicly-known default admin
 * (superadmin@usam.hub / Admin@USAM2024! etc.) into the database. Instead the
 * operator provides real credentials at provision time via environment
 * variables, and this script creates (or refuses to duplicate) a single
 * super_admin account with a bcrypt-hashed password.
 *
 * Usage:
 *   INITIAL_ADMIN_EMAIL=you@yourdomain.com \
 *   INITIAL_ADMIN_PASSWORD='<strong password>' \
 *   INITIAL_ADMIN_NAME='Platform Owner' \
 *   npm run provision:admin
 *
 * Safety:
 *   - Refuses to run without both email and password.
 *   - Enforces a minimum password strength (>=12 chars, mixed classes).
 *   - Idempotent: if an admin with that email already exists it reports and
 *     exits 0 without changing anything (use --force to reset the password).
 *   - Never prints the password.
 */
require('dotenv').config();
const bcrypt = require('bcrypt');
const { Admin, sequelize } = require('../src/models');

const EMAIL = process.env.INITIAL_ADMIN_EMAIL;
const PASSWORD = process.env.INITIAL_ADMIN_PASSWORD;
const NAME = process.env.INITIAL_ADMIN_NAME || 'Platform Owner';
const FORCE = process.argv.includes('--force');

function fail(msg) {
  // eslint-disable-next-line no-console
  console.error('✖ ' + msg);
  process.exit(1);
}

function isStrong(pw) {
  return (
    typeof pw === 'string' &&
    pw.length >= 12 &&
    /[a-z]/.test(pw) &&
    /[A-Z]/.test(pw) &&
    /[0-9]/.test(pw) &&
    /[^A-Za-z0-9]/.test(pw)
  );
}

async function main() {
  if (!EMAIL || !PASSWORD) {
    fail('INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_PASSWORD env vars are required.');
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(EMAIL)) {
    fail('INITIAL_ADMIN_EMAIL is not a valid email address.');
  }
  if (!isStrong(PASSWORD)) {
    fail('INITIAL_ADMIN_PASSWORD too weak: need >=12 chars with lower, upper, number, and symbol.');
  }

  await sequelize.authenticate();

  const existing = await Admin.findOne({ where: { email: EMAIL } });
  if (existing && !FORCE) {
    // eslint-disable-next-line no-console
    console.log('• Admin already exists for ' + EMAIL + ' — no change. (Pass --force to reset the password.)');
    await sequelize.close();
    return;
  }

  const password_hash = await bcrypt.hash(PASSWORD, 12);

  if (existing && FORCE) {
    await existing.update({ password_hash, is_active: true });
    // eslint-disable-next-line no-console
    console.log('✔ Password reset for existing admin ' + EMAIL + '.');
  } else {
    await Admin.create({
      email: EMAIL,
      password_hash,
      name: NAME,
      role: 'super_admin',
      permissions: { all: true },
      totp_enabled: false,
      is_active: true,
    });
    // eslint-disable-next-line no-console
    console.log('✔ Super admin provisioned: ' + EMAIL + ' (role=super_admin).');
  }

  await sequelize.close();
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('✖ Provisioning failed: ' + err.message);
  process.exit(1);
});
