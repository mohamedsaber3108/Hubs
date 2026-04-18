import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Users, Check, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { useCommunities, useJoinCommunityMutation, useLeaveCommunityMutation } from "@/hooks/api/useCommunities";
import { useAuth } from "@/contexts/AuthContext";
import { useMe } from "@/hooks/api/useAuth";

export default function Communities() {
  const { isLoggedIn }      = useAuth();
  const { data: meData }    = useMe();
  const { data: communities, isLoading } = useCommunities();
  const { mutate: join, isPending: joining } = useJoinCommunityMutation();
  const { mutate: leave, isPending: leaving } = useLeaveCommunityMutation();
  const navigate = useNavigate();

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
            <h1 className="text-4xl font-bold text-foreground">Our Communities</h1>
            <p className="text-muted-foreground mt-3 text-lg">Four distinct spaces built for every Arab professional</p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary-glow" /></div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {communities?.map((community) => (
                <div key={community.id} className="bg-card border border-border rounded-2xl overflow-hidden hover:border-primary-glow/30 transition-all group">
                  {community.cover_image && (
                    <div className="h-32 overflow-hidden">
                      <img src={community.cover_image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                  )}
                  <div className="p-6">
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
                        onClick={() => handleJoin(community.slug, !!community.joined)}
                        disabled={joining || leaving}
                        className={community.joined ? "border border-border bg-background text-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30" : "bg-primary-glow text-primary-foreground"}
                        variant={community.joined ? "outline" : "default"}
                      >
                        {community.joined ? <><Check className="w-3 h-3 mr-1" /> Joined</> : 'Join'}
                      </Button>
                    </div>
                    <p className="text-muted-foreground text-sm mb-4">{community.description || community.tagline}</p>
                    <Link to={`/${community.slug}/feed`}
                      className="text-sm text-primary-glow hover:underline font-medium">
                      Explore {community.name} →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
