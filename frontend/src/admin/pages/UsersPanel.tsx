import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Loader2, MoreHorizontal, Ban, CheckCircle, Key, Trash2, ChevronLeft, ChevronRight, Shield, User } from 'lucide-react';
import { adminUsersService } from '../services/adminUsers.service';
import { toast } from 'sonner';

const STATUS_COLORS: Record<string, string> = {
  active:    'bg-green-500/10 text-green-500',
  suspended: 'bg-amber-500/10 text-amber-500',
  banned:    'bg-destructive/10 text-destructive',
};
const ROLE_COLORS: Record<string, string> = {
  user:      'bg-secondary text-muted-foreground',
  moderator: 'bg-blue-500/10 text-blue-500',
  admin:     'bg-primary-glow/10 text-primary-glow',
};

export default function UsersPanel() {
  const qc = useQueryClient();
  const [search, setSearch]   = useState('');
  const [status, setStatus]   = useState('');
  const [role, setRole]       = useState('');
  const [page, setPage]       = useState(1);
  const [openMenu, setOpenMenu] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', { search, status, role, page }],
    queryFn: () => adminUsersService.list({ search: search || undefined, status: status || undefined, role: role || undefined, page, limit: 20 }),
    staleTime: 30_000,
  });

  const users = data?.data ?? [];
  const pagination = data?.pagination;

  const { mutate: updateStatus } = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => adminUsersService.updateStatus(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'users'] }); toast.success('Status updated'); setOpenMenu(null); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  });
  const { mutate: forceReset } = useMutation({
    mutationFn: adminUsersService.forceReset,
    onSuccess: () => { toast.success('Password reset email sent'); setOpenMenu(null); },
  });
  const { mutate: deleteUser } = useMutation({
    mutationFn: adminUsersService.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'users'] }); toast.success('User deleted'); setOpenMenu(null); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">User Management</h1>
          <p className="text-sm text-muted-foreground">{pagination?.total?.toLocaleString() ?? '—'} total users</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search name, email, username…"
            className="w-full pl-9 pr-3 py-2 text-sm bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-glow/30" />
        </div>
        {[{ val: '', label: 'All Status' }, { val: 'active', label: 'Active' }, { val: 'suspended', label: 'Suspended' }, { val: 'banned', label: 'Banned' }].map((s) => (
          <button key={s.val} onClick={() => { setStatus(s.val); setPage(1); }}
            className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${status === s.val ? 'bg-primary-glow text-primary-foreground' : 'bg-card border border-border text-muted-foreground hover:text-foreground'}`}>
            {s.label}
          </button>
        ))}
        {[{ val: '', label: 'All Roles' }, { val: 'user', label: 'User' }, { val: 'moderator', label: 'Mod' }, { val: 'admin', label: 'Admin' }].map((r) => (
          <button key={r.val} onClick={() => { setRole(r.val); setPage(1); }}
            className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${role === r.val ? 'bg-primary-glow text-primary-foreground' : 'bg-card border border-border text-muted-foreground hover:text-foreground'}`}>
            {r.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary-glow" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="text-start px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">User</th>
                  <th className="text-start px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Email</th>
                  <th className="text-start px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="text-start px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Role</th>
                  <th className="text-start px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Points</th>
                  <th className="text-start px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Joined</th>
                  <th className="px-4 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((u: any) => (
                  <tr key={u.id} className="hover:bg-secondary/30 transition-colors relative">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <img src={u.avatar_url || `https://ui-avatars.com/api/?name=${u.first_name}&background=14b8a6&color=fff&size=32`} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                        <div>
                          <p className="font-medium text-foreground leading-none">{u.first_name} {u.last_name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">@{u.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_COLORS[u.status] || 'bg-secondary text-muted-foreground'}`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${ROLE_COLORS[u.role] || ROLE_COLORS.user}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{u.points_total?.toLocaleString()}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 relative">
                      <button onClick={() => setOpenMenu(openMenu === u.id ? null : u.id)} className="w-7 h-7 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                      {openMenu === u.id && (
                        <div className="absolute end-2 top-10 z-30 bg-card border border-border rounded-xl shadow-xl p-1 w-44 text-sm">
                          {u.status === 'active' ? (
                            <button onClick={() => updateStatus({ id: u.id, status: 'suspended' })} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary text-amber-500 hover:text-amber-400 transition-colors">
                              <Ban className="w-3.5 h-3.5" /> Suspend
                            </button>
                          ) : (
                            <button onClick={() => updateStatus({ id: u.id, status: 'active' })} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary text-green-500 hover:text-green-400 transition-colors">
                              <CheckCircle className="w-3.5 h-3.5" /> Activate
                            </button>
                          )}
                          {u.status !== 'banned' && (
                            <button onClick={() => updateStatus({ id: u.id, status: 'banned' })} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary text-destructive transition-colors">
                              <Ban className="w-3.5 h-3.5" /> Ban
                            </button>
                          )}
                          <button onClick={() => forceReset(u.id)} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                            <Key className="w-3.5 h-3.5" /> Force Reset
                          </button>
                          <div className="my-1 border-t border-border" />
                          <button onClick={() => { if (confirm(`Delete ${u.username}? This cannot be undone.`)) deleteUser(u.id); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary text-destructive transition-colors">
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-16 text-muted-foreground">No users found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {((page - 1) * 20) + 1}–{Math.min(page * 20, pagination.total)} of {pagination.total}
          </span>
          <div className="flex gap-2">
            <button onClick={() => setPage(page - 1)} disabled={page <= 1} className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="w-8 h-8 rounded-lg bg-primary-glow text-primary-foreground flex items-center justify-center text-xs font-bold">{page}</span>
            <button onClick={() => setPage(page + 1)} disabled={!pagination.hasNext} className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
