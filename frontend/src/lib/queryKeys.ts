export const queryKeys = {
  // Auth
  me: ['me'] as const,

  // Communities
  communities: () => ['communities'] as const,
  community: (slug: string) => ['communities', slug] as const,
  recommendedCommunities: () => ['communities', 'recommended'] as const,

  // Posts / Feed
  feed: (params?: object) => ['feed', params] as const,
  post: (id: number) => ['post', id] as const,
  postComments: (id: number) => ['post', id, 'comments'] as const,

  // Groups
  groups: (params?: object) => ['groups', params] as const,
  group: (id: number) => ['groups', id] as const,
  groupMembers: (id: number, status?: string) => ['groups', id, 'members', status] as const,
  groupPosts: (id: number) => ['groups', id, 'posts'] as const,

  // Events
  events: (params?: object) => ['events', params] as const,
  event: (id: number) => ['events', id] as const,
  eventAttendees: (id: number) => ['events', id, 'attendees'] as const,

  // Challenges
  challenges: (params?: object) => ['challenges', params] as const,
  challenge: (id: number) => ['challenges', id] as const,
  challengeSubmissions: (id: number) => ['challenges', id, 'submissions'] as const,

  // Opportunities
  opportunities: (params?: object) => ['opportunities', params] as const,
  opportunity: (id: number) => ['opportunities', id] as const,
  opportunityApplications: (id: number) => ['opportunities', id, 'applications'] as const,

  // Resources
  resources: (params?: object) => ['resources', params] as const,
  resource: (id: number) => ['resources', id] as const,

  // Leaderboard
  leaderboard: (params?: object) => ['leaderboard', params] as const,
  myLeaderboardStats: (period?: string) => ['leaderboard', 'me', period] as const,
  pointHistory: (page?: number) => ['leaderboard', 'history', page] as const,

  // Mentors
  mentors: (params?: object) => ['mentors', params] as const,
  mentor: (id: number) => ['mentors', id] as const,
  mentorRequests: (type?: string) => ['mentors', 'requests', type] as const,

  // Messages
  conversations: () => ['conversations'] as const,
  messages: (conversationId: number) => ['messages', conversationId] as const,

  // Search
  search: (query: string, type?: string) => ['search', query, type] as const,

  // Notifications
  notifications: () => ['notifications'] as const,

  // Onboarding
  onboardingStatus: () => ['onboarding'] as const,

  // Profile
  profile: (username: string) => ['profile', username] as const,
};
