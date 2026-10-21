'use strict';
const { Sequelize } = require('sequelize');
const config = require('../config/database');
const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, dbConfig);

// Import all models
const User              = require('./User')(sequelize);
const Admin             = require('./Admin')(sequelize);
const Session           = require('./Session')(sequelize);
const PasswordReset     = require('./PasswordReset')(sequelize);
const EmailVerification = require('./EmailVerification')(sequelize);
const OAuthAccount      = require('./OAuthAccount')(sequelize);
const Setting           = require('./Setting')(sequelize);
const FeatureFlag       = require('./FeatureFlag')(sequelize);
const ActivityLog       = require('./ActivityLog')(sequelize);
const Notification      = require('./Notification')(sequelize);
const Media             = require('./Media')(sequelize);
const EmailTemplate     = require('./EmailTemplate')(sequelize);
// Project-specific
const Community           = require('./Community')(sequelize);
const CommunityMembership = require('./CommunityMembership')(sequelize);
const Post                = require('./Post')(sequelize);
const PostLike            = require('./PostLike')(sequelize);
const PostComment         = require('./PostComment')(sequelize);
const Group               = require('./Group')(sequelize);
const GroupMember         = require('./GroupMember')(sequelize);
const Event               = require('./Event')(sequelize);
const EventAttendee       = require('./EventAttendee')(sequelize);
const Challenge           = require('./Challenge')(sequelize);
const ChallengeSubmission = require('./ChallengeSubmission')(sequelize);
const ChallengeVote       = require('./ChallengeVote')(sequelize);
const Opportunity         = require('./Opportunity')(sequelize);
const OpportunityApplication = require('./OpportunityApplication')(sequelize);
const SavedOpportunity    = require('./SavedOpportunity')(sequelize);
const Resource            = require('./Resource')(sequelize);
const ResourceRating      = require('./ResourceRating')(sequelize);
const Mentor              = require('./Mentor')(sequelize);
const MentorRequest       = require('./MentorRequest')(sequelize);
const LeaderboardPoint    = require('./LeaderboardPoint')(sequelize);
const PointTransaction    = require('./PointTransaction')(sequelize);
const Conversation        = require('./Conversation')(sequelize);
const ConversationParticipant = require('./ConversationParticipant')(sequelize);
const ChatMessage         = require('./ChatMessage')(sequelize);
const OnboardingResponse  = require('./OnboardingResponse')(sequelize);
const PricingPlan         = require('./PricingPlan')(sequelize);
const Subscription        = require('./Subscription')(sequelize);
const UserSkill           = require('./UserSkill')(sequelize);
const UserExperience      = require('./UserExperience')(sequelize);
const UserEducation       = require('./UserEducation')(sequelize);
const Follow              = require('./Follow')(sequelize);
// Organizations + Offers & Perks (Track B-8)
const Organization        = require('./Organization')(sequelize);
const OrganizationMember  = require('./OrganizationMember')(sequelize);
const Offer               = require('./Offer')(sequelize);
const PromoCode           = require('./PromoCode')(sequelize);
const OfferRedemption     = require('./OfferRedemption')(sequelize);

// ─── Associations ─────────────────────────────────────────────────────────────

// User ↔ Sessions
User.hasMany(Session, { foreignKey: 'user_id', as: 'sessions' });
Session.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// User ↔ PasswordReset
User.hasMany(PasswordReset, { foreignKey: 'email', sourceKey: 'email', as: 'passwordResets' });

// User ↔ EmailVerification
User.hasMany(EmailVerification, { foreignKey: 'user_id', as: 'emailVerifications' });
EmailVerification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// User ↔ OAuthAccounts
User.hasMany(OAuthAccount, { foreignKey: 'user_id', as: 'oauthAccounts' });
OAuthAccount.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// User ↔ Notifications
User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// User ↔ ActivityLog
User.hasMany(ActivityLog, { foreignKey: 'user_id', as: 'activityLogs' });
ActivityLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Admin ↔ ActivityLog (BUG-09: ActivityLog has a real admin_id column
// from its migration, but no association was ever defined for it,
// even though admin.logs.controller.js eager-loads
// `{ model: Admin, as: 'admin' }` -- that threw
// "Admin is not associated to ActivityLog!" on every GET /admin/logs
// call. Purely additive: no migration needed, admin_id already exists.)
Admin.hasMany(ActivityLog, { foreignKey: 'admin_id', as: 'activityLogs' });
ActivityLog.belongsTo(Admin, { foreignKey: 'admin_id', as: 'admin' });

// Community ↔ Members (through CommunityMembership)
Community.belongsToMany(User, { through: CommunityMembership, foreignKey: 'community_id', as: 'members' });
User.belongsToMany(Community, { through: CommunityMembership, foreignKey: 'user_id', as: 'communities' });
CommunityMembership.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
CommunityMembership.belongsTo(Community, { foreignKey: 'community_id', as: 'community' });

// Posts
Community.hasMany(Post, { foreignKey: 'community_id', as: 'posts' });
Post.belongsTo(Community, { foreignKey: 'community_id', as: 'community' });
User.hasMany(Post, { foreignKey: 'user_id', as: 'posts' });
Post.belongsTo(User, { foreignKey: 'user_id', as: 'author' });
Post.hasMany(PostLike, { foreignKey: 'post_id', as: 'likes' });
PostLike.belongsTo(Post, { foreignKey: 'post_id' });
PostLike.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Post.hasMany(PostComment, { foreignKey: 'post_id', as: 'comments' });
PostComment.belongsTo(Post, { foreignKey: 'post_id' });
PostComment.belongsTo(User, { foreignKey: 'user_id', as: 'author' });
PostComment.hasMany(PostComment, { foreignKey: 'parent_id', as: 'replies' });
PostComment.belongsTo(PostComment, { foreignKey: 'parent_id', as: 'parent' });

// Groups
Community.hasMany(Group, { foreignKey: 'community_id', as: 'groups' });
Group.belongsTo(Community, { foreignKey: 'community_id', as: 'community' });
User.hasMany(Group, { foreignKey: 'created_by', as: 'createdGroups' });
Group.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
Group.belongsToMany(User, { through: GroupMember, foreignKey: 'group_id', as: 'members' });
User.belongsToMany(Group, { through: GroupMember, foreignKey: 'user_id', as: 'groups' });

// Events
Community.hasMany(Event, { foreignKey: 'community_id', as: 'events' });
Event.belongsTo(Community, { foreignKey: 'community_id', as: 'community' });
User.hasMany(Event, { foreignKey: 'created_by', as: 'createdEvents' });
Event.belongsTo(User, { foreignKey: 'created_by', as: 'organizer' });
Event.hasMany(EventAttendee, { foreignKey: 'event_id', as: 'attendees' });
EventAttendee.belongsTo(Event, { foreignKey: 'event_id' });
EventAttendee.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Challenges
Community.hasMany(Challenge, { foreignKey: 'community_id', as: 'challenges' });
Challenge.belongsTo(Community, { foreignKey: 'community_id', as: 'community' });
User.hasMany(Challenge, { foreignKey: 'created_by', as: 'createdChallenges' });
Challenge.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
Challenge.hasMany(ChallengeSubmission, { foreignKey: 'challenge_id', as: 'submissions' });
ChallengeSubmission.belongsTo(Challenge, { foreignKey: 'challenge_id', as: 'challenge' });
ChallengeSubmission.belongsTo(User, { foreignKey: 'user_id', as: 'submitter' });
ChallengeSubmission.hasMany(ChallengeVote, { foreignKey: 'submission_id', as: 'votes' });
ChallengeVote.belongsTo(ChallengeSubmission, { foreignKey: 'submission_id' });
ChallengeVote.belongsTo(User, { foreignKey: 'user_id', as: 'voter' });

// Opportunities
Community.hasMany(Opportunity, { foreignKey: 'community_id', as: 'opportunities' });
Opportunity.belongsTo(Community, { foreignKey: 'community_id', as: 'community' });
User.hasMany(Opportunity, { foreignKey: 'posted_by', as: 'postedOpportunities' });
Opportunity.belongsTo(User, { foreignKey: 'posted_by', as: 'poster' });
Opportunity.hasMany(OpportunityApplication, { foreignKey: 'opportunity_id', as: 'applications' });
OpportunityApplication.belongsTo(Opportunity, { foreignKey: 'opportunity_id', as: 'opportunity' });
OpportunityApplication.belongsTo(User, { foreignKey: 'user_id', as: 'applicant' });

// Resources
Community.hasMany(Resource, { foreignKey: 'community_id', as: 'resources' });
Resource.belongsTo(Community, { foreignKey: 'community_id', as: 'community' });
User.hasMany(Resource, { foreignKey: 'uploaded_by', as: 'uploadedResources' });
Resource.belongsTo(User, { foreignKey: 'uploaded_by', as: 'uploader' });
Resource.hasMany(ResourceRating, { foreignKey: 'resource_id', as: 'ratings' });
ResourceRating.belongsTo(Resource, { foreignKey: 'resource_id' });
ResourceRating.belongsTo(User, { foreignKey: 'user_id', as: 'rater' });

// Mentors
Mentor.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasOne(Mentor, { foreignKey: 'user_id', as: 'mentorProfile' });
Mentor.hasMany(MentorRequest, { foreignKey: 'mentor_id', as: 'requests' });
MentorRequest.belongsTo(Mentor, { foreignKey: 'mentor_id', as: 'mentor' });
MentorRequest.belongsTo(User, { foreignKey: 'mentee_id', as: 'mentee' });

// Leaderboard
User.hasMany(LeaderboardPoint, { foreignKey: 'user_id', as: 'leaderboardPoints' });
LeaderboardPoint.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
LeaderboardPoint.belongsTo(Community, { foreignKey: 'community_id', as: 'community' });
User.hasMany(PointTransaction, { foreignKey: 'user_id', as: 'pointTransactions' });
PointTransaction.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Messaging
Conversation.hasMany(ConversationParticipant, { foreignKey: 'conversation_id', as: 'participants' });
ConversationParticipant.belongsTo(Conversation, { foreignKey: 'conversation_id', as: 'conversation' });
ConversationParticipant.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Conversation.hasMany(ChatMessage, { foreignKey: 'conversation_id', as: 'messages' });
ChatMessage.belongsTo(Conversation, { foreignKey: 'conversation_id', as: 'conversation' });
ChatMessage.belongsTo(User, { foreignKey: 'sender_id', as: 'sender' });

// Subscriptions
User.hasMany(Subscription, { foreignKey: 'user_id', as: 'subscriptions' });
Subscription.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Subscription.belongsTo(PricingPlan, { foreignKey: 'plan_id', as: 'plan' });
PricingPlan.hasMany(Subscription, { foreignKey: 'plan_id', as: 'subscriptions' });

// User Profile extensions
User.hasMany(UserSkill, { foreignKey: 'user_id', as: 'skills' });
UserSkill.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(UserExperience, { foreignKey: 'user_id', as: 'experiences' });
UserExperience.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(UserEducation, { foreignKey: 'user_id', as: 'education' });
UserEducation.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Follows
User.hasMany(Follow, { foreignKey: 'follower_id', as: 'following' });
User.hasMany(Follow, { foreignKey: 'following_id', as: 'followers' });
Follow.belongsTo(User, { foreignKey: 'follower_id', as: 'follower' });
Follow.belongsTo(User, { foreignKey: 'following_id', as: 'followed' });

// Onboarding
User.hasOne(OnboardingResponse, { foreignKey: 'user_id', as: 'onboarding' });
OnboardingResponse.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Organizations (ADR-006)
User.hasMany(Organization, { foreignKey: 'owner_id', as: 'ownedOrganizations' });
Organization.belongsTo(User, { foreignKey: 'owner_id', as: 'owner' });
Organization.belongsToMany(User, { through: OrganizationMember, foreignKey: 'organization_id', as: 'members' });
User.belongsToMany(Organization, { through: OrganizationMember, foreignKey: 'user_id', as: 'organizations' });
OrganizationMember.belongsTo(Organization, { foreignKey: 'organization_id', as: 'organization' });
OrganizationMember.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Offers & Perks
Organization.hasMany(Offer, { foreignKey: 'organization_id', as: 'offers' });
Offer.belongsTo(Organization, { foreignKey: 'organization_id', as: 'organization' });
User.hasMany(Offer, { foreignKey: 'created_by', as: 'createdOffers' });
Offer.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
Offer.hasMany(PromoCode, { foreignKey: 'offer_id', as: 'promoCodes' });
PromoCode.belongsTo(Offer, { foreignKey: 'offer_id', as: 'offer' });
Offer.hasMany(OfferRedemption, { foreignKey: 'offer_id', as: 'redemptions' });
OfferRedemption.belongsTo(Offer, { foreignKey: 'offer_id', as: 'offer' });
OfferRedemption.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
OfferRedemption.belongsTo(PromoCode, { foreignKey: 'promo_code_id', as: 'promoCode' });
User.hasMany(OfferRedemption, { foreignKey: 'user_id', as: 'offerRedemptions' });

module.exports = {
  sequelize,
  Sequelize,
  User, Admin, Session, PasswordReset, EmailVerification, OAuthAccount,
  Setting, FeatureFlag, ActivityLog, Notification, Media, EmailTemplate,
  Community, CommunityMembership,
  Post, PostLike, PostComment,
  Group, GroupMember,
  Event, EventAttendee,
  Challenge, ChallengeSubmission, ChallengeVote,
  Opportunity, OpportunityApplication, SavedOpportunity,
  Resource, ResourceRating,
  Mentor, MentorRequest,
  LeaderboardPoint, PointTransaction,
  Conversation, ConversationParticipant, ChatMessage,
  OnboardingResponse,
  PricingPlan, Subscription,
  UserSkill, UserExperience, UserEducation,
  Follow,
  Organization, OrganizationMember, Offer, PromoCode, OfferRedemption,
};
