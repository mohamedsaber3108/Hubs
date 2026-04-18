import api from '@/lib/api';
import type {
  LoginRequest, RegisterRequest, LoginResponse, User, UserProfile,
  Community, Post, PostComment, Group, Event, Challenge, ChallengeSubmission,
  Opportunity, OpportunityApplication, Resource, LeaderboardEntry,
  MyLeaderboardStats, Mentor, MentorRequest, Conversation, ChatMessage,
  SearchResults, Notification,
} from '@/lib/types';

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authService = {
  login:    (data: LoginRequest)    => api.post<{ data: LoginResponse }>('/auth/login', data),
  register: (data: RegisterRequest) => api.post<{ data: LoginResponse }>('/auth/register', data),
  logout:   ()                      => api.post('/auth/logout'),
  refresh:  ()                      => api.post<{ data: { access_token: string } }>('/auth/refresh-token'),
  forgotPassword: (email: string)   => api.post('/auth/forgot-password', { email }),
  resetPassword:  (token: string, password: string) => api.post('/auth/reset-password', { token, password }),
  resendVerification: ()            => api.post('/auth/resend-verification'),
  oauthUrl: (provider: string)      => `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'}/auth/${provider}`,
};

// ─── User / Me ────────────────────────────────────────────────────────────────
export const userService = {
  getMe:     () => api.get<{ data: { user: User } }>('/users/me'),
  updateMe:  (data: Partial<User>) => api.put<{ data: { user: User } }>('/users/me', data),
  deleteMe:  ()                    => api.delete('/users/me'),
  uploadAvatar: (file: File) => {
    const fd = new FormData(); fd.append('avatar', file);
    return api.post<{ data: { avatar_url: string } }>('/users/me/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  changePassword: (current_password: string, new_password: string) =>
    api.put('/users/me/password', { current_password, new_password }),
  getSessions:        ()       => api.get('/users/me/sessions'),
  revokeSession:      (id: number) => api.delete(`/users/me/sessions/${id}`),
  getNotifications:   (page = 1) => api.get<{ data: Notification[]; pagination: object }>(`/users/me/notifications?page=${page}`),
  markNotifRead:      (id: number) => api.patch(`/users/me/notifications/${id}/read`),
  markAllNotifsRead:  ()          => api.delete('/users/me/notifications'),
  follow:             (id: number) => api.post(`/users/${id}/follow`),
  unfollow:           (id: number) => api.delete(`/users/${id}/follow`),
  addSkill:           (data: object) => api.post('/users/me/skills', data),
  removeSkill:        (id: number)   => api.delete(`/users/me/skills/${id}`),
  addExperience:      (data: object) => api.post('/users/me/experiences', data),
  updateExperience:   (id: number, data: object) => api.put(`/users/me/experiences/${id}`, data),
  deleteExperience:   (id: number)               => api.delete(`/users/me/experiences/${id}`),
  addEducation:       (data: object) => api.post('/users/me/education', data),
  updateEducation:    (id: number, data: object) => api.put(`/users/me/education/${id}`, data),
  deleteEducation:    (id: number)               => api.delete(`/users/me/education/${id}`),
};

// ─── Profile (public) ─────────────────────────────────────────────────────────
export const profileService = {
  get: (username: string) => api.get<{ data: { user: UserProfile } }>(`/profile/${username}`),
};

// ─── Communities ──────────────────────────────────────────────────────────────
export const communityService = {
  list:    () => api.get<{ data: { communities: Community[] } }>('/communities'),
  get:     (slug: string) => api.get<{ data: { community: Community } }>(`/communities/${slug}`),
  join:    (slug: string) => api.post(`/communities/${slug}/join`),
  leave:   (slug: string) => api.delete(`/communities/${slug}/join`),
  members: (slug: string, page = 1) => api.get(`/communities/${slug}/members?page=${page}`),
};

// ─── Posts / Feed ─────────────────────────────────────────────────────────────
export const postService = {
  feed: (params: {
    community?: string; type?: string; page?: number; limit?: number;
    sort?: string; group_id?: number;
  }) => api.get<{ data: Post[]; pagination: object }>('/posts', { params }),
  get:  (id: number) => api.get<{ data: { post: Post; comments: PostComment[] } }>(`/posts/${id}`),
  create: (data: FormData) =>
    api.post<{ data: { post: Post } }>('/posts', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id: number, data: Partial<Post>) => api.put(`/posts/${id}`, data),
  delete: (id: number) => api.delete(`/posts/${id}`),
  like:   (id: number) => api.post<{ data: { liked: boolean; likes_count: number } }>(`/posts/${id}/like`),
  addComment:    (id: number, content: string, parent_id?: number) =>
    api.post<{ data: { comment: PostComment } }>(`/posts/${id}/comments`, { content, parent_id }),
  deleteComment: (postId: number, commentId: number) => api.delete(`/posts/${postId}/comments/${commentId}`),
};

// ─── Groups ───────────────────────────────────────────────────────────────────
export const groupService = {
  list:   (params: { community?: string; search?: string; type?: string; page?: number }) =>
    api.get<{ data: Group[]; pagination: object }>('/groups', { params }),
  get:    (id: number) => api.get<{ data: { group: Group; membership: object | null } }>(`/groups/${id}`),
  create: (data: FormData) =>
    api.post<{ data: { group: Group } }>('/groups', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id: number, data: FormData) =>
    api.put<{ data: { group: Group } }>(`/groups/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id: number) => api.delete(`/groups/${id}`),
  join:   (id: number) => api.post<{ data: { status: string } }>(`/groups/${id}/join`),
  leave:  (id: number) => api.delete(`/groups/${id}/join`),
  members: (id: number, page = 1) => api.get(`/groups/${id}/members?page=${page}`),
  updateMember: (groupId: number, userId: number, data: object) =>
    api.patch(`/groups/${groupId}/members/${userId}`, data),
  removeMember: (groupId: number, userId: number) => api.delete(`/groups/${groupId}/members/${userId}`),
  posts: (id: number, page = 1) => api.get(`/groups/${id}/posts?page=${page}`),
};

// ─── Events ───────────────────────────────────────────────────────────────────
export const eventService = {
  list:   (params: { community?: string; type?: string; status?: string; upcoming?: boolean; page?: number }) =>
    api.get<{ data: Event[]; pagination: object }>('/events', { params }),
  get:    (id: number) => api.get<{ data: { event: Event; rsvp: object | null } }>(`/events/${id}`),
  create: (data: FormData) =>
    api.post<{ data: { event: Event } }>('/events', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id: number, data: Partial<Event>) => api.put(`/events/${id}`, data),
  delete: (id: number) => api.delete(`/events/${id}`),
  rsvp:   (id: number, status: 'going' | 'maybe' | 'not_going') =>
    api.post<{ data: { status: string } }>(`/events/${id}/rsvp`, { status }),
  attendees: (id: number, status?: string) => api.get(`/events/${id}/attendees`, { params: { status } }),
};

// ─── Challenges ───────────────────────────────────────────────────────────────
export const challengeService = {
  list:   (params: { community?: string; type?: string; status?: string; page?: number }) =>
    api.get<{ data: Challenge[]; pagination: object }>('/challenges', { params }),
  get:    (id: number) =>
    api.get<{ data: { challenge: Challenge; my_submission: ChallengeSubmission | null } }>(`/challenges/${id}`),
  create: (data: FormData) =>
    api.post<{ data: { challenge: Challenge } }>('/challenges', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id: number, data: Partial<Challenge>) => api.put(`/challenges/${id}`, data),
  submit: (id: number, data: FormData) =>
    api.post<{ data: { submission: ChallengeSubmission } }>(`/challenges/${id}/submit`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  submissions: (id: number, page = 1) =>
    api.get<{ data: ChallengeSubmission[]; pagination: object }>(`/challenges/${id}/submissions?page=${page}`),
  vote: (submissionId: number) =>
    api.post<{ data: { voted: boolean } }>(`/challenges/submissions/${submissionId}/vote`),
  announceWinners: (id: number, winners: { submission_id: number; rank: number }[]) =>
    api.post(`/challenges/${id}/winners`, { winners }),
};

// ─── Opportunities ────────────────────────────────────────────────────────────
export const opportunityService = {
  list:   (params: { community?: string; type?: string; location_type?: string; search?: string; saved?: boolean; page?: number }) =>
    api.get<{ data: Opportunity[]; pagination: object }>('/opportunities', { params }),
  get:    (id: number) =>
    api.get<{ data: { opportunity: Opportunity; applied: boolean; saved: boolean; application: object | null } }>(`/opportunities/${id}`),
  create: (data: object)            => api.post<{ data: { opportunity: Opportunity } }>('/opportunities', data),
  update: (id: number, data: object) => api.put(`/opportunities/${id}`, data),
  delete: (id: number)               => api.delete(`/opportunities/${id}`),
  apply:  (id: number, data: FormData) =>
    api.post<{ data: { application: OpportunityApplication } }>(`/opportunities/${id}/apply`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  applications: (id: number, page = 1) =>
    api.get<{ data: OpportunityApplication[]; pagination: object }>(`/opportunities/${id}/applications?page=${page}`),
  updateApplication: (id: number, appId: number, status: string, notes?: string) =>
    api.patch(`/opportunities/${id}/applications/${appId}`, { status, notes }),
  save: (id: number) => api.post<{ data: { saved: boolean } }>(`/opportunities/${id}/save`),
};

// ─── Resources ────────────────────────────────────────────────────────────────
export const resourceService = {
  list:     (params: { community?: string; type?: string; search?: string; is_free?: boolean; page?: number }) =>
    api.get<{ data: Resource[]; pagination: object }>('/resources', { params }),
  get:      (id: number) => api.get<{ data: { resource: Resource; my_rating: number | null } }>(`/resources/${id}`),
  create:   (data: FormData) =>
    api.post<{ data: { resource: Resource } }>('/resources', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update:   (id: number, data: Partial<Resource>) => api.put(`/resources/${id}`, data),
  delete:   (id: number) => api.delete(`/resources/${id}`),
  download: (id: number) => api.post<{ data: { url: string } }>(`/resources/${id}/download`),
  rate:     (id: number, rating: number, review?: string) =>
    api.post(`/resources/${id}/rate`, { rating, review }),
};

// ─── Leaderboard ──────────────────────────────────────────────────────────────
export const leaderboardService = {
  list:    (params: { period?: string; community?: string; page?: number }) =>
    api.get<{ data: LeaderboardEntry[]; pagination: object }>('/leaderboard', { params }),
  myStats: (period?: string) =>
    api.get<{ data: MyLeaderboardStats }>(`/leaderboard/me${period ? `?period=${period}` : ''}`),
  history: (page = 1) => api.get(`/leaderboard/history?page=${page}`),
};

// ─── Mentors ──────────────────────────────────────────────────────────────────
export const mentorService = {
  list:    (params: { community?: string; expertise?: string; available?: boolean; page?: number }) =>
    api.get<{ data: Mentor[]; pagination: object }>('/mentors', { params }),
  get:     (id: number) => api.get<{ data: { mentor: Mentor; my_request: MentorRequest | null } }>(`/mentors/${id}`),
  become:  (data: object) => api.post<{ data: { mentor: Mentor } }>('/mentors', data),
  updateProfile: (data: FormData) =>
    api.put<{ data: { mentor: Mentor } }>('/mentors/me', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  request:  (id: number, data: { topic: string; message?: string; session_type?: string; preferred_time?: string }) =>
    api.post<{ data: { session: MentorRequest } }>(`/mentors/${id}/request`, data),
  myRequests: (type?: 'incoming' | 'outgoing' | 'all', page = 1) =>
    api.get<{ data: MentorRequest[]; pagination: object }>(`/mentors/requests?type=${type || 'all'}&page=${page}`),
  updateRequest: (id: number, data: object) =>
    api.patch<{ data: { request: MentorRequest } }>(`/mentors/requests/${id}`, data),
};

// ─── Messages ─────────────────────────────────────────────────────────────────
export const messageService = {
  conversations: (page = 1) =>
    api.get<{ data: Conversation[]; pagination: object }>(`/messages?page=${page}`),
  messages: (conversationId: number, page = 1) =>
    api.get<{ data: ChatMessage[]; pagination: object }>(`/messages/${conversationId}?page=${page}`),
  start:  (user_id: number, message: string) =>
    api.post<{ data: { conversation_id: number; message: ChatMessage } }>('/messages', { user_id, message }),
  send:   (conversationId: number, content: string, type = 'text') =>
    api.post<{ data: { message: ChatMessage } }>(`/messages/${conversationId}`, { content, type }),
  delete: (conversationId: number, messageId: number) =>
    api.delete(`/messages/${conversationId}/messages/${messageId}`),
  participants: (conversationId: number) =>
    api.get(`/messages/${conversationId}/participants`),
};

// ─── Search ───────────────────────────────────────────────────────────────────
export const searchService = {
  global: (q: string, type = 'all', limit = 5) =>
    api.get<{ data: SearchResults }>('/search', { params: { q, type, limit } }),
  community: (q: string, community?: string) =>
    api.get('/search/community', { params: { q, community } }),
};

// ─── Onboarding ───────────────────────────────────────────────────────────────
export const onboardingService = {
  status: () => api.get<{ data: { completed: boolean; response: object | null } }>('/onboarding'),
  submit: (data: {
    communities: string[];
    role?: string;
    goals?: string[];
    skills?: string[];
    experience_level?: string;
    headline?: string;
    bio?: string;
    location?: string;
  }) => api.post<{ data: { completed: boolean; joined_communities: string[] } }>('/onboarding', data),
};

// ─── NomadAI ──────────────────────────────────────────────────────────────────
export const nomadService = {
  chat: (message: string, history: { role: string; content: string }[], community?: string) =>
    api.post<{ data: { reply: string } }>('/nomad/chat', { message, history, community }),
};
