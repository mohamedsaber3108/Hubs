import { useState } from "react";
import { Link } from "react-router-dom";
import { Tag, Loader2, Search, BadgeCheck, Lock, Sparkles, Gift, Copy, Check } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { useOffers, useOffer, useRedeemOfferMutation } from "@/hooks/api/useOffers";
import { useAuth } from "@/contexts/AuthContext";
import type { Offer, OfferCategory, RedeemResult } from "@/lib/types";
import { toast } from "sonner";

const CATEGORIES: (OfferCategory | 'all')[] = ['all', 'discount', 'freebie', 'trial', 'cashback', 'service', 'event', 'course', 'other'];

const CATEGORY_LABEL: Record<string, string> = {
  all: 'All Perks', discount: 'Discounts', freebie: 'Freebies', trial: 'Free Trials',
  cashback: 'Cashback', service: 'Services', event: 'Events', course: 'Courses', other: 'Other',
};

export function discountLabel(o: Offer): string | null {
  if (o.discount_type === 'percentage' && o.discount_value != null) return `${Number(o.discount_value)}% off`;
  if (o.discount_type === 'fixed' && o.discount_value != null) return `${o.currency} ${Number(o.discount_value)} off`;
  if (o.discount_type === 'bogo') return 'Buy one get one';
  return null;
}

function OfferCard({ offer, onOpen }: { offer: Offer; onOpen: () => void }) {
  const deal = discountLabel(offer);
  const locked = offer.eligible === false;
  return (
    <button onClick={onOpen}
      className="text-left bg-card border border-border rounded-xl p-5 hover:border-primary-glow/40 transition-all group relative w-full">
      {offer.is_featured && (
        <span className="absolute top-3 right-3 flex items-center gap-1 text-xs text-primary-glow font-medium">
          <Sparkles className="w-3.5 h-3.5" /> Featured
        </span>
      )}
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0 overflow-hidden">
          {offer.organization?.logo_url
            ? <img src={offer.organization.logo_url} alt="" className="w-full h-full object-cover" />
            : <Gift className="w-6 h-6 text-muted-foreground" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="truncate">{offer.organization?.name || 'USAM Partner'}</span>
            {offer.organization?.is_verified && <BadgeCheck className="w-3.5 h-3.5 text-primary-glow flex-shrink-0" />}
          </div>
          <h3 className="font-semibold text-foreground mt-0.5 group-hover:text-primary-glow transition-colors line-clamp-2">{offer.title}</h3>
          {deal && <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full bg-primary-glow/10 text-primary-glow font-medium">{deal}</span>}
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{offer.description}</p>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground capitalize">{offer.category}</span>
            {offer.sold_out && <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">Sold out</span>}
            {locked && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Lock className="w-3 h-3" /> Eligibility required</span>}
          </div>
        </div>
      </div>
    </button>
  );
}

function OfferDetailModal({ id, onClose }: { id: number; onClose: () => void }) {
  const { isLoggedIn } = useAuth();
  const { data, isLoading } = useOffer(id);
  const { mutate: redeem, isPending } = useRedeemOfferMutation();
  const [result, setResult] = useState<RedeemResult | null>(null);
  const [copied, setCopied] = useState(false);

  const offer = data?.offer;
  const deal = offer ? discountLabel(offer) : null;

  const handleRedeem = () => {
    redeem(id, { onSuccess: (r) => setResult(r) });
  };

  const copyCode = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopied(true);
    toast.success('Code copied');
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        {isLoading || !offer ? (
          <div className="flex justify-center py-12"><Loader2 className="w-7 h-7 animate-spin text-primary-glow" /></div>
        ) : (
          <>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{offer.organization?.name || 'USAM Partner'}</span>
              {offer.organization?.is_verified && <BadgeCheck className="w-4 h-4 text-primary-glow" />}
            </div>
            <h2 className="text-2xl font-bold text-foreground mt-1">{offer.title}</h2>
            {deal && <span className="inline-block mt-2 text-sm px-3 py-1 rounded-full bg-primary-glow/10 text-primary-glow font-semibold">{deal}</span>}
            <p className="text-muted-foreground mt-4 whitespace-pre-line">{offer.description}</p>

            {offer.eligible_personas?.length > 0 && (
              <p className="text-xs text-muted-foreground mt-4">
                Eligible for: {offer.eligible_personas.join(', ')}
              </p>
            )}
            {offer.expires_at && (
              <p className="text-xs text-muted-foreground mt-1">Expires {new Date(offer.expires_at).toLocaleDateString()}</p>
            )}

            {/* Redemption result */}
            {result ? (
              <div className="mt-6 p-4 rounded-xl bg-primary-glow/5 border border-primary-glow/20">
                <p className="text-sm font-medium text-foreground mb-2">🎉 You're in! Here's your perk:</p>
                {result.code && (
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2 rounded-lg bg-background border border-border font-mono text-foreground">{result.code}</code>
                    <Button size="sm" variant="outline" onClick={() => copyCode(result.code!)}>
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                )}
                {result.redemption_url && (
                  <a href={result.redemption_url} target="_blank" rel="noreferrer"
                    className="inline-block mt-2 text-sm text-primary-glow hover:underline">Open redemption link →</a>
                )}
                {result.redemption_instructions && (
                  <p className="text-sm text-muted-foreground mt-2 whitespace-pre-line">{result.redemption_instructions}</p>
                )}
              </div>
            ) : data?.my_redemption ? (
              <div className="mt-6 p-4 rounded-xl bg-secondary">
                <p className="text-sm text-foreground">You've already redeemed this offer.</p>
                {data.my_redemption.code_snapshot && (
                  <code className="inline-block mt-2 px-3 py-1.5 rounded-lg bg-background border border-border font-mono text-sm text-foreground">
                    {data.my_redemption.code_snapshot}
                  </code>
                )}
              </div>
            ) : (
              <div className="mt-6">
                {!isLoggedIn ? (
                  <Link to="/auth/signin"><Button className="w-full bg-primary-glow text-primary-foreground">Sign in to redeem</Button></Link>
                ) : data?.sold_out ? (
                  <Button disabled className="w-full">Sold out</Button>
                ) : data?.eligible === false ? (
                  <Button disabled className="w-full"><Lock className="w-4 h-4 mr-2" /> Not eligible for your profile</Button>
                ) : (
                  <Button onClick={handleRedeem} disabled={isPending} className="w-full bg-primary-glow text-primary-foreground">
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Redeem offer'}
                  </Button>
                )}
              </div>
            )}

            <button onClick={onClose} className="mt-4 w-full text-sm text-muted-foreground hover:text-foreground">Close</button>
          </>
        )}
      </div>
    </div>
  );
}

export default function Offers() {
  const [category, setCategory] = useState<OfferCategory | 'all'>('all');
  const [search, setSearch] = useState('');
  const [openId, setOpenId] = useState<number | null>(null);

  const params = {
    category: category !== 'all' ? category : undefined,
    search: search || undefined,
  };
  const { data, isLoading } = useOffers(params);
  const offers = data?.data ?? [];

  return (
    <>
      <Navbar />
      <main className="page-enter pt-20 pb-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Tag className="w-7 h-7 text-primary-glow" /> Offers & Perks
            </h1>
            <p className="text-muted-foreground mt-1">Exclusive deals and benefits from USAM partner organizations</p>
          </div>

          <div className="bg-card border border-border rounded-xl p-4 mb-6 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search perks…"
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-secondary rounded-lg border-0 focus:outline-none text-foreground placeholder:text-muted-foreground" />
            </div>
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map((c) => (
                <button key={c} onClick={() => setCategory(c)}
                  className={`px-3 py-1.5 rounded-full text-xs transition-all ${category === c ? 'bg-primary-glow text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>
                  {CATEGORY_LABEL[c]}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary-glow" /></div>
          ) : offers.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Gift className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No perks available right now</p>
              <p className="text-sm mt-1">Check back soon for new partner offers</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-5">
              {offers.map((offer) => (
                <OfferCard key={offer.id} offer={offer} onOpen={() => setOpenId(offer.id)} />
              ))}
            </div>
          )}
        </div>
      </main>

      {openId != null && <OfferDetailModal id={openId} onClose={() => setOpenId(null)} />}
    </>
  );
}
