import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Search, Users, MessageSquare, Lock, Globe, UserPlus, Filter, Loader2, PlusCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import { COMMUNITIES } from "@/lib/communities";
import { Button } from "@/components/ui/button";
import { useGroups, useJoinGroupMutation } from "@/hooks/api/useGroups";
import { useAuth } from "@/contexts/AuthContext";

const TYPE_ICONS: Record<string, any> = { public: Globe, private: Lock, invite: UserPlus };

export default function Groups() {
  const { community } = useParams<{ community: string }>();
  const activeCommunity = community || "";
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const { isLoggedIn } = useAuth();
  const joinMutation = useJoinGroupMutation();

  const params: Record<string, any> = {};
  if (activeCommunity) params.community = activeCommunity;
  if (typeFilter !== "all") params.type = typeFilter;
  if (search) params.search = search;

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useGroups(params);
  const groups = data?.pages.flatMap((p) => p.data) ?? [];

  return (
    <>
      <Navbar />
      <main className="page-enter pt-20 pb-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-foreground">Groups</h1>
            {isLoggedIn && (
              <Button asChild size="sm">
                <Link to="/groups/create"><PlusCircle className="w-4 h-4 mr-2" />Create Group</Link>
              </Button>
            )}
          </div>

          {/* Community tabs */}
          <div className="flex gap-2 overflow-x-auto pb-3 mb-4">
            {[{ id: "", name: "All", emoji: "🌐" }, ...COMMUNITIES].map((c) => (
              <Link key={c.id} to={c.id ? `/groups/${c.id}` : "/groups"}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${activeCommunity === c.id ? "bg-primary-glow text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-primary-glow/10"}`}>
                <span>{c.emoji}</span>{c.name}
              </Link>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-6">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search groups…"
                className="w-full pl-9 pr-3 py-2 text-sm bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-glow/30" />
            </div>
            {["all", "public", "private"].map((t) => (
              <button key={t} onClick={() => setTypeFilter(t)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm capitalize transition-all ${typeFilter === t ? "bg-primary-glow text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"}`}>
                {t === "public" ? <Globe className="w-3.5 h-3.5" /> : t === "private" ? <Lock className="w-3.5 h-3.5" /> : <Filter className="w-3.5 h-3.5" />}
                {t}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary-glow" /></div>
          ) : groups.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No groups found. Be the first to create one!</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {groups.map((g: any) => {
                const Icon = TYPE_ICONS[g.type] || Globe;
                const comm = COMMUNITIES.find((c) => c.id === g.community_slug || c.id === g.community?.slug);
                return (
                  <Link key={g.id} to={`/groups/${g.id}`}
                    className="bg-card border border-border rounded-2xl p-5 hover:border-primary-glow/40 hover:shadow-md transition-all group">
                    {g.cover_url && <img src={g.cover_url} alt="" className="w-full h-28 object-cover rounded-xl mb-4" />}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-foreground group-hover:text-primary-glow transition-colors line-clamp-1">{g.name}</h3>
                      <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    </div>
                    {g.description && <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{g.description}</p>}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{g.members_count ?? 0} members</span>
                      {comm && <span>{comm.emoji} {comm.name}</span>}
                    </div>
                    {isLoggedIn && !g.is_member && (
                      <button onClick={(e) => { e.preventDefault(); joinMutation.mutate(g.id); }}
                        className="mt-3 w-full py-1.5 rounded-lg bg-primary-glow/10 text-primary-glow text-xs font-medium hover:bg-primary-glow/20 transition-colors">
                        Join Group
                      </button>
                    )}
                  </Link>
                );
              })}
            </div>
          )}

          {hasNextPage && (
            <div className="flex justify-center mt-8">
              <Button variant="outline" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
                {isFetchingNextPage ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}Load More
              </Button>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
