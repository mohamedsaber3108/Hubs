import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tag, Building2, Loader2, Check, X, BadgeCheck, ChevronLeft, ChevronRight, ShieldCheck, ShieldOff } from 'lucide-react';
import { adminOffersService } from '../services/adminOffers.service';
import { toast } from 'sonner';

const OFFER_TABS = [
  { id: 'review', label: 'Offer Review', icon: Tag },
  { id: 'orgs',   label: 'Organizations', icon: Building2 },
];

const STATUS_FILTERS = ['pending', 'approved', 'rejected', 'draft', 'all'];

const STATUS_STYLE: Record<string, string> = {
  pending:  'bg-amber-500/10 text-amber-500',
  approved: 'bg-green-500/10 text-green-500',
  rejected: 'bg-destructive/10 text-destructive',
  draft:    'bg-secondary text-muted-foreground',
  archived: 'bg-secondary text-muted-foreground',
};

function OffersReviewTab() {
  const qc = useQueryClient();
  const [status, setStatus] = useState('pending');
  const [page, setPage] = useState(1);
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [reason, setReason] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'offers', { status, page }],
    queryFn: () => adminOffersService.listOffers({ status, page, limit: 20 }),
    staleTime: 15_000,
  });

  const { mutate: review, isPending } = useMutation({
    mutationFn: ({ id, decision, reason }: { id: number; decision: 'approved' | 'rejected'; reason?: string }) =>
      adminOffersService.reviewOffer(id, decision, reason),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['admin', 'offers'] });
      toast.success(`Offer ${v.decision}`);
      setRejectId(null);
      setReason('');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Review failed'),
  });

  const offers = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {STATUS_FILTERS.map((s) => (
          <button key={s} onClick={() => { setStatus(s); setPage(1); }}
            className={`px-3 py-1.5 rounded-full text-xs capitalize transition-all ${status === s ? 'bg-primary-glow text-primary-foreground' : 'bg-card border border-border text-muted-foreground hover:text-foreground'}`}>
            {s}
          </button>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {isLoading ? <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary-glow" /></div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-secondary/50">
                <th className="text-start px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Offer</th>
                <th className="text-start px-4 py-3 text-xs font-semibold text-muted-foreground uppercase hidden md:table-cell">Organization</th>
                <th className="text-start px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Status</th>
                <th className="px-4 py-3 w-28"></th>
              </tr></thead>
              <tbody className="divide-y divide-border">
                {offers.map((o: any) => (
                  <tr key={o.id} className="hover:bg-secondary/30 transition-colors align-top">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{o.title}</p>
                      <p className="text-xs text-muted-foreground capitalize">{o.category} · {o.discount_type}{o.discount_value ? ` ${o.discount_value}` : ''}</p>
                      {o.rejection_reason && <p className="text-xs text-destructive mt-1">Reason: {o.rejection_reason}</p>}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        {o.organization?.name || '—'}
                        {o.organization?.is_verified && <BadgeCheck className="w-3.5 h-3.5 text-primary-glow" />}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${STATUS_STYLE[o.status] || 'bg-secondary text-muted-foreground'}`}>{o.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      {o.status === 'pending' && (
                        <div className="flex gap-1">
                          <button onClick={() => review({ id: o.id, decision: 'approved' })} disabled={isPending} title="Approve"
                            className="w-7 h-7 rounded-lg hover:bg-green-500/10 flex items-center justify-center text-muted-foreground hover:text-green-500 transition-colors">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onClick={() => setRejectId(o.id)} disabled={isPending} title="Reject"
                            className="w-7 h-7 rounded-lg hover:bg-destructive/10 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {offers.length === 0 && <tr><td colSpan={4} className="text-center py-12 text-muted-foreground">No offers</td></tr>}
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

      {/* Reject reason modal */}
      {rejectId != null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setRejectId(null)}>
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-foreground">Reject offer</h3>
            <p className="text-sm text-muted-foreground mt-1">Provide a reason (sent to the organization).</p>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3}
              placeholder="e.g. Discount terms are unclear…"
              className="w-full mt-3 px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-glow/30" />
            <div className="flex gap-2 mt-4">
              <button onClick={() => setRejectId(null)} className="flex-1 px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground">Cancel</button>
              <button onClick={() => review({ id: rejectId, decision: 'rejected', reason })} disabled={!reason.trim() || isPending}
                className="flex-1 px-4 py-2 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium disabled:opacity-50">Reject</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function OrgsTab() {
  const qc = useQueryClient();
  const [verified, setVerified] = useState('all');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'organizations', { verified, page }],
    queryFn: () => adminOffersService.listOrganizations({ verified: verified === 'all' ? undefined : verified, page, limit: 20 }),
  });
  const { mutate: setVerify, isPending } = useMutation({
    mutationFn: ({ id, v }: { id: number; v: boolean }) => adminOffersService.setVerification(id, v),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'organizations'] }); toast.success('Updated'); },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Update failed'),
  });

  const orgs = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {['all', 'false', 'true'].map((v) => (
          <button key={v} onClick={() => { setVerified(v); setPage(1); }}
            className={`px-3 py-1.5 rounded-full text-xs transition-all ${verified === v ? 'bg-primary-glow text-primary-foreground' : 'bg-card border border-border text-muted-foreground hover:text-foreground'}`}>
            {v === 'all' ? 'All' : v === 'true' ? 'Verified' : 'Unverified'}
          </button>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {isLoading ? <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary-glow" /></div> : (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-secondary/50">
              <th className="text-start px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Organization</th>
              <th className="text-start px-4 py-3 text-xs font-semibold text-muted-foreground uppercase hidden md:table-cell">Owner</th>
              <th className="text-start px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Verified</th>
              <th className="px-4 py-3 w-28"></th>
            </tr></thead>
            <tbody className="divide-y divide-border">
              {orgs.map((o: any) => (
                <tr key={o.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{o.name}</p>
                    <p className="text-xs text-muted-foreground">{o.slug}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                    {o.owner ? `${o.owner.first_name} ${o.owner.last_name}` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${o.is_verified ? 'bg-green-500/10 text-green-500' : 'bg-secondary text-muted-foreground'}`}>
                      {o.is_verified ? 'Verified' : 'Unverified'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => setVerify({ id: o.id, v: !o.is_verified })} disabled={isPending}
                      title={o.is_verified ? 'Revoke verification' : 'Verify'}
                      className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                      {o.is_verified ? <><ShieldOff className="w-3.5 h-3.5" /> Revoke</> : <><ShieldCheck className="w-3.5 h-3.5" /> Verify</>}
                    </button>
                  </td>
                </tr>
              ))}
              {orgs.length === 0 && <tr><td colSpan={4} className="text-center py-12 text-muted-foreground">No organizations</td></tr>}
            </tbody>
          </table>
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

export default function OffersPanel() {
  const [tab, setTab] = useState('review');
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-foreground">Offers & Perks</h1>
        <p className="text-sm text-muted-foreground">Review partner offers and verify organizations</p>
      </div>
      <div className="flex gap-2 flex-wrap">
        {OFFER_TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${tab === id ? 'bg-primary-glow text-primary-foreground' : 'bg-card border border-border text-muted-foreground hover:text-foreground'}`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>
      {tab === 'review' ? <OffersReviewTab /> : <OrgsTab />}
    </div>
  );
}
