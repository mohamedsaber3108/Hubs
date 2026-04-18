import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Trophy, Medal, Star, Loader2, Crown } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useLeaderboard, useMyLeaderboardStats } from "@/hooks/api/useLeaderboard";
import { useCommunities } from "@/hooks/api/useCommunities";
import { useAuth } from "@/contexts/AuthContext";

const PERIODS = [
  { key: 'all_time', label: 'All Time' },
  { key: 'month',    label: 'This Month' },
  { key: 'week',     label: 'This Week' },
];

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Crown className="w-5 h-5 text-yellow-400" />;
  if (rank === 2) return <Medal className="w-5 h-5 text-slate-400" />;
  if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
  return <span className="text-sm font-bold text-muted-foreground w-5 text-center">#{rank}</span>;
}

export default function Leaderboard() {
  const { community }       = useParams<{ community: string }>();
  const [period, setPeriod] = useState('all_time');
  const { user }            = useAuth();
  const { data: commData }  = useCommunities();

  const params = { period, community };
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useLeaderboard(params);
  const { data: myStats } = useMyLeaderboardStats(period);

  const entries = data?.pages.flatMap((p) => p.data) ?? [];
  const activeCommunity = commData?.find((c) => c.slug === community);

  return (
    <>
      <Navbar />
      <main className="page-enter pt-20 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-400/10 mb-4">
              <Trophy className="w-8 h-8 text-yellow-400" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">
              {activeCommunity ? `${activeCommunity.emoji} ${activeCommunity.name}` : 'Global'} Leaderboard
            </h1>
            <p className="text-muted-foreground mt-2">Top contributors ranked by points</p>
          </div>

          {/* My stats banner */}
          {user && myStats && (
            <div className="bg-card border border-border rounded-xl p-4 mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.first_name}&background=14b8a6&color=fff`} alt="" className="w-10 h-10 rounded-full object-cover" />
                <div>
                  <p className="font-semibold text-foreground text-sm">{user.first_name} {user.last_name}</p>
                  <p className="text-xs text-muted-foreground">Your current rank: <span className="text-primary-glow font-bold">#{myStats.rank}</span></p>
                </div>
              </div>
              <div className="text-end">
                <p className="text-2xl font-bold text-primary-glow">{(period === 'all_time' ? myStats.total_points : myStats.period_points)?.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">points</p>
              </div>
            </div>
          )}

          {/* Period selector */}
          <div className="flex gap-2 mb-6">
            {PERIODS.map((p) => (
              <button key={p.key} onClick={() => setPeriod(p.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${period === p.key ? 'bg-primary-glow text-primary-foreground' : 'bg-card border border-border text-muted-foreground hover:text-foreground'}`}>
                {p.label}
              </button>
            ))}
          </div>

          {/* List */}
          {isLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary-glow" /></div>
          ) : (
            <div className="space-y-2">
              {entries.map((entry) => (
                <Link key={entry.id} to={`/profile/${entry.username}`}
                  className={`flex items-center gap-4 p-4 rounded-xl border transition-all hover:border-primary-glow/30 ${entry.rank <= 3 ? 'bg-card' : 'bg-background'} ${user?.id === entry.id ? 'border-primary-glow/50 bg-primary-glow/5' : 'border-border'}`}>
                  <div className="w-8 flex items-center justify-center flex-shrink-0">
                    <RankIcon rank={entry.rank} />
                  </div>
                  <img src={entry.avatar_url || `https://ui-avatars.com/api/?name=${entry.first_name}&background=14b8a6&color=fff`} alt="" className="w-10 h-10 rounded-full object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm truncate">{entry.first_name} {entry.last_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{entry.headline || `@${entry.username}`}</p>
                  </div>
                  <div className="text-end flex-shrink-0">
                    <p className="font-bold text-primary-glow">{(period === 'all_time' ? entry.points_total : entry.period_points)?.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">pts</p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {hasNextPage && (
            <div className="text-center mt-6">
              <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage} className="px-6 py-2.5 border border-border rounded-lg text-sm text-muted-foreground hover:text-foreground hover:border-primary-glow/30 transition-all">
                {isFetchingNextPage ? <Loader2 className="w-4 h-4 animate-spin inline" /> : 'Load more'}
              </button>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
