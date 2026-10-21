import { Link } from "react-router-dom";
import { Loader2, Calendar, Briefcase, Trophy, Tag, TrendingUp, Gift, ArrowRight } from "lucide-react";
import { useEvents } from "@/hooks/api/useEvents";
import { useOpportunities } from "@/hooks/api/useOpportunities";
import { useChallenges } from "@/hooks/api/useChallenges";
import { useLeaderboard } from "@/hooks/api/useLeaderboard";
import { useOffers } from "@/hooks/api/useOffers";

// ─── Shared card shell ──────────────────────────────────────────────────────
function Card({ title, icon: Icon, to, children }: { title: string; icon: any; to?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground flex items-center gap-2"><Icon className="w-4 h-4 text-primary-glow" /> {title}</h3>
        {to && <Link to={to} className="text-xs text-primary-glow hover:underline flex items-center gap-0.5">View all <ArrowRight className="w-3 h-3" /></Link>}
      </div>
      {children}
    </div>
  );
}

function Loading() { return <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-primary-glow" /></div>; }
function Empty({ text }: { text: string }) { return <p className="text-sm text-muted-foreground py-4 text-center">{text}</p>; }

// ─── Live widgets (all community-scoped) ────────────────────────────────────

export function UpcomingEventsWidget({ community }: { community: string }) {
  const { data, isLoading } = useEvents({ community, status: 'published' });
  const events = (data?.pages.flatMap((p) => p.data) ?? []).slice(0, 4);
  return (
    <Card title="Upcoming Events" icon={Calendar} to={`/${community}/events`}>
      {isLoading ? <Loading /> : events.length === 0 ? <Empty text="No upcoming events yet" /> : (
        <div className="space-y-0">
          {events.map((ev: any) => (
            <Link key={ev.id} to={`/events/${ev.id}`} className="flex items-center justify-between py-2 border-b border-border last:border-0 hover:bg-secondary/40 -mx-2 px-2 rounded transition-colors">
              <span className="text-sm text-foreground truncate">{ev.title}</span>
              <span className="text-xs text-muted-foreground whitespace-nowrap ms-2">{new Date(ev.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}

export function OpportunitiesWidget({ community, title = "Opportunities for You" }: { community: string; title?: string }) {
  const { data, isLoading } = useOpportunities({ community, status: 'open' });
  const opps = (data?.pages.flatMap((p) => p.data) ?? []).slice(0, 4);
  return (
    <Card title={title} icon={Briefcase} to={`/${community}/opportunities`}>
      {isLoading ? <Loading /> : opps.length === 0 ? <Empty text="No open opportunities yet" /> : (
        <div className="space-y-0">
          {opps.map((o: any) => (
            <Link key={o.id} to={`/${community}/opportunities`} className="flex items-center justify-between py-2 border-b border-border last:border-0 hover:bg-secondary/40 -mx-2 px-2 rounded transition-colors">
              <span className="text-sm text-foreground truncate">{o.title}{o.company ? ` — ${o.company}` : ''}</span>
              <span className="text-xs text-muted-foreground capitalize whitespace-nowrap ms-2">{o.type}</span>
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}

export function ChallengesWidget({ community, title = "Active Challenges" }: { community: string; title?: string }) {
  const { data, isLoading } = useChallenges({ community, status: 'open' });
  const challenges = (data?.pages.flatMap((p) => p.data) ?? []).slice(0, 3);
  return (
    <Card title={title} icon={Trophy} to={`/${community}/challenges`}>
      {isLoading ? <Loading /> : challenges.length === 0 ? <Empty text="No active challenges" /> : (
        <div className="space-y-3">
          {challenges.map((c: any) => (
            <Link key={c.id} to={`/challenges/${c.id}`} className="block p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
              <p className="text-sm font-medium text-foreground">{c.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {c.submissions_count} submissions{c.end_date ? ` · ends ${new Date(c.end_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}` : ''}
              </p>
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}

export function PerksWidget({ community }: { community: string }) {
  const { data, isLoading } = useOffers({ community });
  const offers = (data?.data ?? []).slice(0, 4);
  return (
    <Card title="Member Perks" icon={Gift} to={`/${community}/offers`}>
      {isLoading ? <Loading /> : offers.length === 0 ? <Empty text="No perks available yet" /> : (
        <div className="space-y-0">
          {offers.map((o) => (
            <Link key={o.id} to={`/${community}/offers`} className="flex items-center justify-between py-2 border-b border-border last:border-0 hover:bg-secondary/40 -mx-2 px-2 rounded transition-colors">
              <span className="text-sm text-foreground truncate">{o.title}</span>
              <span className="text-xs text-primary-glow whitespace-nowrap ms-2">{o.organization?.name}</span>
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}

export function LeaderboardWidget({ community }: { community: string }) {
  const { data, isLoading } = useLeaderboard({ community, period: 'week' });
  const entries = (data?.pages.flatMap((p) => p.data) ?? []).slice(0, 5);
  return (
    <Card title="Leaderboard (This Week)" icon={TrendingUp} to={`/${community}/leaderboard`}>
      {isLoading ? <Loading /> : entries.length === 0 ? <Empty text="No ranking data yet" /> : (
        <div className="space-y-0">
          {entries.map((e: any, i: number) => (
            <div key={e.id ?? i} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-freelance/10 text-freelance' : 'bg-muted text-muted-foreground'}`}>{i + 1}</div>
              <span className="text-sm font-medium text-foreground flex-1 truncate">{e.first_name} {e.last_name}</span>
              <span className="text-sm text-muted-foreground whitespace-nowrap">{(e.period_points ?? e.points_total ?? 0).toLocaleString()} pts</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
