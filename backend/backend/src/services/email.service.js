'use strict';
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const nodemailer = require('nodemailer');
const { EmailTemplate } = require('../models');
const logger = require('../utils/logger');

const sesClient = new SESClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Fallback SMTP transport
const smtpTransport = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

function renderTemplate(html, variables) {
  let result = html;
  for (const [key, val] of Object.entries(variables || {})) {
    result = result.replace(new RegExp('{{' + key + '}}', 'g'), val || '');
  }
  return result;
}

async function sendEmail({ to, subject, html, text }) {
  const from = process.env.AWS_SES_FROM || 'noreply@usam.hub';

  // Try SES first
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SES_FROM) {
    try {
      const command = new SendEmailCommand({
        Source: from,
        Destination: { ToAddresses: Array.isArray(to) ? to : [to] },
        Message: {
          Subject: { Data: subject, Charset: 'UTF-8' },
          Body: {
            Html: html ? { Data: html, Charset: 'UTF-8' } : undefined,
            Text: text ? { Data: text || '', Charset: 'UTF-8' } : undefined,
          },
        },
      });
      await sesClient.send(command);
      logger.info('Email sent via SES to ' + to);
      return;
    } catch (err) {
      logger.warn('SES failed, falling back to SMTP: ' + err.message);
    }
  }

  // SMTP fallback
  await smtpTransport.sendMail({ from, to, subject, html, text });
  logger.info('Email sent via SMTP to ' + to);
}

async function sendTemplateEmail(templateName, to, variables) {
  try {
    const template = await EmailTemplate.findOne({ where: { name: templateName } });
    if (!template) throw new Error('Template not found: ' + templateName);

    const subject = renderTemplate(template.subject, variables);
    const html    = renderTemplate(template.html_body, variables);

    await sendEmail({ to, subject, html });
  } catch (err) {
    logger.error('sendTemplateEmail error: ' + err.message);
    throw err;
  }
}

async function sendWelcome(user, verifyUrl) {
  return sendTemplateEmail('welcome', user.email, {
    firstName: user.first_name,
    verifyUrl,
  });
}

async function sendVerificationEmail(user, verifyUrl) {
  return sendTemplateEmail('email_verification', user.email, { verifyUrl });
}

async function sendPasswordResetEmail(user, resetUrl) {
  return sendTemplateEmail('password_reset', user.email, {
    firstName: user.first_name,
    resetUrl,
  });
}

async function sendNotificationEmail(user, title, message, actionUrl) {
  return sendTemplateEmail('notification', user.email, {
    title, message, actionUrl: actionUrl || process.env.FRONTEND_URL,
  });
}

module.exports = {
  sendEmail,
  sendTemplateEmail,
  sendWelcome,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendNotificationEmail,
};
