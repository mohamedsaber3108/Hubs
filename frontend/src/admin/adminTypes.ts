export interface AdminUser {
  id: number; uuid: string; email: string;
  first_name: string; last_name: string;
  role: 'super_admin' | 'admin' | 'moderator';
  is_active: boolean; totp_enabled: boolean;
  created_at: string;
}

export interface DashboardStats {
  users: { total: number; active: number; new_7d: number; new_today: number; growth_pct: number };
  content: { posts: number; posts_7d: number; events: number; challenges: number; resources: number; opportunities: number };
  communities: { total: number; members_total: number };
  revenue: { total: number; mrr: number; subscriptions: number };
}

export interface ChartData { labels: string[]; datasets: Record<string, number[]>; }

export interface AdminUserRow {
  id: number; first_name: string; last_name: string; username: string;
  email: string; avatar_url: string | null; role: string; status: string;
  email_verified: boolean; points_total: number; communities_joined: number;
  created_at: string; last_login_at: string | null;
}

export interface AdminPost {
  id: number; content: string; type: string; likes_count: number;
  comments_count: number; reports_count: number; is_pinned: boolean;
  is_published: boolean; created_at: string;
  author: { id: number; first_name: string; last_name: string; username: string };
  community: { slug: string; name: string; emoji: string } | null;
}

export interface FeatureFlag {
  id: number; name: string; description: string | null;
  is_enabled: boolean; updated_at: string;
}

export interface Setting { id: number; key: string; value: string; type: string; description: string | null; }

export interface SystemHealth {
  status: string;
  database: { connected: boolean; responseMs: number };
  redis: { connected: boolean; responseMs: number; memoryUsage: string };
  queues: Record<string, { waiting: number; active: number; failed: number; paused: boolean }>;
  system: { uptime: number; platform: string; memUsed: string; memTotal: string; cpuUsage: number };
}

export interface ActivityLog {
  id: number; action: string; entity_type: string; entity_id: number | null;
  admin_email: string; ip_address: string; created_at: string;
  old_values: object | null; new_values: object | null;
}

export interface PaginatedAdmin<T> {
  success: boolean; data: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number; hasNext: boolean };
}
