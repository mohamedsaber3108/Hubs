import { useState } from "react";
import { Link } from "react-router-dom";
import {
  LayoutDashboard, Users, Calendar, Briefcase, MessageSquare, Bell,
  Settings, ChevronLeft, ChevronRight, LogOut, Search, Plus,
  Trophy, BookOpen, Zap, Star, GraduationCap, Bot, Heart,
  TrendingUp, Target, Rocket, Award,
} from "lucide-react";
import USAMLogo from "@/components/USAMLogo";
import DarkModeToggle from "@/components/DarkModeToggle";
import NotificationPanel from "@/components/NotificationPanel";
import { COMMUNITIES } from "@/lib/communities";
import { useAuth } from "@/contexts/AuthContext";

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

function FreelanceContent() {
  return (
    <div className="space-y-6 page-enter">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Active Gigs", value: "12", color: "text-freelance" },
          { label: "Proposals Sent", value: "8", color: "text-primary-glow" },
          { label: "Earnings (MTD)", value: "$3,240", color: "text-launchpad" },
          { label: "Rating", value: "4.9★", color: "text-freelance" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-5">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-semibold text-foreground mb-4">🏆 Active Challenge</h3>
          <div className="p-4 rounded-lg bg-freelance/5 border border-freelance/20">
            <div className="font-medium text-foreground">Design a Community Logo</div>
            <div className="text-sm text-muted-foreground mt-1">Deadline in 3 days</div>
            <div className="w-full h-2 bg-muted rounded-full mt-3">
              <div className="h-full bg-freelance rounded-full" style={{ width: "65%" }} />
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-semibold text-foreground mb-4">💼 Recommended Opportunities</h3>
          {["Senior UI Designer — Remote", "Brand Identity — Dubai", "React Developer — Cairo"].map((opp) => (
            <div key={opp} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <span className="text-sm text-foreground">{opp}</span>
              <Button variant="ghost" size="sm" className="text-primary-glow">View</Button>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-semibold text-foreground mb-4">📅 Upcoming Events</h3>
          {[{ name: "Freelancer Meetup Dubai", date: "Mar 15" }, { name: "Design Sprint Workshop", date: "Mar 22" }].map((ev) => (
            <div key={ev.name} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <span className="text-sm text-foreground">{ev.name}</span>
              <span className="text-xs text-muted-foreground">{ev.date}</span>
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-semibold text-foreground mb-4">👥 Suggested Connections</h3>
          {[{ name: "Ahmed K.", role: "React Developer" }, { name: "Yasmin E.", role: "Copywriter" }].map((conn) => (
            <div key={conn.name} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div>
                <div className="text-sm font-medium text-foreground">{conn.name}</div>
                <div className="text-xs text-muted-foreground">{conn.role}</div>
              </div>
              <Button variant="outline" size="sm">Connect</Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StudentContent() {
  return (
    <div className="space-y-6 page-enter">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Your Rank", value: "#12", color: "text-primary-glow" },
          { label: "Points", value: "2,900", color: "text-launchpad" },
          { label: "Events Joined", value: "31", color: "text-hrconnect" },
          { label: "Club Members", value: "156", color: "text-freelance" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-5">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-semibold text-foreground mb-4">🏆 Upcoming Competition</h3>
          <div className="p-4 rounded-lg bg-primary-glow/5 border border-primary-glow/20">
            <div className="font-medium text-foreground">Arab Innovation Challenge 2025</div>
            <div className="text-sm text-muted-foreground mt-1">Registration closes in 5 days</div>
            <Button size="sm" className="mt-3 bg-primary-glow text-primary-foreground">Register</Button>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-semibold text-foreground mb-4">📢 New Initiative</h3>
          <div className="p-4 rounded-lg bg-secondary">
            <div className="font-medium text-foreground">Mental Health Awareness Week</div>
            <div className="text-sm text-muted-foreground mt-1">AUB Student Council</div>
            <Button variant="outline" size="sm" className="mt-3">Learn More</Button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="font-semibold text-foreground mb-4">🏅 Leaderboard (This Week)</h3>
        {[
          { rank: 1, name: "Layla M.", pts: 450 },
          { rank: 2, name: "Omar F.", pts: 380 },
          { rank: 3, name: "Nour H.", pts: 320 },
        ].map((entry) => (
          <div key={entry.rank} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${entry.rank === 1 ? "bg-freelance/10 text-freelance" : "bg-muted text-muted-foreground"}`}>
              {entry.rank}
            </div>
            <span className="text-sm font-medium text-foreground flex-1">{entry.name}</span>
            <span className="text-sm text-muted-foreground">{entry.pts} pts</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HRContent() {
  return (
    <div className="space-y-6 page-enter">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Job Posts", value: "6", color: "text-hrconnect" },
          { label: "Applications", value: "142", color: "text-primary-glow" },
          { label: "Interviews", value: "18", color: "text-launchpad" },
          { label: "Hires (MTD)", value: "3", color: "text-freelance" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-5">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="font-semibold text-foreground mb-2">Share an HR insight...</h3>
        <textarea
          className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground input-glow focus:outline-none resize-none text-sm"
          rows={3}
          placeholder="What's on your mind?"
        />
        <Button size="sm" className="mt-2 bg-primary-glow text-primary-foreground">Post</Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-semibold text-foreground mb-4">🔥 Trending HR Topic</h3>
          <div className="p-4 rounded-lg bg-hrconnect/5 border border-hrconnect/20">
            <div className="font-medium text-foreground">AI in Recruitment: Friend or Foe?</div>
            <div className="text-sm text-muted-foreground mt-1">47 comments · 12 shares</div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-semibold text-foreground mb-4">🎓 Upcoming Webinar</h3>
          <div className="p-4 rounded-lg bg-secondary">
            <div className="font-medium text-foreground">Building Employer Brand in MENA</div>
            <div className="text-sm text-muted-foreground mt-1">Mar 18 · 2:00 PM GST</div>
            <Button variant="outline" size="sm" className="mt-3">Register</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function LaunchPadContent() {
  return (
    <div className="space-y-6 page-enter">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Events This Month", value: "8", color: "text-launchpad" },
          { label: "Connections", value: "98", color: "text-primary-glow" },
          { label: "Skills Gained", value: "12", color: "text-hrconnect" },
          { label: "Points", value: "1,200", color: "text-freelance" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-5">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="font-semibold text-foreground mb-4">🧭 Mentor of the Week</h3>
        <div className="flex items-center gap-4 p-4 rounded-lg bg-launchpad/5 border border-launchpad/20">
          <div className="w-14 h-14 rounded-full bg-launchpad/20 flex items-center justify-center text-2xl">🌟</div>
          <div>
            <div className="font-medium text-foreground">Ahmed Khalil</div>
            <div className="text-sm text-muted-foreground">Full-Stack Developer · 567 connections</div>
            <Button size="sm" className="mt-2 bg-launchpad text-primary-foreground hover:bg-launchpad/90">Request Mentorship</Button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="font-semibold text-foreground mb-4">📅 Upcoming Events</h3>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {[
            { name: "Career Fair 2025", date: "Mar 12", color: "bg-launchpad/10 border-launchpad/20" },
            { name: "Startup Pitch Night", date: "Mar 18", color: "bg-freelance/10 border-freelance/20" },
            { name: "Resume Workshop", date: "Mar 22", color: "bg-hrconnect/10 border-hrconnect/20" },
            { name: "Networking Mixer", date: "Mar 28", color: "bg-primary-glow/10 border-primary-glow/20" },
          ].map((ev) => (
            <div key={ev.name} className={`min-w-[160px] p-4 rounded-lg border ${ev.color} shrink-0`}>
              <div className="text-sm font-medium text-foreground">{ev.name}</div>
              <div className="text-xs text-muted-foreground mt-1">{ev.date}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-semibold text-foreground mb-4">🎯 Opportunities for You</h3>
          {["Junior Developer — TechCo", "Data Intern — DataHub", "Marketing Assistant — BrandX"].map((opp) => (
            <div key={opp} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <span className="text-sm text-foreground">{opp}</span>
              <Button variant="ghost" size="sm" className="text-primary-glow">Apply</Button>
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-semibold text-foreground mb-4">🚀 My Journey</h3>
          <div className="space-y-3">
            {[
              { text: "Completed: Interview Prep", done: true },
              { text: "In Progress: Build Portfolio", done: false },
              { text: "Next: Network with 5 professionals", done: false },
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${step.done ? "bg-launchpad text-primary-foreground" : "border border-border"}`}>
                  {step.done && "✓"}
                </div>
                <span className={step.done ? "text-muted-foreground line-through" : "text-foreground"}>{step.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const CONTENT_MAP: Record<string, () => JSX.Element> = {
  freelancespace: FreelanceContent,
  studentzone: StudentContent,
  hrconnect: HRContent,
  launchpad: LaunchPadContent,
};

export default function Dashboard() {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [activeCommunity, setActiveCommunity] = useState<string>(COMMUNITIES[0].id);
  const [activeNav, setActiveNav] = useState("Home");
  const [searchOpen, setSearchOpen] = useState(false);

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
                <button key={c.id} onClick={() => { setActiveCommunity(c.id); setActiveNav("Home"); }}
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
                <button key={c.id} onClick={() => { setActiveCommunity(c.id); setActiveNav("Home"); }}
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

          <ContentComponent />
        </main>
      </div>
    </div>
  );
}
