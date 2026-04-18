import { useQuery } from '@tanstack/react-query';
import { Users, FileText, TrendingUp, DollarSign, Activity, ArrowUpRight, ArrowDownRight, Loader2 } from 'lucide-react';
import { adminDashboardService } from '../services/adminDashboard.service';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

function StatCard({ label, value, change, icon: Icon, color }: any) {
  const isPos = String(change).startsWith('+');
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        {change !== undefined && (
          <span className={`flex items-center gap-0.5 text-xs font-medium ${isPos ? 'text-green-500' : 'text-destructive'}`}>
            {isPos ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {change}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-foreground">{typeof value === 'number' ? value.toLocaleString() : value}</p>
      <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString('en', { month: 'short', day: 'numeric' });
}

export default function OverviewPanel() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: adminDashboardService.getStats,
    refetchInterval: 60_000,
  });

  const { data: charts, isLoading: chartsLoading } = useQuery({
    queryKey: ['admin', 'charts'],
    queryFn: () => adminDashboardService.getCharts('30d'),
    staleTime: 5 * 60_000,
  });

  const { data: activity } = useQuery({
    queryKey: ['admin', 'activity'],
    queryFn: () => adminDashboardService.getActivity(8),
    refetchInterval: 30_000,
  });

  if (statsLoading) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="w-8 h-8 animate-spin text-primary-glow" />
    </div>
  );

  // Build chart data from backend labels + datasets
  const chartData = charts?.labels?.map((label: string, i: number) => ({
    date: label,
    users:   charts.datasets?.new_users?.[i]    ?? 0,
    posts:   charts.datasets?.new_posts?.[i]    ?? 0,
    revenue: charts.datasets?.revenue?.[i]      ?? 0,
  })) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Platform Overview</h1>
        <p className="text-sm text-muted-foreground">Real-time stats and trends</p>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={stats?.users?.total ?? '—'} change={stats?.users?.growth_pct != null ? `+${stats.users.growth_pct}%` : undefined} icon={Users} color="bg-primary-glow/10 text-primary-glow" />
        <StatCard label="New (7 days)" value={stats?.users?.new_7d ?? '—'} icon={TrendingUp} color="bg-green-500/10 text-green-500" />
        <StatCard label="Total Posts" value={stats?.content?.posts ?? '—'} icon={FileText} color="bg-blue-500/10 text-blue-500" />
        <StatCard label="MRR" value={stats?.revenue?.mrr != null ? `$${stats.revenue.mrr.toLocaleString()}` : '—'} icon={DollarSign} color="bg-amber-500/10 text-amber-500" />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Active Today',   val: stats?.users?.active },
          { label: 'Events',         val: stats?.content?.events },
          { label: 'Challenges',     val: stats?.content?.challenges },
          { label: 'Subscriptions',  val: stats?.revenue?.subscriptions },
        ].map(({ label, val }) => (
          <div key={label} className="bg-secondary rounded-xl px-4 py-3 text-center">
            <p className="text-xl font-bold text-foreground">{val?.toLocaleString() ?? '—'}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      {!chartsLoading && chartData.length > 0 && (
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-semibold text-foreground text-sm mb-4">New Users — 30 days</h3>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="hsl(172 68% 27%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(172 68% 27%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={formatDate} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: 12 }} />
                <Area type="monotone" dataKey="users" stroke="hsl(172 68% 27%)" fill="url(#userGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-semibold text-foreground text-sm mb-4">Posts Created — 30 days</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={formatDate} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: 12 }} />
                <Bar dataKey="posts" fill="hsl(172 68% 27%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Recent activity */}
      {activity && activity.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-foreground text-sm mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary-glow" /> Recent Admin Activity
          </h3>
          <div className="space-y-2">
            {activity.map((act: any) => (
              <div key={act.id} className="flex items-center gap-3 text-sm py-2 border-b border-border last:border-0">
                <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-foreground flex-shrink-0">
                  {act.admin_email?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-foreground font-medium">{act.admin_email}</span>
                  <span className="text-muted-foreground"> · {act.action} {act.entity_type}</span>
                </div>
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  {new Date(act.created_at).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
