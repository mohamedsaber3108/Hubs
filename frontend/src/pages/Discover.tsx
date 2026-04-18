import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Search, MapPin, Users, UserPlus, Check, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { COMMUNITIES } from "@/lib/communities";
import { useSearchResults } from "@/hooks/api/useSearch";
import { userService } from "@/services/user.service";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function Discover() {
  const { community } = useParams<{ community: string }>();
  const [query, setQuery] = useState(community ? "" : "a"); // seed with 'a' for initial results
  const [followed, setFollowed] = useState<Set<number>>(new Set());
  const [following, setFollowing] = useState<Set<number>>(new Set());
  const { user: me, isLoggedIn } = useAuth();

  const { data, isLoading } = useSearchResults(
    query.length >= 1 ? { q: query, type: "users" } : undefined
  );
  const users: any[] = data?.users ?? [];

  const handleFollow = async (u: any) => {
    if (!isLoggedIn) return;
    if (followed.has(u.id)) return;
    setFollowing((p) => new Set(p).add(u.id));
    try {
      await userService.follow(u.id);
      setFollowed((p) => new Set(p).add(u.id));
      toast.success(`Following @${u.username}`);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed");
    } finally {
      setFollowing((p) => { const n = new Set(p); n.delete(u.id); return n; });
    }
  };

  return (
    <>
      <Navbar />
      <main className="page-enter pt-20 pb-20 md:pb-16">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground">Discover People</h1>
            <p className="text-sm text-muted-foreground mt-1">Find professionals who share your interests</p>
          </div>

          <div className="flex flex-wrap gap-3 mb-6">
            <div className="relative flex-1 min-w-48 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input value={query} onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-input rounded-xl bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary-glow/30"
                placeholder="Search by name, skill, headline..." />
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary-glow" /></div>
          ) : users.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No users found. Try a different search.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {users.filter((u) => u.id !== me?.id).map((u: any) => {
                const isFollowed  = followed.has(u.id);
                const isFollowing = following.has(u.id);
                return (
                  <div key={u.id} className="bg-card border border-border rounded-xl p-5 hover:border-primary-glow/30 transition-all">
                    <div className="flex items-start gap-3 mb-3">
                      <Link to={`/users/${u.username}`}>
                        <img
                          src={u.avatar_url || `https://ui-avatars.com/api/?name=${u.first_name}&background=14b8a6&color=fff&size=48`}
                          alt="" className="w-12 h-12 rounded-full object-cover" />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link to={`/users/${u.username}`} className="font-semibold text-foreground hover:text-primary-glow transition-colors block truncate">
                          {u.first_name} {u.last_name}
                        </Link>
                        <p className="text-xs text-muted-foreground">@{u.username}</p>
                      </div>
                    </div>

                    {u.headline && <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{u.headline}</p>}

                    {u.location && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                        <MapPin className="w-3 h-3" />{u.location}
                      </div>
                    )}

                    {isLoggedIn && u.id !== me?.id && (
                      <button onClick={() => handleFollow(u)} disabled={isFollowed || isFollowing}
                        className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium transition-all ${
                          isFollowed ? 'bg-secondary text-muted-foreground' : 'bg-primary-glow/10 text-primary-glow hover:bg-primary-glow/20'
                        }`}>
                        {isFollowing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : isFollowed ? <Check className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                        {isFollowed ? 'Following' : 'Follow'}
                      </button>
                    )}
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
