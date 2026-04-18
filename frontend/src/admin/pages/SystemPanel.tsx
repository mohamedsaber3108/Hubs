import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, CheckCircle, XCircle, AlertTriangle, Play, Pause, Trash2, RefreshCw, AlertOctagon, Database, Server, Cpu } from 'lucide-react';
import { adminSystemService } from '../services/adminSystem.service';
import { toast } from 'sonner';

function StatusDot({ ok }: { ok: boolean }) {
  return <span className={`inline-flex w-2.5 h-2.5 rounded-full ${ok ? 'bg-green-400' : 'bg-destructive'} flex-shrink-0`} />;
}

function InfoCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: any; color: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${color}`}><Icon className="w-5 h-5" /></div>
      <p className="text-xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

export default function SystemPanel() {
  const qc = useQueryClient();
  const [maintenanceMsg, setMaintenanceMsg] = useState('');

  const { data: health, isLoading, refetch } = useQuery({
    queryKey: ['admin', 'system', 'health'],
    queryFn: adminSystemService.getHealth,
    refetchInterval: 30_000,
  });

  const { data: maintenance, refetch: refetchMaint } = useQuery({
    queryKey: ['admin', 'system', 'maintenance'],
    queryFn: adminSystemService.getMaintenance,
    refetchInterval: 60_000,
  });

  const { mutate: pauseQ }    = useMutation({ mutationFn: adminSystemService.pauseQueue,   onSuccess: () => { toast.success('Queue paused');   refetch(); } });
  const { mutate: resumeQ }   = useMutation({ mutationFn: adminSystemService.resumeQueue,  onSuccess: () => { toast.success('Queue resumed');  refetch(); } });
  const { mutate: cleanQ }    = useMutation({ mutationFn: adminSystemService.cleanQueue,   onSuccess: () => { toast.success('Queue cleaned');  refetch(); } });
  const { mutate: flushCache } = useMutation({ mutationFn: adminSystemService.flushCache,  onSuccess: () => { toast.success('Cache flushed'); refetch(); } });
  const { mutate: setMaint }  = useMutation({
    mutationFn: ({ enabled, message }: { enabled: boolean; message?: string }) => adminSystemService.setMaintenance(enabled, message),
    onSuccess: () => { refetchMaint(); toast.success('Maintenance mode updated'); },
  });

  if (isLoading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary-glow" /></div>;

  const queues: Record<string, any> = health?.queues ?? {};

  // Format uptime
  const uptimeSec = health?.system?.uptime ?? 0;
  const uptimeFmt = uptimeSec > 86400
    ? `${Math.floor(uptimeSec / 86400)}d ${Math.floor((uptimeSec % 86400) / 3600)}h`
    : `${Math.floor(uptimeSec / 3600)}h ${Math.floor((uptimeSec % 3600) / 60)}m`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">System Health</h1>
          <p className="text-sm text-muted-foreground">Infrastructure, queues, and maintenance</p>
        </div>
        <button onClick={() => refetch()} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm bg-card border border-border text-muted-foreground hover:text-foreground transition-colors">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Maintenance toggle */}
      <div className={`rounded-xl border p-5 ${maintenance?.enabled ? 'border-amber-400/30 bg-amber-400/5' : 'border-border bg-card'}`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <AlertTriangle className={`w-4 h-4 ${maintenance?.enabled ? 'text-amber-400' : 'text-muted-foreground'}`} />
              Maintenance Mode
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {maintenance?.enabled ? `ACTIVE — ${maintenance.message || 'Site is under maintenance'}` : 'Disabled — Site is operating normally'}
            </p>
          </div>
          <button onClick={() => setMaint({ enabled: !maintenance?.enabled, message: maintenanceMsg || undefined })}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${maintenance?.enabled ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20' : 'bg-amber-400/10 text-amber-500 hover:bg-amber-400/20'}`}>
            {maintenance?.enabled ? 'Disable' : 'Enable'}
          </button>
        </div>
        {!maintenance?.enabled && (
          <input value={maintenanceMsg} onChange={(e) => setMaintenanceMsg(e.target.value)}
            placeholder="Optional maintenance message…"
            className="mt-3 w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-glow/30 text-foreground" />
        )}
      </div>

      {/* System info */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <InfoCard label="Platform" value={health?.system?.platform ?? '—'} icon={Server} color="bg-primary-glow/10 text-primary-glow" />
        <InfoCard label="Uptime" value={uptimeFmt} icon={Cpu} color="bg-green-500/10 text-green-500" />
        <InfoCard label="Memory Used" value={health?.system?.memUsed ?? '—'} icon={Database} color="bg-blue-500/10 text-blue-500" />
        <InfoCard label="CPU" value={health?.system?.cpuUsage != null ? `${health.system.cpuUsage}%` : '—'} icon={Cpu} color="bg-amber-500/10 text-amber-500" />
      </div>

      {/* Services status */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-foreground text-sm mb-4 flex items-center gap-2"><Database className="w-4 h-4 text-primary-glow" /> Database</h3>
          <div className="flex items-center gap-2 mb-2">
            <StatusDot ok={health?.database?.connected ?? false} />
            <span className="text-sm text-foreground">{health?.database?.connected ? 'Connected' : 'Disconnected'}</span>
          </div>
          <p className="text-xs text-muted-foreground">Response time: {health?.database?.responseMs ?? '—'}ms</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-foreground text-sm mb-4 flex items-center gap-2"><Server className="w-4 h-4 text-primary-glow" /> Redis</h3>
          <div className="flex items-center gap-2 mb-2">
            <StatusDot ok={health?.redis?.connected ?? false} />
            <span className="text-sm text-foreground">{health?.redis?.connected ? 'Connected' : 'Disconnected'}</span>
          </div>
          <p className="text-xs text-muted-foreground">Memory: {health?.redis?.memoryUsage ?? '—'} · {health?.redis?.responseMs ?? '—'}ms</p>
        </div>
      </div>

      {/* Queues */}
      {Object.keys(queues).length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground text-sm">Job Queues</h3>
            <button onClick={() => flushCache()} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg border border-border hover:border-primary-glow/30">
              <Trash2 className="w-3 h-3" /> Flush Cache
            </button>
          </div>
          <div className="space-y-3">
            {Object.entries(queues).map(([name, q]) => (
              <div key={name} className="flex items-center gap-4 py-3 border-b border-border last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm capitalize">{name}</p>
                  <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                    <span>⏳ {q.waiting} waiting</span>
                    <span>⚡ {q.active} active</span>
                    {q.failed > 0 && <span className="text-destructive">❌ {q.failed} failed</span>}
                  </div>
                </div>
                <div className="flex gap-1.5">
                  {q.paused ? (
                    <button onClick={() => resumeQ(name)} title="Resume" className="w-7 h-7 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20 flex items-center justify-center transition-colors">
                      <Play className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button onClick={() => pauseQ(name)} title="Pause" className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 flex items-center justify-center transition-colors">
                      <Pause className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button onClick={() => cleanQ(name)} title="Clean failed" className="w-7 h-7 rounded-lg bg-secondary text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
