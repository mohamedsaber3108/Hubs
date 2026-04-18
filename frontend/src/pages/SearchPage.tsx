import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Search, Loader2, Users, FileText, Calendar, Briefcase, BookOpen, Zap, Users2, Star } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useSearch } from "@/hooks/api/useSearch";

const TYPES = [
  { key: 'all',          label: 'All',          icon: Search },
  { key: 'users',        label: 'People',       icon: Users },
  { key: 'posts',        label: 'Posts',        icon: FileText },
  { key: 'events',       label: 'Events',       icon: Calendar },
  { key: 'groups',       label: 'Groups',       icon: Users2 },
  { key: 'opportunities',label: 'Jobs',         icon: Briefcase },
  { key: 'resources',    label: 'Resources',    icon: BookOpen },
  { key: 'challenges',   label: 'Challenges',   icon: Zap },
  { key: 'mentors',      label: 'Mentors',      icon: Star },
];

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery]   = useState(searchParams.get('q') || '');
  const [activeType, setActiveType] = useState(searchParams.get('type') || 'all');
  const { data, isLoading } = useSearch(query, activeType, 10);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setSearchParams({ q: query, type: activeType }); };
  const handleType = (t: string) => { setActiveType(t); setSearchParams({ q: query, type: t }); };

  return (
    <>
      <Navbar />
      <main className="page-enter pt-20 pb-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <h1 className="text-2xl font-bold text-foreground mb-6">Search</h1>

          <form onSubmit={handleSearch} className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Search people, posts, events, opportunities…"
              className="w-full pl-12 pr-4 py-3 border border-input rounded-xl bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary-glow/30 text-sm"
            />
          </form>

          {/* Type filters */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
            {TYPES.map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => handleType(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all flex-shrink-0 ${activeType === key ? 'bg-primary-glow text-primary-foreground' : 'bg-card border border-border text-muted-foreground hover:text-foreground'}`}>
                <Icon className="w-3.5 h-3.5" />{label}
              </button>
            ))}
          </div>

          {isLoading && <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary-glow" /></div>}

          {data && !isLoading && (
            <div className="space-y-8">
              {/* Users */}
              {data.users?.length ? (
                <section>
                  <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2"><Users className="w-4 h-4" /> People</h2>
                  <div className="space-y-2">
                    {data.users.map((u) => (
                      <Link key={u.id} to={`/profile/${u.username}`} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-primary-glow/30 transition-all">
                        <img src={u.avatar_url || `https://ui-avatars.com/api/?name=${u.first_name}&background=14b8a6&color=fff`} alt="" className="w-10 h-10 rounded-full object-cover" />
                        <div>
                          <p className="font-medium text-foreground text-sm">{u.first_name} {u.last_name}</p>
                          <p className="text-xs text-muted-foreground">@{u.username}{u.headline ? ` · ${u.headline}` : ''}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              ) : null}

              {/* Opportunities */}
              {data.opportunities?.length ? (
                <section>
                  <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2"><Briefcase className="w-4 h-4" /> Opportunities</h2>
                  <div className="space-y-2">
                    {data.opportunities.map((o) => (
                      <Link key={o.id} to={`/opportunities`} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-primary-glow/30 transition-all">
                        <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center"><Briefcase className="w-5 h-5 text-muted-foreground" /></div>
                        <div>
                          <p className="font-medium text-foreground text-sm">{o.title}</p>
                          <p className="text-xs text-muted-foreground">{o.company} · {o.location_type}</p>
                        </div>
                        {o.is_featured && <span className="ms-auto text-xs px-2 py-0.5 rounded-full bg-yellow-400/10 text-yellow-500">Featured</span>}
                      </Link>
                    ))}
                  </div>
                </section>
              ) : null}

              {/* Events */}
              {data.events?.length ? (
                <section>
                  <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2"><Calendar className="w-4 h-4" /> Events</h2>
                  <div className="space-y-2">
                    {data.events.map((e) => (
                      <Link key={e.id} to={`/events/${e.id}`} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-primary-glow/30 transition-all">
                        <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center"><Calendar className="w-5 h-5 text-muted-foreground" /></div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground text-sm truncate">{e.title}</p>
                          <p className="text-xs text-muted-foreground">{new Date(e.start_date).toLocaleDateString()} · {e.attendees_count} attending</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              ) : null}

              {/* Resources */}
              {data.resources?.length ? (
                <section>
                  <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2"><BookOpen className="w-4 h-4" /> Resources</h2>
                  <div className="space-y-2">
                    {data.resources.map((r) => (
                      <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
                        <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center"><BookOpen className="w-5 h-5 text-muted-foreground" /></div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground text-sm truncate">{r.title}</p>
                          <p className="text-xs text-muted-foreground">{r.type} · ⭐ {r.avg_rating} · {r.downloads_count} downloads</p>
                        </div>
                        {r.is_free && <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-500">Free</span>}
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}

              {data.total_hits === 0 && query.length >= 2 && (
                <div className="text-center py-16 text-muted-foreground">
                  <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No results for "{query}"</p>
                  <p className="text-sm mt-1">Try different keywords or filters</p>
                </div>
              )}
            </div>
          )}

          {!query && (
            <div className="text-center py-16 text-muted-foreground">
              <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Start typing to search</p>
              <p className="text-sm mt-1">Find people, posts, events, opportunities, and more</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
