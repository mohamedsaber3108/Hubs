import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, TrendingUp, Users, FileText, Heart, DollarSign } from 'lucide-react';
import { adminAnalyticsService } from '../services/adminAnalytics.service';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const PERIODS = [{ key: '7d', label: '7 days' }, { key: '30d', label: '30 days' }, { key: '90d', label: '90 days' }];
const CHART_COLORS = ['hsl(172 68% 27%)', 'hsl(24 100% 63%)', 'hsl(136 66% 47%)', 'hsl(280 80% 60%)', 'hsl(45 100% 60%)'];

function formatDate(s: string) { return new Date(s).toLocaleDateString('en', { month: 'short', day: 'numeric' }); }

function Section({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="font-semibold text-foreground text-sm mb-4 flex items-center gap-2">
        <Icon className="w-4 h-4 text-primary-glow" />{title}
      </h3>
      {children}
    </div>
  );
}

export default function AnalyticsPanel() {
  const [period, setPeriod] = useState('30d');

  const { data: userAnalytics, isLoading: ul } = useQuery({
    queryKey: ['admin', 'analytics', 'users', period],
    queryFn: () => adminAnalyticsService.users({ period }),
    staleTime: 5 * 60_000,
  });
  const { data: contentAnalytics, isLoading: cl } = useQuery({
    queryKey: ['admin', 'analytics', 'content', period],
    queryFn: () => adminAnalyticsService.content({ period }),
    staleTime: 5 * 60_000,
  });
  const { data: communityAnalytics } = useQuery({
    queryKey: ['admin', 'analytics', 'communities'],
    queryFn: () => adminAnalyticsService.communities(),
    staleTime: 5 * 60_000,
  });
  const { data: revenueAnalytics } = useQuery({
    queryKey: ['admin', 'analytics', 'revenue', period],
    queryFn: () => adminAnalyticsService.revenue({ period }),
    staleTime: 5 * 60_000,
  });

  const isLoading = ul || cl;

  // Build timeseries from backend format
  const userTs = userAnalytics?.timeseries?.map((d: any) => ({ date: d.date, users: d.count })) ?? [];
  const contentTs = contentAnalytics?.timeseries?.map((d: any) => ({ date: d.date, posts: d.posts ?? d.count })) ?? [];
  const communityBreakdown = communityAnalytics?.by_community ?? [];
  const revenueTs = revenueAnalytics?.timeseries?.map((d: any) => ({ date: d.date, revenue: d.revenue ?? 0 })) ?? [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Analytics</h1>
          <p className="text-sm text-muted-foreground">Platform performance insights</p>
        </div>
        <div className="flex gap-2">
          {PERIODS.map((p) => (
            <button key={p.key} onClick={() => setPeriod(p.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${period === p.key ? 'bg-primary-glow text-primary-foreground' : 'bg-card border border-border text-muted-foreground hover:text-foreground'}`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary-glow" /></div>
      ) : (
        <div className="grid gap-5">
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'New Users',    val: userAnalytics?.total_new,      icon: Users,     color: 'text-primary-glow' },
              { label: 'Posts',        val: contentAnalytics?.total_posts,  icon: FileText,  color: 'text-blue-500' },
              { label: 'Engagement',   val: contentAnalytics?.total_likes,  icon: Heart,     color: 'text-pink-500' },
              { label: 'Revenue',      val: revenueAnalytics?.total != null ? `$${Number(revenueAnalytics.total).toLocaleString()}` : '—', icon: DollarSign, color: 'text-amber-500' },
            ].map(({ label, val, icon: Icon, color }) => (
              <div key={label} className="bg-card border border-border rounded-xl p-4 text-center">
                <Icon className={`w-6 h-6 mx-auto mb-2 ${color}`} />
                <p className="text-2xl font-bold text-foreground">{val?.toLocaleString?.() ?? val ?? '—'}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-5">
            {/* User growth */}
            {userTs.length > 0 && (
              <Section title="User Registrations" icon={TrendingUp}>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={userTs}>
                    <defs><linearGradient id="uGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={CHART_COLORS[0]} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={CHART_COLORS[0]} stopOpacity={0} />
                    </linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={formatDate} />
                    <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: 11 }} />
                    <Area type="monotone" dataKey="users" stroke={CHART_COLORS[0]} fill="url(#uGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </Section>
            )}

            {/* Content creation */}
            {contentTs.length > 0 && (
              <Section title="Content Created" icon={FileText}>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={contentTs}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={formatDate} />
                    <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: 11 }} />
                    <Bar dataKey="posts" fill={CHART_COLORS[1]} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Section>
            )}

            {/* Community breakdown */}
            {communityBreakdown.length > 0 && (
              <Section title="Members by Community" icon={Users}>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={communityBreakdown} dataKey="members_count" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {communityBreakdown.map((_: any, i: number) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </Section>
            )}

            {/* Revenue */}
            {revenueTs.length > 0 && (
              <Section title="Revenue" icon={DollarSign}>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={revenueTs}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={formatDate} />
                    <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: 11 }} formatter={(v) => [`$${Number(v).toLocaleString()}`, 'Revenue']} />
                    <Line type="monotone" dataKey="revenue" stroke={CHART_COLORS[3]} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </Section>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
