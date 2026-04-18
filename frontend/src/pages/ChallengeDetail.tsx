import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Zap, Calendar, Users, Trophy, Upload, Loader2, Clock } from "lucide-react";
import Navbar from "@/components/Navbar";
import { COMMUNITIES } from "@/lib/communities";
import { Button } from "@/components/ui/button";
import { useChallenge } from "@/hooks/api/useChallenges";
import { useAuth } from "@/contexts/AuthContext";

function timeLeft(deadline: string): string {
  const ms = new Date(deadline).getTime() - Date.now();
  if (ms <= 0) return "Closed";
  const days = Math.floor(ms / 86400000);
  if (days > 0) return `${days}d left`;
  const hours = Math.floor(ms / 3600000);
  return `${hours}h left`;
}

export default function ChallengeDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const challengeId = id ? parseInt(id) : 0;
  const { data, isLoading, error } = useChallenge(challengeId);

  if (isLoading) return (
    <><Navbar /><div className="page-enter pt-20 flex justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-primary-glow" /></div></>
  );

  if (error || !data?.challenge) return (
    <><Navbar /><main className="page-enter pt-20 pb-16 container mx-auto px-4 text-center">
      <p className="text-muted-foreground">Challenge not found.</p>
      <Link to="/challenges" className="text-primary-glow hover:underline text-sm mt-2 inline-block">← Back to Challenges</Link>
    </main></>
  );

  const ch = data.challenge;
  const mySubmission = data.my_submission;
  const comm = COMMUNITIES.find((c) => c.id === ch.community?.slug);
  const isOpen = ch.status === 'open';
  const hasDeadline = !!ch.deadline;

  const STATUS_COLORS: Record<string, string> = {
    open: 'bg-green-500/10 text-green-500',
    closed: 'bg-secondary text-muted-foreground',
    judging: 'bg-amber-500/10 text-amber-500',
    completed: 'bg-primary-glow/10 text-primary-glow',
  };

  return (
    <>
      <Navbar />
      <main className="page-enter pt-20 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <Link to="/challenges" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to Challenges
          </Link>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Main */}
            <div className="flex-1 min-w-0 space-y-6">
              <div className="bg-card border border-border rounded-2xl p-6">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${STATUS_COLORS[ch.status] || STATUS_COLORS.open}`}>{ch.status}</span>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-secondary text-muted-foreground capitalize">{ch.type}</span>
                  {comm && <span className="text-xs text-muted-foreground">{comm.emoji} {comm.name}</span>}
                </div>

                <h1 className="text-2xl font-bold text-foreground mb-2">{ch.title}</h1>
                {ch.description && <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{ch.description}</p>}

                {ch.tags && ch.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {ch.tags.map((tag: string) => (
                      <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">#{tag}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* My submission status */}
              {mySubmission && (
                <div className="bg-primary-glow/5 border border-primary-glow/20 rounded-2xl p-5">
                  <p className="text-sm font-semibold text-primary-glow mb-1">✓ You submitted an entry</p>
                  {mySubmission.content && <p className="text-sm text-muted-foreground line-clamp-2">{mySubmission.content}</p>}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <aside className="lg:w-64 shrink-0 space-y-4">
              <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
                {/* Stats */}
                {[
                  { icon: Users, label: 'Submissions', val: ch.submissions_count ?? 0 },
                  ch.points_reward && { icon: Trophy, label: 'Points reward', val: `${ch.points_reward} pts` },
                  hasDeadline && { icon: Clock, label: 'Deadline', val: timeLeft(ch.deadline) },
                  hasDeadline && { icon: Calendar, label: 'Closes', val: new Date(ch.deadline).toLocaleDateString() },
                ].filter(Boolean).map((item: any) => (
                  <div key={item.label} className="flex items-center gap-3 text-sm">
                    <item.icon className="w-4 h-4 text-primary-glow flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                      <p className="font-medium text-foreground">{item.val}</p>
                    </div>
                  </div>
                ))}

                {/* Submit */}
                {user && isOpen && !mySubmission && (
                  <Link to={`/challenges/${ch.id}/submit`}
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-primary-glow text-primary-foreground text-sm font-semibold hover:bg-primary-glow/90 transition-all">
                    <Upload className="w-4 h-4" /> Submit Entry
                  </Link>
                )}
                {!user && isOpen && (
                  <Link to="/auth/signin"
                    className="block w-full py-2.5 rounded-xl bg-primary-glow text-primary-foreground text-sm font-medium text-center hover:bg-primary-glow/90 transition-all">
                    Sign in to Submit
                  </Link>
                )}
              </div>

              {/* Creator */}
              {ch.creator && (
                <div className="bg-card border border-border rounded-2xl p-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Created by</p>
                  <div className="flex items-center gap-2.5">
                    <img src={ch.creator.avatar_url || `https://ui-avatars.com/api/?name=${ch.creator.first_name}&background=14b8a6&color=fff&size=32`} alt="" className="w-8 h-8 rounded-full object-cover" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{ch.creator.first_name} {ch.creator.last_name}</p>
                      <p className="text-xs text-muted-foreground">@{ch.creator.username}</p>
                    </div>
                  </div>
                </div>
              )}
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}
