import { Link, useNavigate } from "react-router-dom";
import { Users, Check, Loader2, Sparkles } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { useRecommendedCommunities, useJoinCommunityMutation, useLeaveCommunityMutation } from "@/hooks/api/useCommunities";
import { useAuth } from "@/contexts/AuthContext";

export default function Communities() {
  const { isLoggedIn } = useAuth();
  // Recommendations endpoint returns every active community ranked by the
  // viewer's personas (falls back to members_count for anonymous/no-persona
  // viewers), so it fully replaces the plain list here while adding the
  // persona-aware ordering + "why we recommend this" reasons.
  const { data: recs, isLoading } = useRecommendedCommunities();
  const { mutate: join, isPending: joining } = useJoinCommunityMutation();
  const { mutate: leave, isPending: leaving } = useLeaveCommunityMutation();
  const navigate = useNavigate();

  const communities = recs?.communities ?? [];
  const personalized = recs?.personalized ?? false;

  const handleJoin = (slug: string, joined: boolean) => {
    if (!isLoggedIn) { navigate('/auth/signin'); return; }
    if (joined) leave(slug); else join(slug);
  };

  return (
    <>
      <Navbar />
      <main className="page-enter pt-20 pb-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground">
              {personalized ? "Recommended for you" : "Our Communities"}
            </h1>
            <p className="text-muted-foreground mt-3 text-lg">
              {personalized
                ? "Ranked for your profile — explore the spaces that fit you best"
                : "Four distinct spaces built for every Arab professional"}
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary-glow" /></div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {communities.map((community) => {
                const recommended = personalized && community.match_score > 0;
                return (
                  <div key={community.id}
                    className={`bg-card border rounded-2xl overflow-hidden transition-all group ${recommended ? "border-primary-glow/50 ring-1 ring-primary-glow/20" : "border-border hover:border-primary-glow/30"}`}>
                    {community.cover_image && (
                      <div className="h-32 overflow-hidden">
                        <img src={community.cover_image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      </div>
                    )}
                    <div className="p-6">
                      {recommended && community.reason && (
                        <div className="flex items-center gap-1.5 text-xs font-medium text-primary-glow mb-3">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{community.reason}</span>
                        </div>
                      )}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <span className="text-4xl">{community.emoji}</span>
                          <div>
                            <h2 className="text-xl font-bold text-foreground">{community.name}</h2>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Users className="w-3 h-3" />
                              <span>{community.members_count?.toLocaleString()} members</span>
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleJoin(community.slug, community.is_member)}
                          disabled={joining || leaving}
                          className={community.is_member ? "border border-border bg-background text-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30" : "bg-primary-glow text-primary-foreground"}
                          variant={community.is_member ? "outline" : "default"}
                        >
                          {community.is_member ? <><Check className="w-3 h-3 mr-1" /> Joined</> : 'Join'}
                        </Button>
                      </div>
                      <p className="text-muted-foreground text-sm mb-4">{community.description || community.tagline}</p>
                      <Link to={`/${community.slug}/feed`}
                        className="text-sm text-primary-glow hover:underline font-medium">
                        Explore {community.name} →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
