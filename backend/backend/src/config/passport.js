'use strict';
const passport = require('passport');
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const GoogleStrategy  = require('passport-google-oauth20').Strategy;
const GitHubStrategy  = require('passport-github2').Strategy;
const FacebookStrategy= require('passport-facebook').Strategy;
const LinkedInStrategy= require('passport-linkedin-oauth2').Strategy;
const { User, OAuthAccount } = require('../models');
const logger = require('../utils/logger');

// ─── JWT Strategy ─────────────────────────────────────────────────────────────
passport.use('jwt', new JwtStrategy({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_ACCESS_SECRET,
  ignoreExpiration: false,
}, async (payload, done) => {
  try {
    const user = await User.findOne({
      where: { id: payload.sub, is_deleted: false, status: 'active' },
    });
    if (!user) return done(null, false);
    return done(null, user);
  } catch (err) {
    return done(err, false);
  }
}));

// ─── OAuth helper: find or create user ────────────────────────────────────────
async function findOrCreateOAuthUser(profile, provider, accessToken, refreshToken) {
  const email = profile.emails?.[0]?.value;
  if (!email) throw new Error('OAuth profile missing email');

  // Check existing OAuth link
  const existing = await OAuthAccount.findOne({
    where: { provider, provider_id: profile.id },
    include: [{ model: User, as: 'user' }],
  });
  if (existing) {
    await existing.update({ access_token: accessToken, refresh_token: refreshToken });
    return existing.user;
  }

  // Check existing user by email
  let user = await User.findOne({ where: { email, is_deleted: false } });
  if (!user) {
    const nameParts = (profile.displayName || '').split(' ');
    user = await User.create({
      first_name:     nameParts[0] || 'User',
      last_name:      nameParts.slice(1).join(' ') || '',
      username:       `${provider}_${profile.id}`.toLowerCase().substring(0, 50),
      email,
      avatar_url:     profile.photos?.[0]?.value || null,
      email_verified: true,
      provider,
      provider_id:    profile.id,
    });
  }

  await OAuthAccount.create({
    user_id:       user.id,
    provider,
    provider_id:   profile.id,
    access_token:  accessToken,
    refresh_token: refreshToken,
  });

  return user;
}

// ─── Google ───────────────────────────────────────────────────────────────────
if (process.env.GOOGLE_CLIENT_ID) {
  passport.use('google', new GoogleStrategy({
    clientID:     process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:  process.env.GOOGLE_CALLBACK_URL,
    scope: ['profile', 'email'],
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const user = await findOrCreateOAuthUser(profile, 'google', accessToken, refreshToken);
      done(null, user);
    } catch (err) {
      logger.error('Google OAuth error:', err);
      done(err, null);
    }
  }));
}

// ─── GitHub ───────────────────────────────────────────────────────────────────
if (process.env.GITHUB_CLIENT_ID) {
  passport.use('github', new GitHubStrategy({
    clientID:     process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL:  process.env.GITHUB_CALLBACK_URL,
    scope: ['user:email'],
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const user = await findOrCreateOAuthUser(profile, 'github', accessToken, refreshToken);
      done(null, user);
    } catch (err) {
      logger.error('GitHub OAuth error:', err);
      done(err, null);
    }
  }));
}

// ─── Facebook ─────────────────────────────────────────────────────────────────
if (process.env.FACEBOOK_APP_ID) {
  passport.use('facebook', new FacebookStrategy({
    clientID:     process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL:  process.env.FACEBOOK_CALLBACK_URL,
    profileFields: ['id', 'displayName', 'photos', 'email'],
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const user = await findOrCreateOAuthUser(profile, 'facebook', accessToken, refreshToken);
      done(null, user);
    } catch (err) {
      logger.error('Facebook OAuth error:', err);
      done(err, null);
    }
  }));
}

// ─── LinkedIn ─────────────────────────────────────────────────────────────────
if (process.env.LINKEDIN_CLIENT_ID) {
  passport.use('linkedin', new LinkedInStrategy({
    clientID:     process.env.LINKEDIN_CLIENT_ID,
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
    callbackURL:  process.env.LINKEDIN_CALLBACK_URL,
    scope: ['r_emailaddress', 'r_liteprofile'],
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const user = await findOrCreateOAuthUser(profile, 'linkedin', accessToken, refreshToken);
      done(null, user);
    } catch (err) {
      logger.error('LinkedIn OAuth error:', err);
      done(err, null);
    }
  }));
}

module.exports = passport;
