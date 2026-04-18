'use strict';
module.exports = {
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert('email_templates', [
      {
        name: 'welcome',
        subject: 'Welcome to USAM Hub, {{firstName}}! 🎉',
        html_body: `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f9fafb"><div style="background:#fff;border-radius:12px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.1)"><h1 style="color:#6366f1;margin:0 0 8px">Welcome, {{firstName}}! 🚀</h1><p style="color:#374151">You've joined USAM Hub — the professional ecosystem for Arab professionals worldwide.</p><p style="color:#374151">Your next step is to verify your email and complete your profile.</p><a href="{{verifyUrl}}" style="display:inline-block;background:#6366f1;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">Verify Email →</a><p style="color:#9ca3af;font-size:14px;margin-top:32px">USAM Hub · hello@usam.hub</p></div></body></html>`,
        variables: JSON.stringify(['firstName', 'verifyUrl']),
        updated_at: now,
      },
      {
        name: 'email_verification',
        subject: 'Verify your USAM Hub email',
        html_body: `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px"><div style="background:#fff;border-radius:12px;padding:32px"><h2 style="color:#6366f1">Verify your email</h2><p>Click the button below to verify your email address. This link expires in 24 hours.</p><a href="{{verifyUrl}}" style="display:inline-block;background:#6366f1;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Verify Email →</a></div></body></html>`,
        variables: JSON.stringify(['verifyUrl']),
        updated_at: now,
      },
      {
        name: 'password_reset',
        subject: 'Reset your USAM Hub password',
        html_body: `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px"><div style="background:#fff;border-radius:12px;padding:32px"><h2 style="color:#6366f1">Reset your password</h2><p>We received a request to reset your password. Click below (expires in 1 hour):</p><a href="{{resetUrl}}" style="display:inline-block;background:#ef4444;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Reset Password →</a><p style="color:#9ca3af;font-size:13px">If you didn't request this, ignore this email.</p></div></body></html>`,
        variables: JSON.stringify(['resetUrl', 'firstName']),
        updated_at: now,
      },
      {
        name: 'notification',
        subject: '{{title}} — USAM Hub',
        html_body: `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px"><div style="background:#fff;border-radius:12px;padding:32px"><h2 style="color:#6366f1">{{title}}</h2><p>{{message}}</p><a href="{{actionUrl}}" style="display:inline-block;background:#6366f1;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none">View →</a></div></body></html>`,
        variables: JSON.stringify(['title', 'message', 'actionUrl']),
        updated_at: now,
      },
    ]);
  },
  async down(queryInterface) {
    await queryInterface.bulkDelete('email_templates', null, {});
  }
};
