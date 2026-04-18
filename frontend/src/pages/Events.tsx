import { useState, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { Calendar, Loader2, MapPin, Users, Clock, Video } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useEvents, useRsvpMutation } from "@/hooks/api/useEvents";
import { useAuth } from "@/contexts/AuthContext";
import type { Event } from "@/lib/types";

const TYPES = [{ key: 'all', label: 'All' }, { key: 'online', label: 'Online' }, { key: 'in_person', label: 'In-Person' }, { key: 'hybrid', label: 'Hybrid' }];

function EventCard({ event, onRsvp, isLoggedIn }: { event: Event; onRsvp: (status: 'going' | 'maybe' | 'not_going') => void; isLoggedIn: boolean }) {
  const isFull = event.max_attendees && event.attendees_count >= event.max_attendees;
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary-glow/30 transition-all group">
      {event.cover_image && (
        <div className="h-40 overflow-hidden">
          <img src={event.cover_image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        </div>
      )}
      <div className="p-5">
        <div className="flex items-start gap-3">
          <div className="w-14 flex-shrink-0 text-center">
            <div className="text-xs text-muted-foreground uppercase">{new Date(event.start_date).toLocaleDateString('en', { month: 'short' })}</div>
            <div className="text-2xl font-bold text-foreground leading-none">{new Date(event.start_date).getDate()}</div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground group-hover:text-primary-glow transition-colors line-clamp-2">{event.title}</h3>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(event.start_date).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}</span>
              <span className="flex items-center gap-1">
                {event.type === 'online' ? <Video className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                {event.type === 'online' ? 'Online' : event.location || 'In-Person'}
              </span>
            </div>
            <div className="flex items-center justify-between mt-3">
              <span className="flex items-center gap-1 text-xs text-muted-foreground"><Users className="w-3 h-3" />{event.attendees_count}{event.max_attendees ? `/${event.max_attendees}` : ''}</span>
              {isLoggedIn ? (
                event.rsvp_status === 'going' ? (
                  <span className="text-xs px-3 py-1.5 rounded-full bg-green-500/10 text-green-500">✓ Going</span>
                ) : isFull ? (
                  <span className="text-xs px-3 py-1.5 rounded-full bg-secondary text-muted-foreground">Full</span>
                ) : (
                  <button onClick={() => onRsvp('going')} className="text-xs px-3 py-1.5 rounded-full bg-primary-glow text-primary-foreground hover:bg-primary-glow/90 transition-colors">
                    {event.is_free ? 'Attend Free' : `Attend · $${event.price}`}
                  </button>
                )
              ) : (
                <Link to="/auth/signin" className="text-xs px-3 py-1.5 rounded-full bg-primary-glow text-primary-foreground">Sign in to RSVP</Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Events() {
  const { community }     = useParams<{ community: string }>();
  const { isLoggedIn }    = useAuth();
  const [type, setType]   = useState('all');
  const [upcoming, setUpcoming] = useState(true);

  const params = { community, type: type !== 'all' ? type : undefined, upcoming: upcoming ? 'true' : undefined };
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useEvents(params);
  const { mutate: rsvp } = useRsvpMutation();

  const events = data?.pages.flatMap((p) => p.data) ?? [];
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useCallback((node: HTMLDivElement | null) => {
    if (isFetchingNextPage) return;
    observerRef.current?.disconnect();
    if (!node) return;
    observerRef.current = new IntersectionObserver((e) => { if (e[0].isIntersecting && hasNextPage) fetchNextPage(); });
    observerRef.current.observe(node);
  }, [isFetchingNextPage, hasNextPage, fetchNextPage]);

  return (
    <>
      <Navbar />
      <main className="page-enter pt-20 pb-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Events</h1>
            <p className="text-muted-foreground mt-1">Workshops, webinars, hackathons, and meetups</p>
          </div>

          <div className="flex gap-2 mb-6 flex-wrap">
            {TYPES.map((t) => (
              <button key={t.key} onClick={() => setType(t.key)}
                className={`px-4 py-2 rounded-full text-sm transition-all ${type === t.key ? 'bg-primary-glow text-primary-foreground' : 'bg-card border border-border text-muted-foreground hover:text-foreground'}`}>
                {t.label}
              </button>
            ))}
            <button onClick={() => setUpcoming(!upcoming)}
              className={`ms-auto px-4 py-2 rounded-full text-sm transition-all ${upcoming ? 'bg-primary-glow/10 text-primary-glow' : 'bg-card border border-border text-muted-foreground'}`}>
              {upcoming ? 'Upcoming' : 'All Events'}
            </button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary-glow" /></div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.map((event) => (
                <EventCard key={event.id} event={event} isLoggedIn={isLoggedIn}
                  onRsvp={(status) => rsvp({ id: event.id, status })} />
              ))}
              {events.length === 0 && (
                <div className="col-span-full text-center py-16 text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No events found</p>
                  <p className="text-sm mt-1">{upcoming ? 'Check back later for upcoming events' : 'No events in this community yet'}</p>
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
