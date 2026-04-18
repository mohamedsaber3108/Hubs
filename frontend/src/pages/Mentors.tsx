import { useState, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Star, Loader2, Video, MessageCircle, DollarSign, BadgeCheck } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { useMentors, useRequestSessionMutation } from "@/hooks/api/useMentors";
import { useAuth } from "@/contexts/AuthContext";
import type { Mentor } from "@/lib/types";

function MentorCard({ mentor, onRequest, isLoggedIn }: { mentor: Mentor; onRequest: () => void; isLoggedIn: boolean }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 hover:border-primary-glow/30 transition-all">
      <div className="flex items-start gap-4">
        <div className="relative">
          <img
            src={mentor.user.avatar_url || `https://ui-avatars.com/api/?name=${mentor.user.first_name}&background=14b8a6&color=fff`}
            alt="" className="w-14 h-14 rounded-full object-cover"
          />
          {mentor.is_available && (
            <span className="absolute -bottom-0.5 -end-0.5 w-4 h-4 rounded-full bg-green-400 border-2 border-card" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground">{mentor.user.first_name} {mentor.user.last_name}</h3>
            <BadgeCheck className="w-4 h-4 text-primary-glow flex-shrink-0" />
          </div>
          <p className="text-sm text-muted-foreground">{mentor.user.headline || mentor.expertise}</p>
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />{mentor.rating.toFixed(1)}</span>
            <span>{mentor.sessions_count} sessions</span>
            {mentor.price_per_session ? (
              <span className="flex items-center gap-0.5"><DollarSign className="w-3 h-3" />{mentor.price_per_session}/hr</span>
            ) : <span className="text-green-500">Free</span>}
          </div>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {mentor.expertise.split(',').slice(0, 4).map((e) => (
              <span key={e} className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{e.trim()}</span>
            ))}
          </div>
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        {mentor.my_request?.status === 'pending' ? (
          <span className="flex-1 text-center text-sm py-2 rounded-lg bg-secondary text-muted-foreground">Request Pending</span>
        ) : mentor.my_request?.status === 'accepted' ? (
          <span className="flex-1 text-center text-sm py-2 rounded-lg bg-green-500/10 text-green-500">Session Accepted ✓</span>
        ) : (
          <Button size="sm" className="flex-1 bg-primary-glow text-primary-foreground gap-1.5" onClick={onRequest} disabled={!isLoggedIn || !mentor.is_available}>
            <Video className="w-4 h-4" /> {mentor.is_available ? 'Request Session' : 'Unavailable'}
          </Button>
        )}
      </div>
    </div>
  );
}

export default function Mentors() {
  const { community }       = useParams<{ community: string }>();
  const { isLoggedIn }      = useAuth();
  const [expertise, setExpertise] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [requestingId, setRequestingId]   = useState<number | null>(null);

  const params = { community, expertise: expertise || undefined, available: availableOnly ? 'true' : undefined };
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useMentors(params);
  const { mutate: requestSession, isPending: requesting } = useRequestSessionMutation(requestingId || 0);

  const mentors = data?.pages.flatMap((p) => p.data) ?? [];
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useCallback((node: HTMLDivElement | null) => {
    if (isFetchingNextPage) return;
    observerRef.current?.disconnect();
    if (!node) return;
    observerRef.current = new IntersectionObserver((e) => { if (e[0].isIntersecting && hasNextPage) fetchNextPage(); });
    observerRef.current.observe(node);
  }, [isFetchingNextPage, hasNextPage, fetchNextPage]);

  const handleRequest = (mentorId: number) => {
    setRequestingId(mentorId);
    requestSession({ topic: "Career guidance", session_type: "video" });
  };

  const EXPERTISE_TAGS = ["Design", "Development", "Data Science", "Business", "Marketing", "HR", "Finance", "AI/ML"];

  return (
    <>
      <Navbar />
      <main className="page-enter pt-20 pb-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Find a Mentor</h1>
            <p className="text-muted-foreground mt-1">Connect with experienced professionals who want to help you grow</p>
          </div>

          {/* Filters */}
          <div className="bg-card border border-border rounded-xl p-4 mb-6 space-y-3">
            <div className="flex flex-wrap gap-2">
              {EXPERTISE_TAGS.map((t) => (
                <button key={t} onClick={() => setExpertise(expertise === t ? '' : t)}
                  className={`px-3 py-1.5 rounded-full text-xs transition-all ${expertise === t ? 'bg-primary-glow text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>
                  {t}
                </button>
              ))}
              <button onClick={() => setAvailableOnly(!availableOnly)}
                className={`ms-auto flex items-center gap-1 px-3 py-1.5 rounded-full text-xs transition-all ${availableOnly ? 'bg-green-500/10 text-green-500' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>
                <span className={`w-2 h-2 rounded-full ${availableOnly ? 'bg-green-400' : 'bg-muted-foreground'}`} />
                Available now
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary-glow" /></div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {mentors.map((mentor) => (
                <MentorCard key={mentor.id} mentor={mentor} isLoggedIn={isLoggedIn} onRequest={() => handleRequest(mentor.id)} />
              ))}
              {mentors.length === 0 && (
                <div className="col-span-full text-center py-16 text-muted-foreground">
                  <Star className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No mentors found</p>
                  <p className="text-sm mt-1">Try adjusting your filters or check back later</p>
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
