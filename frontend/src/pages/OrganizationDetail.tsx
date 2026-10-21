import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Building2, Loader2, BadgeCheck, Globe, Plus, Send, Check, X, Handshake, Tag, Settings2, Archive } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import {
  useOrganization, useOrganizationOffers, usePartnerships,
  useCreateOfferMutation, useSubmitOfferMutationById, useArchiveOfferMutation,
  useRequestPartnershipMutation, useRespondPartnershipMutation,
} from "@/hooks/api/useOffers";
import OfferManageModal from "@/components/offers/OfferManageModal";
import type { Offer, PartnershipRequest } from "@/lib/types";

const OFFER_STATUS_STYLE: Record<string, string> = {
  draft: 'bg-secondary text-muted-foreground', pending: 'bg-amber-500/10 text-amber-500',
  approved: 'bg-green-500/10 text-green-500', rejected: 'bg-destructive/10 text-destructive',
  archived: 'bg-secondary text-muted-foreground',
};

function CreateOfferForm({ slug, onDone }: { slug: string; onDone: () => void }) {
  const { mutate: create, isPending } = useCreateOfferMutation(slug);
  const [form, setForm] = useState({ title: "", description: "", discount_type: "percentage", discount_value: "", redemption_type: "code" });
  const submit = () => {
    create(
      {
        title: form.title,
        description: form.description,
        discount_type: form.discount_type,
        discount_value: form.discount_value ? Number(form.discount_value) : null,
        redemption_type: form.redemption_type,
      },
      { onSuccess: onDone },
    );
  };
  return (
    <div className="p-4 rounded-xl border border-border bg-secondary/30 space-y-3">
      <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Offer title *"
        className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-glow/30" />
      <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description *" rows={2}
        className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-glow/30 resize-none" />
      <div className="flex gap-2">
        <select value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value })}
          className="px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none">
          <option value="percentage">% off</option>
          <option value="fixed">Fixed off</option>
          <option value="bogo">BOGO</option>
          <option value="none">No discount</option>
        </select>
        <input value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: e.target.value })} placeholder="Value" type="number"
          className="flex-1 px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-glow/30" />
      </div>
      <div className="flex gap-2">
        <Button onClick={submit} disabled={!form.title.trim() || !form.description.trim() || isPending} size="sm" className="bg-primary-glow text-primary-foreground">
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create draft'}
        </Button>
        <Button onClick={onDone} size="sm" variant="outline">Cancel</Button>
      </div>
    </div>
  );
}

function OffersManager({ slug }: { slug: string }) {
  const { data: offers, isLoading } = useOrganizationOffers(slug);
  const { mutate: submit } = useSubmitOfferMutationById();
  const { mutate: archive } = useArchiveOfferMutation(slug);
  const [adding, setAdding] = useState(false);
  const [managing, setManaging] = useState<Offer | null>(null);

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground flex items-center gap-2"><Tag className="w-4 h-4 text-primary-glow" /> Your Offers</h3>
        {!adding && <Button size="sm" variant="outline" onClick={() => setAdding(true)}><Plus className="w-3.5 h-3.5 mr-1" /> New offer</Button>}
      </div>
      {adding && <div className="mb-4"><CreateOfferForm slug={slug} onDone={() => setAdding(false)} /></div>}
      {isLoading ? <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-primary-glow" /></div>
        : !offers?.length ? <p className="text-sm text-muted-foreground py-4 text-center">No offers yet. Create your first one.</p> : (
        <div className="space-y-2">
          {offers.map((o: Offer) => (
            <div key={o.id} className="flex items-center justify-between gap-2 py-2 border-b border-border last:border-0">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{o.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${OFFER_STATUS_STYLE[o.status]}`}>{o.status}</span>
                  <span className="text-xs text-muted-foreground">{o.redemptions_count} redeemed</span>
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                {o.status !== 'archived' && (
                  <Button size="sm" variant="outline" onClick={() => setManaging(o)}>
                    <Settings2 className="w-3.5 h-3.5 mr-1" /> Manage
                  </Button>
                )}
                {(o.status === 'draft' || o.status === 'rejected') && (
                  <Button size="sm" variant="outline" onClick={() => submit(o.id)}>
                    <Send className="w-3.5 h-3.5 mr-1" /> Submit
                  </Button>
                )}
                {o.status !== 'archived' && (
                  <button onClick={() => { if (confirm('Archive this offer?')) archive(o.id); }} title="Archive"
                    className="w-8 h-8 rounded-lg hover:bg-destructive/10 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors">
                    <Archive className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {managing && <OfferManageModal slug={slug} offer={managing} onClose={() => setManaging(null)} />}
    </div>
  );
}

function PartnershipsManager({ slug }: { slug: string }) {
  const { data: partnerships, isLoading } = usePartnerships(slug);
  const { mutate: request } = useRequestPartnershipMutation(slug);
  const { mutate: respond } = useRespondPartnershipMutation(slug);
  const [targetSlug, setTargetSlug] = useState("");

  const other = (p: PartnershipRequest) => (p.direction === 'incoming' ? p.requesterOrg : p.recipientOrg);

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h3 className="font-semibold text-foreground flex items-center gap-2 mb-4"><Handshake className="w-4 h-4 text-primary-glow" /> Partnerships</h3>

      <div className="flex gap-2 mb-4">
        <input value={targetSlug} onChange={(e) => setTargetSlug(e.target.value)} placeholder="Partner org slug (e.g. acme-perks-co)"
          className="flex-1 px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-glow/30" />
        <Button size="sm" className="bg-primary-glow text-primary-foreground"
          disabled={!targetSlug.trim()}
          onClick={() => { request({ target_slug: targetSlug.trim() }); setTargetSlug(""); }}>
          Request
        </Button>
      </div>

      {isLoading ? <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-primary-glow" /></div>
        : !partnerships?.length ? <p className="text-sm text-muted-foreground py-4 text-center">No partnerships yet.</p> : (
        <div className="space-y-2">
          {partnerships.map((p) => (
            <div key={p.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate flex items-center gap-1">
                  {other(p)?.name}
                  {other(p)?.is_verified && <BadgeCheck className="w-3.5 h-3.5 text-primary-glow" />}
                </p>
                <span className="text-xs text-muted-foreground capitalize">{p.direction} · {p.status}</span>
              </div>
              <div className="flex gap-1">
                {p.status === 'pending' && p.direction === 'incoming' && (
                  <>
                    <button onClick={() => respond({ id: p.id, action: 'accept' })} title="Accept"
                      className="w-7 h-7 rounded-lg hover:bg-green-500/10 flex items-center justify-center text-muted-foreground hover:text-green-500"><Check className="w-4 h-4" /></button>
                    <button onClick={() => respond({ id: p.id, action: 'decline' })} title="Decline"
                      className="w-7 h-7 rounded-lg hover:bg-destructive/10 flex items-center justify-center text-muted-foreground hover:text-destructive"><X className="w-4 h-4" /></button>
                  </>
                )}
                {p.status === 'accepted' && (
                  <Button size="sm" variant="outline" onClick={() => respond({ id: p.id, action: 'end' })}>End</Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function OrganizationDetail() {
  const { slug = "" } = useParams<{ slug: string }>();
  const { data, isLoading } = useOrganization(slug);
  const org = data?.organization;
  const canManage = data?.my_role === 'owner' || data?.my_role === 'admin';

  return (
    <>
      <Navbar />
      <main className="page-enter pt-20 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          {isLoading || !org ? (
            <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary-glow" /></div>
          ) : (
            <>
              <Link to="/organizations" className="text-sm text-muted-foreground hover:text-foreground">← All organizations</Link>
              <div className="flex items-start gap-4 mt-4 mb-8">
                <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {org.logo_url ? <img src={org.logo_url} alt="" className="w-full h-full object-cover" /> : <Building2 className="w-8 h-8 text-muted-foreground" />}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold text-foreground">{org.name}</h1>
                    {org.is_verified && <BadgeCheck className="w-5 h-5 text-primary-glow" />}
                  </div>
                  {org.tagline && <p className="text-muted-foreground mt-1">{org.tagline}</p>}
                  <div className="flex items-center gap-3 mt-2 text-sm">
                    {org.industry && <span className="text-muted-foreground">{org.industry}</span>}
                    {org.website && <a href={org.website} target="_blank" rel="noreferrer" className="text-primary-glow hover:underline flex items-center gap-1"><Globe className="w-3.5 h-3.5" /> Website</a>}
                  </div>
                  {!org.is_verified && <p className="text-xs text-amber-500 mt-2">Pending admin verification — offers can be drafted but not published until verified.</p>}
                </div>
              </div>

              {org.description && <p className="text-muted-foreground mb-8 whitespace-pre-line">{org.description}</p>}

              {canManage ? (
                <div className="space-y-6">
                  <div className="text-xs font-medium text-primary-glow uppercase tracking-wide">Management</div>
                  <OffersManager slug={slug} />
                  <PartnershipsManager slug={slug} />
                </div>
              ) : (
                <div className="rounded-xl border border-border bg-card p-6 text-center text-muted-foreground">
                  <Link to="/offers" className="text-primary-glow hover:underline">Browse this partner's live offers in the Perks catalog →</Link>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}
