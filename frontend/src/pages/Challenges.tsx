import { useState, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { Zap, Loader2, Trophy, Clock, Users } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useChallenges } from "@/hooks/api/useChallenges";
import { useAuth } from "@/contexts/AuthContext";
import type { Challenge } from "@/lib/types";

const STATUS_MAP: Record<string, string> = { open: 'bg-green-500/10 text-green-500', voting: 'bg-purple-500/10 text-purple-500', completed: 'bg-secondary text-muted-foreground' };
const TYPE_MAP:   Record<string, string> = { design: '🎨', code: '💻', writing: '✍️', video: '🎬', other: '⭐' };

function ChallengeCard({ challenge }: { challenge: Challenge }) {
  const daysLeft = challenge.end_date ? Math.max(0, Math.ceil((new Date(challenge.end_date).getTime() - Date.now()) / 86400000)) : null;
  return (
    <Link to={`/challenges/${challenge.id}`} className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary-glow/30 transition-all group block">
      {challenge.cover_image && (
        <div className="h-40 overflow-hidden">
          <img src={challenge.cover_image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        </div>
      )}
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-3">
          <span className="text-2xl">{TYPE_MAP[challenge.type] || '⭐'}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_MAP[challenge.status] || ''}`}>{challenge.status}</span>
        </div>
        <h3 className="font-semibold text-foreground group-hover:text-primary-glow transition-colors line-clamp-2">{challenge.title}</h3>
        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{challenge.description}</p>

        {challenge.prizes?.length > 0 && (
          <div className="flex gap-1.5 mt-3">
            {challenge.prizes.slice(0, 2).map((p, i) => (
              <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-yellow-400/10 text-yellow-500">🏆 {p.reward}</span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{challenge.submissions_count} submissions</span>
          {daysLeft !== null && (
            <span className={`flex items-center gap-1 ${daysLeft <= 3 ? 'text-destructive' : ''}`}>
              <Clock className="w-3 h-3" />{daysLeft === 0 ? 'Ends today' : `${daysLeft}d left`}
            </span>
          )}
          {challenge.points_reward && <span className="text-primary-glow">+{challenge.points_reward} pts</span>}
        </div>
        {challenge.my_submission && (
          <div className="mt-3 text-xs px-3 py-1.5 rounded-full bg-green-500/10 text-green-500 text-center">✓ Submitted</div>
        )}
      </div>
    </Link>
  );
}

export default function Challenges() {
  const { community }     = useParams<{ community: string }>();
  const [type, setType]   = useState('');
  const [status, setStatus] = useState('');

  const params = { community, type: type || undefined, status: status || undefined };
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useChallenges(params);

  const challenges = data?.pages.flatMap((p) => p.data) ?? [];
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useCallback((node: HTMLDivElement | null) => {
    if (isFetchingNextPage) return;
    observerRef.current?.disconnect();
    if (!node) return;
    observerRef.current = new IntersectionObserver((e) => { if (e[0].isIntersecting && hasNextPage) fetchNextPage(); });
    observerRef.current.observe(node);
  }, [isFetchingNextPage, hasNextPage, fetchNextPage]);

  return (
    <>
      <Navbar />
      <main className="page-enter pt-20 pb-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Challenges</h1>
            <p className="text-muted-foreground mt-1">Compete, learn, and win prizes</p>
          </div>

          <div className="flex gap-2 mb-6 flex-wrap">
            {[{k:'',l:'All'},{k:'open',l:'Open'},{k:'voting',l:'Voting'},{k:'completed',l:'Completed'}].map((s) => (
              <button key={s.k} onClick={() => setStatus(s.k)}
                className={`px-4 py-2 rounded-full text-sm transition-all ${status === s.k ? 'bg-primary-glow text-primary-foreground' : 'bg-card border border-border text-muted-foreground hover:text-foreground'}`}>
                {s.l}
              </button>
            ))}
            <div className="flex gap-2 ms-auto">
              {['','design','code','writing','video'].map((t) => (
                <button key={t} onClick={() => setType(t)}
                  className={`px-3 py-2 rounded-full text-sm transition-all ${type === t ? 'bg-primary-glow/20 text-primary-glow' : 'text-muted-foreground hover:text-foreground'}`}>
                  {t ? (TYPE_MAP[t] + ' ' + t[0].toUpperCase() + t.slice(1)) : 'All Types'}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary-glow" /></div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {challenges.map((c) => <ChallengeCard key={c.id} challenge={c} />)}
              {challenges.length === 0 && (
                <div className="col-span-full text-center py-16 text-muted-foreground">
                  <Zap className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No challenges found</p>
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
