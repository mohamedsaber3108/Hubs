import { Link } from "react-router-dom";
import {
  LayoutDashboard, Users, Calendar, Briefcase, MessageSquare, Bell,
  Settings, ChevronLeft, ChevronRight, LogOut, Search, Plus,
  Trophy, BookOpen, Zap, Star, GraduationCap, Bot, Heart,
  TrendingUp, Target, Rocket, Award,
} from "lucide-react";
import { useEffect, useState } from "react";
import USAMLogo from "@/components/USAMLogo";
import DarkModeToggle from "@/components/DarkModeToggle";
import NotificationPanel from "@/components/NotificationPanel";
import { COMMUNITIES } from "@/lib/communities";
import { useAuth } from "@/contexts/AuthContext";
import { useRecommendedCommunities } from "@/hooks/api/useCommunities";
import {
  UpcomingEventsWidget, OpportunitiesWidget, ChallengesWidget, PerksWidget, LeaderboardWidget,
} from "@/components/dashboard/DashboardWidgets";

import { Button } from "@/components/ui/button";

const COMMUNITY_NAV: Record<string, { label: string; icon: any }[]> = {
  freelancespace: [
    { label: "Home", icon: LayoutDashboard },
    { label: "Feed", icon: MessageSquare },
    { label: "Portfolio", icon: Briefcase },
    { label: "Groups", icon: Users },
    { label: "Events", icon: Calendar },
    { label: "Challenges", icon: Trophy },
    { label: "Opportunities", icon: Target },
    { label: "Mentors", icon: Star },
    { label: "Resources", icon: BookOpen },
    { label: "Spotlight", icon: Zap },
    { label: "Settings", icon: Settings },
  ],
  studentzone: [
    { label: "Home", icon: LayoutDashboard },
    { label: "Feed", icon: MessageSquare },
    { label: "My Org", icon: Users },
    { label: "Events", icon: Calendar },
    { label: "Competitions", icon: Trophy },
    { label: "Initiatives", icon: Heart },
    { label: "Leaderboard", icon: TrendingUp },
    { label: "Nomad AI", icon: Bot },
    { label: "Resources", icon: BookOpen },
    { label: "Spotlight", icon: Zap },
  ],
  hrconnect: [
    { label: "Home", icon: LayoutDashboard },
    { label: "Feed", icon: MessageSquare },
    { label: "Groups", icon: Users },
    { label: "Events", icon: Calendar },
    { label: "Challenges", icon: Trophy },
    { label: "Opportunities", icon: Briefcase },
    { label: "Candidates", icon: GraduationCap },
    { label: "Resources", icon: BookOpen },
    { label: "HR Spotlight", icon: Zap },
    { label: "Settings", icon: Settings },
  ],
  launchpad: [
    { label: "Home", icon: LayoutDashboard },
    { label: "Feed", icon: MessageSquare },
    { label: "Events", icon: Calendar },
    { label: "Opportunities", icon: Target },
    { label: "Mentors", icon: Star },
    { label: "Groups", icon: Users },
    { label: "Challenges", icon: Trophy },
    { label: "My Journey", icon: Rocket },
    { label: "Resources", icon: BookOpen },
    { label: "Spotlight", icon: Zap },
  ],
};

const WELCOME_MESSAGES: Record<string, (name: string) => string> = {
  freelancespace: (n) => `Good morning ${n}! You have 3 new messages and 5 new opportunities`,
  studentzone: (n) => `Welcome, ${n}! Here's what's happening in your campus network`,
  hrconnect: (n) => `Hello ${n}. Community health: 24 active discussions`,
  launchpad: (n) => `Hey ${n} 👋 Ready to level up today?`,
};

// Each community's dashboard composes the SAME live, community-scoped widgets
// (real API data — events, opportunities, challenges, perks, leaderboard) but
// in a DIFFERENT arrangement + emphasis, so a recruiter and a student see
// genuinely different, data-backed home experiences. All data is fetched by
// the widgets themselves (DashboardWidgets.tsx), scoped to `community`.

function FreelanceContent({ community }: { community: string }) {
  return (
    <div className="space-y-6 page-enter">
      <div className="grid gap-6 md:grid-cols-2">
        <OpportunitiesWidget community={community} title="Gigs & Projects" />
        <ChallengesWidget community={community} />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <PerksWidget community={community} />
        <UpcomingEventsWidget community={community} />
      </div>
    </div>
  );
}

function StudentContent({ community }: { community: string }) {
  return (
    <div className="space-y-6 page-enter">
      <div className="grid gap-6 md:grid-cols-2">
        <ChallengesWidget community={community} title="Competitions" />
        <UpcomingEventsWidget community={community} />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <LeaderboardWidget community={community} />
        <PerksWidget community={community} />
      </div>
    </div>
  );
}

function HRContent({ community }: { community: string }) {
  return (
    <div className="space-y-6 page-enter">
      <div className="grid gap-6 md:grid-cols-2">
        <OpportunitiesWidget community={community} title="Open Roles You Posted" />
        <UpcomingEventsWidget community={community} />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <ChallengesWidget community={community} title="Talent Challenges" />
        <PerksWidget community={community} />
      </div>
    </div>
  );
}

function LaunchPadContent({ community }: { community: string }) {
  return (
    <div className="space-y-6 page-enter">
      <div className="grid gap-6 md:grid-cols-2">
        <OpportunitiesWidget community={community} title="Internships & Entry Roles" />
        <UpcomingEventsWidget community={community} />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <ChallengesWidget community={community} />
        <PerksWidget community={community} />
      </div>
      <LeaderboardWidget community={community} />
    </div>
  );
}

const CONTENT_MAP: Record<string, (props: { community: string }) => JSX.Element> = {
  freelancespace: FreelanceContent,
  studentzone: StudentContent,
  hrconnect: HRContent,
  launchpad: LaunchPadContent,
};

export default function Dashboard() {
  const { user } = useAuth();
  const { data: recs } = useRecommendedCommunities();
  const [collapsed, setCollapsed] = useState(false);
  const [activeCommunity, setActiveCommunity] = useState<string>(COMMUNITIES[0].id);
  const [activeNav, setActiveNav] = useState("Home");
  const [searchOpen, setSearchOpen] = useState(false);
  // userTouched: once the user manually picks a space, stop auto-selecting so
  // we don't yank them off the community they chose when recommendations load.
  const [userTouched, setUserTouched] = useState(false);

  // Default the active space to the user's top persona-recommended community.
  // Only applies to the known four spaces the dashboard renders content for,
  // and only until the user interacts with the switcher.
  useEffect(() => {
    if (userTouched || !recs?.personalized) return;
    const top = recs.communities.find(
      (c) => c.match_score > 0 && COMMUNITIES.some((k) => k.id === c.slug),
    );
    if (top) setActiveCommunity(top.slug);
  }, [recs, userTouched]);

  const selectCommunity = (id: string) => {
    setUserTouched(true);
    setActiveCommunity(id);
    setActiveNav("Home");
  };

  const currentCommunity = COMMUNITIES.find((c) => c.id === activeCommunity)!;
  const navItems = COMMUNITY_NAV[activeCommunity] || COMMUNITY_NAV.freelancespace;
  const ContentComponent = CONTENT_MAP[activeCommunity] || FreelanceContent;
  const welcomeMsg = WELCOME_MESSAGES[activeCommunity]?.(user?.first_name || "there") || "";

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className={`${collapsed ? "w-16" : "w-64"} bg-sidebar text-sidebar-foreground flex flex-col transition-all duration-300 shrink-0 border-r border-sidebar-border`}>
        <div className="h-14 flex items-center justify-center border-b border-sidebar-border px-3">
          {!collapsed ? (
            <Link to="/"><USAMLogo size="sm" /></Link>
          ) : (
            <Link to="/" className="text-lg font-bold text-sidebar-primary">U</Link>
          )}
        </div>

        {/* Community switcher */}
        <div className="p-2 border-b border-sidebar-border">
          {collapsed ? (
            <div className="flex flex-col items-center gap-1">
              {COMMUNITIES.map((c) => (
                <button key={c.id} onClick={() => selectCommunity(c.id)}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-colors ${activeCommunity === c.id ? "bg-sidebar-accent" : "hover:bg-sidebar-accent/50"}`}
                  title={c.name}
                >
                  {c.emoji}
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-0.5">
              <span className="text-[10px] text-sidebar-foreground/40 uppercase tracking-wider px-2">Spaces</span>
              {COMMUNITIES.map((c) => (
                <button key={c.id} onClick={() => selectCommunity(c.id)}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${activeCommunity === c.id ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/50 text-sidebar-foreground/70"}`}
                >
                  <span>{c.emoji}</span><span>{c.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            // Link Feed and Groups to actual routes
            const linkTo = item.label === "Feed" ? `/${activeCommunity}/feed`
              : item.label === "Groups" ? `/${activeCommunity}/groups`
              : undefined;
            const Wrapper = linkTo ? Link : "button" as any;
            return (
              <Wrapper key={item.label} to={linkTo} onClick={() => setActiveNav(item.label)}
                className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  activeNav === item.label ? "bg-sidebar-primary text-sidebar-primary-foreground" : "hover:bg-sidebar-accent/50 text-sidebar-foreground/70"
                }`}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Wrapper>
            );
          })}
        </nav>

        {/* User card */}
        <div className="p-2 border-t border-sidebar-border">
          <Link to={`/profile/${user?.username ?? ''}`}>
            {collapsed ? (
              <div className="w-10 h-10 rounded-full overflow-hidden mx-auto">
                <img src={user?.avatar_url || `https://ui-avatars.com/api/?name=${user?.first_name ?? 'U'}&background=14b8a6&color=fff&size=40`} alt="" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-sidebar-accent/50 transition-colors">
                <div className="w-8 h-8 rounded-full overflow-hidden shrink-0">
                  <img src={user?.avatar_url || `https://ui-avatars.com/api/?name=${user?.first_name ?? 'U'}&background=14b8a6&color=fff&size=32`} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-medium truncate text-sidebar-foreground">{user?.first_name} {user?.last_name}</div>
                  <div className="text-[10px] text-sidebar-foreground/50 truncate">@{user?.username}</div>
                </div>
              </div>
            )}
          </Link>
        </div>

        <button onClick={() => setCollapsed(!collapsed)}
          className="h-9 flex items-center justify-center border-t border-sidebar-border hover:bg-sidebar-accent/50 transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>USAM Hub</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground font-medium">{currentCommunity.emoji} {currentCommunity.name}</span>
            <ChevronRight className="w-3 h-3" />
            <span>{activeNav}</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className={`relative transition-all ${searchOpen ? "w-64" : "w-9"}`}>
              {searchOpen ? (
                <input
                  autoFocus
                  onBlur={() => setSearchOpen(false)}
                  className="w-full px-3 py-1.5 text-sm border border-input rounded-lg bg-background text-foreground input-glow focus:outline-none"
                  placeholder="Search..."
                />
              ) : (
                <Link to="/search" className="p-2 rounded-lg hover:bg-secondary transition-colors">
                  <Search className="w-4 h-4 text-muted-foreground" />
                </Link>
              )}
            </div>

            <Link to="/messages" className="p-2 rounded-lg hover:bg-secondary transition-colors">
              <MessageSquare className="w-4 h-4 text-muted-foreground" />
            </Link>

            <button className="p-2 rounded-lg hover:bg-secondary transition-colors">
              <Plus className="w-4 h-4 text-muted-foreground" />
            </button>

            <DarkModeToggle />

            <NotificationPanel />

            <Link to={`/profile/${user?.username ?? ''}`} className="w-8 h-8 rounded-full overflow-hidden">
              <img src={user?.avatar_url || `https://ui-avatars.com/api/?name=${user?.first_name ?? 'U'}&background=14b8a6&color=fff&size=32`} alt="" className="w-full h-full object-cover" />
            </Link>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-auto">
          {/* Welcome */}
          <div className="mb-6">
            <h1 className="text-xl font-bold text-foreground">{currentCommunity.emoji} {currentCommunity.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">{welcomeMsg}</p>
          </div>

          {/* Quick actions */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {activeCommunity === "freelancespace" && (
              <>
                <Button size="sm" className="bg-primary-glow text-primary-foreground"><Plus className="w-3 h-3 mr-1" />Post</Button>
                <Button size="sm" variant="outline"><Briefcase className="w-3 h-3 mr-1" />Add Project</Button>
                <Button size="sm" variant="outline"><Target className="w-3 h-3 mr-1" />Browse Gigs</Button>
                <Button size="sm" variant="outline"><Trophy className="w-3 h-3 mr-1" />Join Challenge</Button>
              </>
            )}
            {activeCommunity === "studentzone" && (
              <>
                <Button size="sm" className="bg-primary-glow text-primary-foreground"><Plus className="w-3 h-3 mr-1" />Post</Button>
                <Button size="sm" variant="outline"><Calendar className="w-3 h-3 mr-1" />Create Event</Button>
                <Button size="sm" variant="outline"><Trophy className="w-3 h-3 mr-1" />Competitions</Button>
              </>
            )}
            {activeCommunity === "hrconnect" && (
              <>
                <Button size="sm" className="bg-primary-glow text-primary-foreground"><Plus className="w-3 h-3 mr-1" />Post Insight</Button>
                <Button size="sm" variant="outline"><Briefcase className="w-3 h-3 mr-1" />Post Job</Button>
                <Button size="sm" variant="outline"><Calendar className="w-3 h-3 mr-1" />Events</Button>
              </>
            )}
            {activeCommunity === "launchpad" && (
              <>
                <Button size="sm" className="bg-primary-glow text-primary-foreground"><Plus className="w-3 h-3 mr-1" />Post</Button>
                <Button size="sm" variant="outline"><Star className="w-3 h-3 mr-1" />Find Mentor</Button>
                <Button size="sm" variant="outline"><Target className="w-3 h-3 mr-1" />Opportunities</Button>
              </>
            )}
          </div>

          <ContentComponent community={activeCommunity} />
        </main>
      </div>
    </div>
  );
}
