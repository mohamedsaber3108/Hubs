// ─── Shared ───────────────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface AuthUser {
  id: number;
  uuid: string;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  avatar_url: string | null;
  headline: string | null;
  bio: string | null;
  role: 'user' | 'moderator' | 'admin';
  status: 'active' | 'suspended' | 'banned';
  email_verified: boolean;
  onboarding_completed: boolean;
  points_total: number;
  followers_count: number;
  following_count: number;
  location: string | null;
  role_type: string | null;
  communities_joined: number;
  created_at: string;
}

export interface LoginResponse {
  access_token: string;
  user: AuthUser;
}

// ─── Community ────────────────────────────────────────────────────────────────
export interface Community {
  id: number;
  slug: string;
  name: string;
  emoji: string;
  tagline: string | null;
  description: string | null;
  members_count: number;
  accent_color: string | null;
  is_active: boolean;
  cover_image: string | null;
  joined?: boolean;
}

// ─── Post / Feed ─────────────────────────────────────────────────────────────
export interface Post {
  id: number;
  content: string;
  type: 'text' | 'image' | 'video' | 'poll' | 'link' | 'article';
  media_urls: string[];
  likes_count: number;
  comments_count: number;
  is_pinned: boolean;
  is_published: boolean;
  author: UserMinimal;
  community: CommunityMinimal | null;
  group_id: number | null;
  liked?: boolean;
  created_at: string;
}

export interface PostComment {
  id: number;
  content: string;
  author: UserMinimal;
  likes_count: number;
  parent_id: number | null;
  replies?: PostComment[];
  created_at: string;
}

// ─── User ─────────────────────────────────────────────────────────────────────
export interface UserMinimal {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  avatar_url: string | null;
  headline?: string | null;
}

export interface CommunityMinimal {
  id: number;
  slug: string;
  name: string;
  emoji: string;
}

export interface UserProfile extends AuthUser {
  skills: Skill[];
  experiences: Experience[];
  educations: Education[];
  following?: boolean;
}

export interface Skill { id: number; name: string; proficiency: string | null; }
export interface Experience { id: number; title: string; company: string; start_date: string; end_date: string | null; is_current: boolean; description: string | null; }
export interface Education { id: number; school: string; degree: string; field: string; start_year: number; end_year: number | null; }

// ─── Group ────────────────────────────────────────────────────────────────────
export interface Group {
  id: number;
  name: string;
  description: string | null;
  visibility: 'public' | 'private' | 'invite_only';
  members_count: number;
  cover_image: string | null;
  tags: string[];
  community: CommunityMinimal;
  creator: UserMinimal;
  membership?: 'approved' | 'pending' | null;
  created_at: string;
}

// ─── Event ────────────────────────────────────────────────────────────────────
export interface Event {
  id: number;
  title: string;
  description: string | null;
  type: 'online' | 'in_person' | 'hybrid';
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  start_date: string;
  end_date: string;
  timezone: string | null;
  location: string | null;
  meeting_url: string | null;
  cover_image: string | null;
  attendees_count: number;
  max_attendees: number | null;
  is_free: boolean;
  price: number | null;
  tags: string[];
  community: CommunityMinimal;
  organizer: UserMinimal;
  rsvp_status?: 'going' | 'maybe' | 'not_going' | null;
  created_at: string;
}

// ─── Challenge ────────────────────────────────────────────────────────────────
export interface Challenge {
  id: number;
  title: string;
  description: string | null;
  type: 'design' | 'code' | 'writing' | 'video' | 'other';
  status: 'draft' | 'open' | 'voting' | 'completed';
  start_date: string | null;
  end_date: string | null;
  cover_image: string | null;
  prizes: Array<{ place: string; reward: string }>;
  submissions_count: number;
  points_reward: number | null;
  requirements: string | null;
  tags: string[];
  community: CommunityMinimal;
  creator: UserMinimal;
  my_submission?: { id: number; status: string } | null;
  created_at: string;
}

export interface ChallengeSubmission {
  id: number;
  title: string;
  description: string;
  content_url: string | null;
  media_urls: string[];
  votes_count: number;
  status: 'pending' | 'approved' | 'rejected' | 'winner';
  rank: number | null;
  participant: UserMinimal;
  voted?: boolean;
  created_at: string;
}

// ─── Opportunity ──────────────────────────────────────────────────────────────
export interface Opportunity {
  id: number;
  title: string;
  type: 'job' | 'internship' | 'freelance' | 'volunteer' | 'scholarship' | 'fellowship' | 'grant' | 'competition';
  company: string | null;
  location: string | null;
  location_type: 'remote' | 'onsite' | 'hybrid';
  description: string;
  requirements: string | null;
  deadline: string | null;
  applications_count: number;
  views_count: number;
  status: 'open' | 'closed' | 'filled';
  is_featured: boolean;
  is_free: boolean;
  community: CommunityMinimal;
  poster: UserMinimal;
  applied?: boolean;
  saved?: boolean;
  application_status?: string | null;
  created_at: string;
}

// ─── Resource ─────────────────────────────────────────────────────────────────
export interface Resource {
  id: number;
  title: string;
  description: string | null;
  type: 'pdf' | 'doc' | 'video' | 'tool' | 'link' | 'course' | 'ebook' | 'template';
  file_url: string | null;
  external_url: string | null;
  thumbnail_url: string | null;
  is_free: boolean;
  avg_rating: number;
  ratings_count: number;
  downloads_count: number;
  tags: string[];
  community: CommunityMinimal;
  uploader: UserMinimal;
  my_rating?: number | null;
  created_at: string;
}

// ─── Leaderboard ──────────────────────────────────────────────────────────────
export interface LeaderboardEntry extends UserMinimal {
  points_total: number;
  period_points?: number;
  rank: number;
  headline?: string | null;
}

// ─── Mentor ───────────────────────────────────────────────────────────────────
export interface Mentor {
  id: number;
  expertise: string;
  bio: string | null;
  is_available: boolean;
  is_approved: boolean;
  rating: number;
  sessions_count: number;
  price_per_session: number | null;
  max_mentees: number | null;
  languages: string[];
  community: CommunityMinimal;
  user: UserMinimal & { headline?: string | null };
  my_request?: MentorRequest | null;
}

export interface MentorRequest {
  id: number;
  topic: string;
  message: string | null;
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
  session_type: 'video' | 'audio' | 'text';
  scheduled_time: string | null;
  meeting_url: string | null;
  mentor: Mentor;
  mentee: UserMinimal;
  created_at: string;
}

// ─── Messages ─────────────────────────────────────────────────────────────────
export interface Conversation {
  id: number;
  type: 'direct' | 'group';
  name: string | null;
  participants: ConversationParticipant[];
  last_message: ChatMessage | null;
  unread_count: number;
  last_message_at: string | null;
}

export interface ConversationParticipant {
  conversation_id: number;
  user_id: number;
  user: UserMinimal;
}

export interface ChatMessage {
  id: number;
  conversation_id: number;
  content: string | null;
  type: 'text' | 'image' | 'file' | 'system';
  is_read: boolean;
  is_deleted: boolean;
  media_url: string | null;
  sender: UserMinimal;
  created_at: string;
}

// ─── Search ───────────────────────────────────────────────────────────────────
export interface SearchResults {
  users?: UserMinimal[];
  posts?: Post[];
  events?: Event[];
  groups?: Group[];
  challenges?: Challenge[];
  opportunities?: Opportunity[];
  resources?: Resource[];
  mentors?: Mentor[];
  total_hits: number;
  query: string;
  type: string;
}

// ─── Notifications ────────────────────────────────────────────────────────────
export interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  action_url: string | null;
  is_read: boolean;
  created_at: string;
}
