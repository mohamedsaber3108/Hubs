import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, MapPin, Video, Users, Check, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { COMMUNITIES } from "@/lib/communities";
import { Button } from "@/components/ui/button";
import { useEvent, useRsvpMutation } from "@/hooks/api/useEvents";
import { useAuth } from "@/contexts/AuthContext";

function formatDate(s: string) { return new Date(s).toLocaleDateString("en", { weekday: "long", year: "numeric", month: "long", day: "numeric" }); }
function formatTime(s: string) { return new Date(s).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" }); }

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const eventId = id ? parseInt(id) : 0;
  const { data, isLoading, error } = useEvent(eventId);
  const rsvpMutation = useRsvpMutation();

  if (isLoading) return (
    <><Navbar /><div className="page-enter pt-20 flex justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-primary-glow" /></div></>
  );

  if (error || !data?.event) return (
    <><Navbar /><main className="page-enter pt-20 pb-16 container mx-auto px-4 text-center">
      <p className="text-muted-foreground">Event not found.</p>
      <Link to="/events" className="text-primary-glow hover:underline text-sm mt-2 inline-block">← Back to Events</Link>
    </main></>
  );

  const event = data.event;
  const myRsvp = data.user_rsvp;
  const comm = COMMUNITIES.find((c) => c.id === event.community?.slug);
  const pct = event.capacity ? Math.round(((event.attendees_count ?? 0) / event.capacity) * 100) : 0;
  const isFull = event.capacity ? (event.attendees_count ?? 0) >= event.capacity : false;

  const handleRsvp = (status: 'going' | 'maybe' | 'not_going') => {
    rsvpMutation.mutate({ id: eventId, status });
  };

  return (
    <>
      <Navbar />
      <main className="page-enter pt-20 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <Link to="/events" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to Events
          </Link>

          {event.cover_url && (
            <img src={event.cover_url} alt={event.title} className="w-full h-64 object-cover rounded-2xl mb-6" />
          )}

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Main */}
            <div className="flex-1 min-w-0 space-y-6">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="text-xs px-2.5 py-1 rounded-full bg-primary-glow/10 text-primary-glow font-medium capitalize">{event.type}</span>
                  {comm && <span className="text-xs text-muted-foreground">{comm.emoji} {comm.name}</span>}
                </div>
                <h1 className="text-3xl font-bold text-foreground mb-4">{event.title}</h1>
                <div className="grid sm:grid-cols-2 gap-3 text-sm text-muted-foreground mb-6">
                  <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-primary-glow" />{formatDate(event.start_date)}</div>
                  <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-primary-glow" />{formatTime(event.start_date)}</div>
                  {event.location && <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-primary-glow" />{event.location}</div>}
                  {event.meeting_url && <div className="flex items-center gap-2"><Video className="w-4 h-4 text-primary-glow" />Online Event</div>}
                </div>
                {event.description && (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{event.description}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <aside className="lg:w-72 shrink-0 space-y-4">
              <div className="bg-card border border-border rounded-2xl p-5">
                {/* Attendees */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                  <Users className="w-4 h-4" />
                  <span>{event.attendees_count ?? 0}{event.capacity ? ` / ${event.capacity}` : ''} attending</span>
                </div>
                {event.capacity && (
                  <div className="w-full bg-secondary rounded-full h-1.5 mb-4">
                    <div className="bg-primary-glow h-1.5 rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                )}

                {/* RSVP buttons */}
                {user ? (
                  <div className="space-y-2">
                    {(['going', 'maybe', 'not_going'] as const).map((s) => (
                      <button key={s} onClick={() => handleRsvp(s)} disabled={rsvpMutation.isPending || (s === 'going' && isFull && myRsvp?.status !== 'going')}
                        className={`w-full py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                          myRsvp?.status === s ? 'bg-primary-glow text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground disabled:opacity-40'}`}>
                        {myRsvp?.status === s && <Check className="w-4 h-4" />}
                        {rsvpMutation.isPending && rsvpMutation.variables?.status === s ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        {s === 'going' ? '✓ Going' : s === 'maybe' ? '? Maybe' : '✗ Not Going'}
                      </button>
                    ))}
                  </div>
                ) : (
                  <Link to="/auth/signin" className="block w-full py-2.5 rounded-xl bg-primary-glow text-primary-foreground text-sm font-medium text-center hover:bg-primary-glow/90 transition-all">
                    Sign in to RSVP
                  </Link>
                )}
              </div>

              {/* Organiser */}
              {event.organizer && (
                <div className="bg-card border border-border rounded-2xl p-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Organiser</p>
                  <div className="flex items-center gap-2.5">
                    <img src={event.organizer.avatar_url || `https://ui-avatars.com/api/?name=${event.organizer.first_name}&background=14b8a6&color=fff&size=32`} alt="" className="w-8 h-8 rounded-full object-cover" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{event.organizer.first_name} {event.organizer.last_name}</p>
                      <p className="text-xs text-muted-foreground">@{event.organizer.username}</p>
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
