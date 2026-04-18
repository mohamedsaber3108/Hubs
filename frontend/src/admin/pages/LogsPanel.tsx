import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Download, Search, ChevronLeft, ChevronRight, ScrollText } from 'lucide-react';
import { adminLogsService } from '../services/adminLogs.service';
import { toast } from 'sonner';

const ACTION_COLORS: Record<string, string> = {
  create: 'bg-green-500/10 text-green-500',
  update: 'bg-blue-500/10 text-blue-500',
  delete: 'bg-destructive/10 text-destructive',
  login:  'bg-primary-glow/10 text-primary-glow',
  logout: 'bg-secondary text-muted-foreground',
  toggle: 'bg-amber-500/10 text-amber-500',
};

function actionColor(action: string) {
  const key = Object.keys(ACTION_COLORS).find((k) => action?.toLowerCase().includes(k));
  return key ? ACTION_COLORS[key] : 'bg-secondary text-muted-foreground';
}

export default function LogsPanel() {
  const [page, setPage]     = useState(1);
  const [search, setSearch] = useState('');
  const [entity, setEntity] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'logs', { page, search, entity }],
    queryFn: () => adminLogsService.list({ page, limit: 25, search: search || undefined, entity_type: entity || undefined }),
    staleTime: 30_000,
  });

  const logs = data?.data ?? [];
  const pagination = data?.pagination;

  const handleExport = async () => {
    try {
      const blob = await adminLogsService.exportCsv({ search: search || undefined, entity_type: entity || undefined });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = `admin-logs-${Date.now()}.csv`; a.click();
      URL.revokeObjectURL(url);
      toast.success('Logs exported');
    } catch { toast.error('Export failed'); }
  };

  const ENTITY_TYPES = ['', 'user', 'post', 'event', 'challenge', 'resource', 'community', 'setting', 'flag', 'system'];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Activity Logs</h1>
          <p className="text-sm text-muted-foreground">{pagination?.total?.toLocaleString() ?? '—'} total entries</p>
        </div>
        <button onClick={handleExport} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm bg-card border border-border text-muted-foreground hover:text-foreground transition-colors">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search logs…"
            className="w-full pl-9 pr-3 py-2 text-sm bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-glow/30" />
        </div>
        <select value={entity} onChange={(e) => { setEntity(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-glow/30 text-muted-foreground capitalize">
          {ENTITY_TYPES.map((t) => <option key={t} value={t}>{t || 'All Entities'}</option>)}
        </select>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary-glow" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="text-start px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Admin</th>
                  <th className="text-start px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Action</th>
                  <th className="text-start px-4 py-3 text-xs font-semibold text-muted-foreground uppercase hidden md:table-cell">Entity</th>
                  <th className="text-start px-4 py-3 text-xs font-semibold text-muted-foreground uppercase hidden lg:table-cell">IP</th>
                  <th className="text-start px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground text-sm">{log.admin_email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${actionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {log.entity_type && (
                        <span className="text-xs text-muted-foreground capitalize">
                          {log.entity_type}{log.entity_id ? ` #${log.entity_id}` : ''}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell font-mono">{log.ip_address}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-16 text-muted-foreground">
                    <ScrollText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    No logs found
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{((page - 1) * 25) + 1}–{Math.min(page * 25, pagination.total)} of {pagination.total}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(page - 1)} disabled={page <= 1} className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground disabled:opacity-40">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="w-8 h-8 rounded-lg bg-primary-glow text-primary-foreground flex items-center justify-center text-xs font-bold">{page}</span>
            <button onClick={() => setPage(page + 1)} disabled={!pagination.hasNext} className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground disabled:opacity-40">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
