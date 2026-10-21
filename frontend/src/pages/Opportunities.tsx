import { useState, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { Briefcase, Loader2, Bookmark, BookmarkCheck, Filter, Search } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { useOpportunities, useSaveOpportunityMutation } from "@/hooks/api/useOpportunities";
import { useAuth } from "@/contexts/AuthContext";
import type { Opportunity } from "@/lib/types";

// Aligned with the backend Opportunity ENUM (src/models/Opportunity.js).
const TYPES = ['all', 'gig', 'full-time', 'part-time', 'internship', 'volunteer', 'scholarship', 'mentorship', 'collaboration'];
const LOC_TYPES = ['all', 'remote', 'onsite'];

const TYPE_COLORS: Record<string, string> = {
  gig: 'bg-orange-500/10 text-orange-500', 'full-time': 'bg-blue-500/10 text-blue-500',
  'part-time': 'bg-sky-500/10 text-sky-500', internship: 'bg-purple-500/10 text-purple-500',
  volunteer: 'bg-teal-500/10 text-teal-500', scholarship: 'bg-green-500/10 text-green-500',
  mentorship: 'bg-pink-500/10 text-pink-500', collaboration: 'bg-yellow-500/10 text-yellow-500',
};

function OpportunityCard({ opp, onSave }: { opp: Opportunity; onSave?: () => void }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 hover:border-primary-glow/30 transition-all group relative">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
          <Briefcase className="w-6 h-6 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-foreground group-hover:text-primary-glow transition-colors">{opp.title}</h3>
            <button onClick={onSave} className="text-muted-foreground hover:text-primary-glow transition-colors flex-shrink-0">
              {opp.saved ? <BookmarkCheck className="w-5 h-5 text-primary-glow" /> : <Bookmark className="w-5 h-5" />}
            </button>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">{opp.company || 'USAM Hub'} · {opp.location || (opp.is_remote ? 'Remote' : '—')}</p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[opp.type] || 'bg-secondary text-muted-foreground'}`}>{opp.type}</span>
            {opp.is_remote && <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">Remote</span>}
            {opp.deadline && <span className="text-xs text-muted-foreground">Deadline: {new Date(opp.deadline).toLocaleDateString()}</span>}
          </div>
          <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{opp.description}</p>
          <div className="flex items-center justify-between mt-4">
            <p className="text-xs text-muted-foreground">{opp.applications_count} applicants</p>
            <div className="flex gap-2">
              {opp.applied ? (
                <span className="text-xs px-3 py-1.5 rounded-full bg-green-500/10 text-green-500 font-medium">✓ Applied</span>
              ) : (
                <Link to={`/opportunities`} className="text-xs px-3 py-1.5 rounded-full bg-primary-glow text-primary-foreground font-medium hover:bg-primary-glow/90 transition-colors">Apply Now</Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Opportunities() {
  const { community }           = useParams<{ community: string }>();
  const { isLoggedIn }          = useAuth();
  const [type, setType]         = useState('all');
  const [locType, setLocType]   = useState('all');
  const [search, setSearch]     = useState('');
  const [savedOnly, setSavedOnly] = useState(false);

  const params = {
    community,
    type:           type !== 'all' ? type : undefined,
    location_type:  locType !== 'all' ? locType : undefined,
    search:         search || undefined,
    saved:          savedOnly ? 'true' : undefined,
  };
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useOpportunities(params);
  const { mutate: toggleSave } = useSaveOpportunityMutation();

  const opportunities = data?.pages.flatMap((p) => p.data) ?? [];
  const observerRef   = useRef<IntersectionObserver | null>(null);
  const loadMoreRef   = useCallback((node: HTMLDivElement | null) => {
    if (isFetchingNextPage) return;
    observerRef.current?.disconnect();
    if (!node) return;
    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasNextPage) fetchNextPage();
    });
    observerRef.current.observe(node);
  }, [isFetchingNextPage, hasNextPage, fetchNextPage]);

  return (
    <>
      <Navbar />
      <main className="page-enter pt-20 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Opportunities</h1>
            <p className="text-muted-foreground mt-1">Jobs, internships, freelance projects, scholarships, and more</p>
          </div>

          {/* Filters */}
          <div className="bg-card border border-border rounded-xl p-4 mb-6 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search opportunities…"
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-secondary rounded-lg border-0 focus:outline-none text-foreground placeholder:text-muted-foreground" />
            </div>
            <div className="flex gap-2 flex-wrap">
              {TYPES.map((t) => (
                <button key={t} onClick={() => setType(t)}
                  className={`px-3 py-1.5 rounded-full text-xs capitalize transition-all ${type === t ? 'bg-primary-glow text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>
                  {t === 'all' ? 'All Types' : t}
                </button>
              ))}
            </div>
            <div className="flex gap-2 items-center flex-wrap">
              {LOC_TYPES.map((t) => (
                <button key={t} onClick={() => setLocType(t)}
                  className={`px-3 py-1.5 rounded-full text-xs capitalize transition-all ${locType === t ? 'bg-primary-glow text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>
                  {t === 'all' ? 'Any Location' : t}
                </button>
              ))}
              {isLoggedIn && (
                <button onClick={() => setSavedOnly(!savedOnly)}
                  className={`ms-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all ${savedOnly ? 'bg-primary-glow text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>
                  <Bookmark className="w-3 h-3" /> Saved only
                </button>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary-glow" /></div>
          ) : (
            <div className="space-y-4">
              {opportunities.map((opp) => (
                <OpportunityCard key={opp.id} opp={opp} onSave={isLoggedIn ? () => toggleSave(opp.id) : undefined} />
              ))}
              {opportunities.length === 0 && (
                <div className="text-center py-16 text-muted-foreground">
                  <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No opportunities found</p>
                  <p className="text-sm mt-1">Try adjusting your filters</p>
                </div>
              )}
            </div>
          )}
          <div ref={loadMoreRef} className="flex justify-center py-4">
            {isFetchingNextPage && <Loader2 className="w-6 h-6 animate-spin text-primary-glow" />}
          </div>
        </div>
      </main>
    </>
  );
}
