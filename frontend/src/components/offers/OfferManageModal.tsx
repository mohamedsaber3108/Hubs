import { useState } from "react";
import { Loader2, X, Check, Tag, BarChart3, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useUpdateOfferMutation, usePromoCodes, useAddPromoCodeMutation,
  useUpdatePromoCodeMutation, useOfferAnalytics,
} from "@/hooks/api/useOffers";
import { useCommunities } from "@/hooks/api/useCommunities";
import type { Offer, ProfessionalRole } from "@/lib/types";

const PERSONAS: ProfessionalRole[] = ['freelancer', 'student', 'recruiter', 'employer', 'entrepreneur', 'job_seeker', 'mentor'];
const CATEGORIES = ['discount', 'freebie', 'trial', 'cashback', 'service', 'event', 'course', 'other'];

// ISO datetime <-> value for <input type="datetime-local"> (which has no tz).
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}
function fromLocalInput(v: string): string | null {
  return v ? new Date(v).toISOString() : null;
}

function EditTab({ slug, offer, onClose }: { slug: string; offer: Offer; onClose: () => void }) {
  const { mutate: update, isPending } = useUpdateOfferMutation(slug);
  const { data: communities } = useCommunities();
  const [f, setF] = useState({
    title: offer.title,
    description: offer.description,
    category: offer.category,
    discount_type: offer.discount_type,
    discount_value: offer.discount_value != null ? String(offer.discount_value) : "",
    currency: offer.currency || "USD",
    redemption_type: offer.redemption_type,
    redemption_url: offer.redemption_url || "",
    redemption_instructions: offer.redemption_instructions || "",
    eligible_personas: offer.eligible_personas || [],
    target_communities: offer.target_communities || [],
    total_limit: offer.total_limit != null ? String(offer.total_limit) : "",
    per_user_limit: offer.per_user_limit != null ? String(offer.per_user_limit) : "1",
    starts_at: toLocalInput(offer.starts_at),
    expires_at: toLocalInput(offer.expires_at),
  });

  const toggle = (key: 'eligible_personas' | 'target_communities', val: string) => {
    setF((p) => ({ ...p, [key]: (p[key] as string[]).includes(val) ? (p[key] as string[]).filter((x) => x !== val) : [...(p[key] as string[]), val] }));
  };

  const save = () => {
    update({
      id: offer.id,
      data: {
        title: f.title,
        description: f.description,
        category: f.category,
        discount_type: f.discount_type,
        discount_value: f.discount_value ? Number(f.discount_value) : null,
        currency: f.currency,
        redemption_type: f.redemption_type,
        redemption_url: f.redemption_url || null,
        redemption_instructions: f.redemption_instructions || null,
        eligible_personas: f.eligible_personas,
        target_communities: f.target_communities,
        total_limit: f.total_limit ? Number(f.total_limit) : null,
        per_user_limit: f.per_user_limit ? Number(f.per_user_limit) : 1,
        starts_at: fromLocalInput(f.starts_at),
        expires_at: fromLocalInput(f.expires_at),
      },
    }, { onSuccess: onClose });
  };

  const inputCls = "w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-glow/30";
  const label = "text-xs font-medium text-muted-foreground block mb-1";

  return (
    <div className="space-y-4">
      {['approved', 'pending', 'rejected'].includes(offer.status) && (
        <p className="text-xs text-amber-500">Editing will return this offer to <strong>draft</strong> and require re-approval.</p>
      )}
      <div><label className={label}>Title</label><input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} className={inputCls} /></div>
      <div><label className={label}>Description</label><textarea rows={3} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} className={`${inputCls} resize-none`} /></div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={label}>Category</label>
          <select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value as any })} className={inputCls}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className={label}>Discount type</label>
          <select value={f.discount_type} onChange={(e) => setF({ ...f, discount_type: e.target.value as any })} className={inputCls}>
            <option value="percentage">% off</option><option value="fixed">Fixed off</option><option value="bogo">BOGO</option><option value="none">None</option>
          </select>
        </div>
      </div>
      {f.discount_type !== 'none' && f.discount_type !== 'bogo' && (
        <div className="grid grid-cols-2 gap-3">
          <div><label className={label}>Discount value</label><input type="number" value={f.discount_value} onChange={(e) => setF({ ...f, discount_value: e.target.value })} className={inputCls} /></div>
          <div><label className={label}>Currency</label><input value={f.currency} onChange={(e) => setF({ ...f, currency: e.target.value.toUpperCase().slice(0, 3) })} className={inputCls} /></div>
        </div>
      )}

      <div>
        <label className={label}>Redemption type</label>
        <select value={f.redemption_type} onChange={(e) => setF({ ...f, redemption_type: e.target.value as any })} className={inputCls}>
          <option value="code">Promo code</option><option value="url">URL</option><option value="manual">Manual instructions</option>
        </select>
      </div>
      {f.redemption_type === 'url' && (
        <div><label className={label}>Redemption URL</label><input value={f.redemption_url} onChange={(e) => setF({ ...f, redemption_url: e.target.value })} className={inputCls} /></div>
      )}
      {f.redemption_type === 'manual' && (
        <div><label className={label}>Redemption instructions</label><textarea rows={2} value={f.redemption_instructions} onChange={(e) => setF({ ...f, redemption_instructions: e.target.value })} className={`${inputCls} resize-none`} /></div>
      )}

      <div>
        <label className={label}>Eligible personas <span className="font-normal">(none = everyone)</span></label>
        <div className="flex flex-wrap gap-1.5">
          {PERSONAS.map((p) => {
            const on = f.eligible_personas.includes(p);
            return <button key={p} type="button" onClick={() => toggle('eligible_personas', p)}
              className={`px-2.5 py-1 rounded-full text-xs capitalize transition-colors ${on ? 'bg-primary-glow text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>
              {on && '✓ '}{p.replace('_', ' ')}</button>;
          })}
        </div>
      </div>

      <div>
        <label className={label}>Target communities <span className="font-normal">(none = all)</span></label>
        <div className="flex flex-wrap gap-1.5">
          {communities?.map((c) => {
            const on = f.target_communities.includes(c.slug);
            return <button key={c.id} type="button" onClick={() => toggle('target_communities', c.slug)}
              className={`px-2.5 py-1 rounded-full text-xs transition-colors ${on ? 'bg-primary-glow text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>
              {on && '✓ '}{c.emoji} {c.name}</button>;
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div><label className={label}>Total limit <span className="font-normal">(blank = unlimited)</span></label><input type="number" value={f.total_limit} onChange={(e) => setF({ ...f, total_limit: e.target.value })} className={inputCls} /></div>
        <div><label className={label}>Per-user limit</label><input type="number" value={f.per_user_limit} onChange={(e) => setF({ ...f, per_user_limit: e.target.value })} className={inputCls} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className={label}>Starts at</label><input type="datetime-local" value={f.starts_at} onChange={(e) => setF({ ...f, starts_at: e.target.value })} className={inputCls} /></div>
        <div><label className={label}>Expires at</label><input type="datetime-local" value={f.expires_at} onChange={(e) => setF({ ...f, expires_at: e.target.value })} className={inputCls} /></div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button onClick={save} disabled={!f.title.trim() || !f.description.trim() || isPending} className="bg-primary-glow text-primary-foreground">
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save changes'}
        </Button>
        <Button onClick={onClose} variant="outline">Cancel</Button>
      </div>
    </div>
  );
}

function PromoTab({ offer }: { offer: Offer }) {
  const { data: codes, isLoading } = usePromoCodes(offer.id);
  const { mutate: add, isPending } = useAddPromoCodeMutation(offer.id);
  const { mutate: toggle } = useUpdatePromoCodeMutation(offer.id);
  const [form, setForm] = useState({ code: "", max_uses: "" });

  return (
    <div className="space-y-4">
      {offer.redemption_type !== 'code' && (
        <p className="text-xs text-amber-500">This offer's redemption type is "{offer.redemption_type}". Promo codes are only used when redemption type is "code".</p>
      )}
      <div className="flex gap-2">
        <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="CODE"
          className="flex-1 px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-glow/30" />
        <input value={form.max_uses} onChange={(e) => setForm({ ...form, max_uses: e.target.value })} placeholder="Max uses" type="number"
          className="w-28 px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-glow/30" />
        <Button size="sm" className="bg-primary-glow text-primary-foreground" disabled={!form.code.trim() || isPending}
          onClick={() => add({ code: form.code.trim(), max_uses: form.max_uses ? Number(form.max_uses) : null }, { onSuccess: () => setForm({ code: "", max_uses: "" }) })}>
          Add
        </Button>
      </div>

      {isLoading ? <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-primary-glow" /></div>
        : !codes?.length ? <p className="text-sm text-muted-foreground py-4 text-center">No promo codes yet.</p> : (
        <div className="space-y-2">
          {codes.map((c) => (
            <div key={c.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div>
                <code className="text-sm font-mono text-foreground">{c.code}</code>
                <span className="text-xs text-muted-foreground ms-2">{c.uses_count}{c.max_uses != null ? `/${c.max_uses}` : ''} used</span>
              </div>
              <button onClick={() => toggle({ codeId: c.id, is_active: !c.is_active })}
                className={`text-xs px-2 py-1 rounded-lg ${c.is_active ? 'text-green-500 hover:bg-green-500/10' : 'text-muted-foreground hover:bg-secondary'}`}>
                {c.is_active ? 'Active' : 'Inactive'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AnalyticsTab({ offer }: { offer: Offer }) {
  const { data, isLoading } = useOfferAnalytics(offer.id);
  if (isLoading || !data) return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary-glow" /></div>;
  const a = data.analytics;
  const stat = (label: string, value: string | number) => (
    <div className="rounded-lg bg-secondary/50 p-3"><div className="text-xl font-bold text-foreground">{value}</div><div className="text-xs text-muted-foreground mt-0.5">{label}</div></div>
  );
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stat('Redemptions', a.total_redemptions)}
        {stat('Remaining', a.remaining == null ? '∞' : a.remaining)}
        {stat('Promo codes', a.promo_codes_count)}
        {stat('Code uses', a.promo_code_uses)}
      </div>
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2">Recent redemptions</p>
        {data.recent.length === 0 ? <p className="text-sm text-muted-foreground py-2">No redemptions yet.</p> : (
          <div className="space-y-1">
            {data.recent.map((r) => (
              <div key={r.id} className="flex items-center justify-between py-1.5 text-sm border-b border-border last:border-0">
                <span className="text-foreground">{(r as any).user?.first_name} {(r as any).user?.last_name}</span>
                <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function OfferManageModal({ slug, offer, onClose }: { slug: string; offer: Offer; onClose: () => void }) {
  const [tab, setTab] = useState<'edit' | 'promo' | 'analytics'>('edit');
  const TABS = [
    { id: 'edit', label: 'Edit', icon: Tag },
    { id: 'promo', label: 'Promo codes', icon: Ticket },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl max-w-lg w-full max-h-[88vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-bold text-foreground truncate">{offer.title}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-xs text-muted-foreground mb-4 capitalize">Status: {offer.status}</p>

        <div className="flex gap-1 mb-5 border-b border-border">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === id ? 'border-primary-glow text-primary-glow' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        {tab === 'edit' && <EditTab slug={slug} offer={offer} onClose={onClose} />}
        {tab === 'promo' && <PromoTab offer={offer} />}
        {tab === 'analytics' && <AnalyticsTab offer={offer} />}
      </div>
    </div>
  );
}
