import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Calendar, Zap, BookOpen, Users, Loader2, Trash2, Pin, PinOff, ChevronLeft, ChevronRight, Search, ToggleLeft, ToggleRight } from 'lucide-react';
import { adminContentService } from '../services/adminContent.service';
import { toast } from 'sonner';

const CONTENT_TABS = [
  { id: 'posts',       label: 'Posts',       icon: FileText },
  { id: 'events',      label: 'Events',      icon: Calendar },
  { id: 'challenges',  label: 'Challenges',  icon: Zap },
  { id: 'resources',   label: 'Resources',   icon: BookOpen },
  { id: 'communities', label: 'Communities', icon: Users },
];

function PostsTab() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'content', 'posts', { page, search }],
    queryFn: () => adminContentService.listPosts({ page, limit: 20, search: search || undefined }),
    staleTime: 30_000,
  });
  const { mutate: deletePost } = useMutation({
    mutationFn: adminContentService.deletePost,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'content', 'posts'] }); toast.success('Post deleted'); },
  });
  const { mutate: pinPost } = useMutation({
    mutationFn: ({ id, pin }: { id: number; pin: boolean }) => adminContentService.pinPost(id, pin),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'content', 'posts'] }); toast.success('Updated'); },
  });

  const posts = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search posts…"
          className="w-full pl-9 pr-3 py-2 text-sm bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-glow/30" />
      </div>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {isLoading ? <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary-glow" /></div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="text-start px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Author</th>
                  <th className="text-start px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Content</th>
                  <th className="text-start px-4 py-3 text-xs font-semibold text-muted-foreground uppercase hidden md:table-cell">Type</th>
                  <th className="text-start px-4 py-3 text-xs font-semibold text-muted-foreground uppercase hidden lg:table-cell">Likes</th>
                  <th className="text-start px-4 py-3 text-xs font-semibold text-muted-foreground uppercase hidden lg:table-cell">Date</th>
                  <th className="px-4 py-3 w-24"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {posts.map((p: any) => (
                  <tr key={p.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">
                      {p.author?.first_name} {p.author?.last_name}
                      <p className="text-xs text-muted-foreground">@{p.author?.username}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground max-w-xs">
                      <p className="truncate">{p.content}</p>
                      {p.is_pinned && <span className="text-xs text-amber-500">📌 Pinned</span>}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground capitalize">{p.type}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{p.likes_count}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell whitespace-nowrap">{new Date(p.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => pinPost({ id: p.id, pin: !p.is_pinned })} title={p.is_pinned ? 'Unpin' : 'Pin'}
                          className="w-7 h-7 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-amber-500 transition-colors">
                          {p.is_pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={() => { if (confirm('Delete this post?')) deletePost(p.id); }}
                          className="w-7 h-7 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {posts.length === 0 && <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">No posts</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <button onClick={() => setPage(page - 1)} disabled={page <= 1} className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground disabled:opacity-40">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-muted-foreground">Page {page} of {pagination.totalPages}</span>
          <button onClick={() => setPage(page + 1)} disabled={!pagination.hasNext} className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground disabled:opacity-40">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function CommunitiesTab() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'content', 'communities'],
    queryFn: adminContentService.listCommunities,
  });
  const { mutate: toggle } = useMutation({
    mutationFn: adminContentService.toggleCommunity,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'content', 'communities'] }); toast.success('Updated'); },
  });
  const communities = data?.data?.communities ?? data?.data ?? [];

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {isLoading ? <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary-glow" /></div> : (
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border bg-secondary/50">
            <th className="text-start px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Community</th>
            <th className="text-start px-4 py-3 text-xs font-semibold text-muted-foreground uppercase hidden md:table-cell">Members</th>
            <th className="text-start px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Status</th>
            <th className="px-4 py-3 w-16"></th>
          </tr></thead>
          <tbody className="divide-y divide-border">
            {communities.map((c: any) => (
              <tr key={c.id} className="hover:bg-secondary/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{c.emoji}</span>
                    <div>
                      <p className="font-medium text-foreground">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{c.members_count?.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.is_active ? 'bg-green-500/10 text-green-500' : 'bg-secondary text-muted-foreground'}`}>
                    {c.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => toggle(c.id)} className="text-muted-foreground hover:text-primary-glow transition-colors">
                    {c.is_active ? <ToggleRight className="w-5 h-5 text-primary-glow" /> : <ToggleLeft className="w-5 h-5" />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function SimpleListTab({ fetchFn, qKey, columns }: { fetchFn: (p?: any) => Promise<any>; qKey: string; columns: Array<{ key: string; label: string; render?: (row: any) => React.ReactNode }> }) {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({ queryKey: ['admin', 'content', qKey, page], queryFn: () => fetchFn({ page, limit: 20 }) });
  const rows = data?.data ?? [];
  const pagination = data?.pagination;
  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {isLoading ? <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary-glow" /></div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-secondary/50">
                {columns.map((c) => <th key={c.key} className="text-start px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">{c.label}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-border">
                {rows.map((row: any, i: number) => (
                  <tr key={row.id ?? i} className="hover:bg-secondary/30 transition-colors">
                    {columns.map((c) => <td key={c.key} className="px-4 py-3 text-muted-foreground">{c.render ? c.render(row) : String(row[c.key] ?? '—')}</td>)}
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={columns.length} className="text-center py-12 text-muted-foreground">No data</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {pagination?.totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <button onClick={() => setPage(page - 1)} disabled={page <= 1} className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
          <span className="text-sm text-muted-foreground">Page {page} of {pagination.totalPages}</span>
          <button onClick={() => setPage(page + 1)} disabled={!pagination.hasNext} className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
        </div>
      )}
    </div>
  );
}

export default function ContentPanel() {
  const [tab, setTab] = useState('posts');

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-foreground">Content Moderation</h1>
        <p className="text-sm text-muted-foreground">Manage all user-generated content</p>
      </div>
      <div className="flex gap-2 flex-wrap">
        {CONTENT_TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${tab === id ? 'bg-primary-glow text-primary-foreground' : 'bg-card border border-border text-muted-foreground hover:text-foreground'}`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {tab === 'posts' && <PostsTab />}
      {tab === 'events' && (
        <SimpleListTab fetchFn={adminContentService.listEvents} qKey="events" columns={[
          { key: 'title', label: 'Title', render: (r) => <span className="font-medium text-foreground">{r.title}</span> },
          { key: 'type', label: 'Type', render: (r) => <span className="text-xs capitalize px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{r.type}</span> },
          { key: 'status', label: 'Status', render: (r) => <span className={`text-xs capitalize px-2 py-0.5 rounded-full ${r.status === 'published' ? 'bg-green-500/10 text-green-500' : 'bg-secondary text-muted-foreground'}`}>{r.status}</span> },
          { key: 'start_date', label: 'Date', render: (r) => new Date(r.start_date).toLocaleDateString() },
          { key: 'attendees_count', label: 'Attendees' },
        ]} />
      )}
      {tab === 'challenges' && (
        <SimpleListTab fetchFn={adminContentService.listChallenges} qKey="challenges" columns={[
          { key: 'title', label: 'Title', render: (r) => <span className="font-medium text-foreground">{r.title}</span> },
          { key: 'type', label: 'Type', render: (r) => <span className="text-xs capitalize px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{r.type}</span> },
          { key: 'status', label: 'Status', render: (r) => <span className={`text-xs capitalize px-2 py-0.5 rounded-full ${r.status === 'open' ? 'bg-green-500/10 text-green-500' : 'bg-secondary text-muted-foreground'}`}>{r.status}</span> },
          { key: 'submissions_count', label: 'Submissions' },
        ]} />
      )}
      {tab === 'resources' && (
        <SimpleListTab fetchFn={adminContentService.listResources} qKey="resources" columns={[
          { key: 'title', label: 'Title', render: (r) => <span className="font-medium text-foreground">{r.title}</span> },
          { key: 'type', label: 'Type', render: (r) => <span className="text-xs capitalize px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{r.type}</span> },
          { key: 'downloads_count', label: 'Downloads' },
          { key: 'avg_rating', label: 'Rating', render: (r) => `⭐ ${Number(r.avg_rating || 0).toFixed(1)}` },
        ]} />
      )}
      {tab === 'communities' && <CommunitiesTab />}
    </div>
  );
}
