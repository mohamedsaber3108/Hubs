import { useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import USAMLogo from "./USAMLogo";
import DarkModeToggle from "./DarkModeToggle";
import LanguageToggle from "./LanguageToggle";
import { COMMUNITIES } from "@/lib/communities";
import { useLanguage } from "@/i18n/LanguageContext";

const COMMUNITY_DOTS: Record<string, string> = {
  freelancespace: "#ff8c42",
  studentzone: "#becfcf",
  hrconnect: "#5ab3ad",
  launchpad: "#27c93f",
};

const COMMUNITY_SLUGS = ["freelancespace", "studentzone", "hrconnect", "launchpad"] as const;

const SUB_NAV_LINKS: Record<string, { label: string; path: string }[]> = {
  freelancespace: [
    { label: "Home", path: "" },
    { label: "Feed", path: "/feed" },
    { label: "Portfolio", path: "/discover" },
    { label: "Groups", path: "/groups" },
    { label: "Events", path: "/events" },
    { label: "Challenges", path: "/challenges" },
    { label: "Opportunities", path: "/opportunities" },
    { label: "Mentors", path: "/mentors" },
    { label: "Resources", path: "/resources" },
  ],
  studentzone: [
    { label: "Home", path: "" },
    { label: "Feed", path: "/feed" },
    { label: "My Org", path: "/groups" },
    { label: "Events", path: "/events" },
    { label: "Competitions", path: "/challenges" },
    { label: "Initiatives", path: "/opportunities" },
    { label: "Leaderboard", path: "/leaderboard" },
    { label: "Nomad AI", path: "/discover" },
    { label: "Resources", path: "/resources" },
  ],
  hrconnect: [
    { label: "Home", path: "" },
    { label: "Feed", path: "/feed" },
    { label: "Groups", path: "/groups" },
    { label: "Events", path: "/events" },
    { label: "Challenges", path: "/challenges" },
    { label: "Opportunities", path: "/opportunities" },
    { label: "Candidates", path: "/discover" },
    { label: "Resources", path: "/resources" },
  ],
  launchpad: [
    { label: "Home", path: "" },
    { label: "Feed", path: "/feed" },
    { label: "Events", path: "/events" },
    { label: "Opportunities", path: "/opportunities" },
    { label: "Mentors", path: "/mentors" },
    { label: "Groups", path: "/groups" },
    { label: "Challenges", path: "/challenges" },
    { label: "My Journey", path: "/leaderboard" },
  ],
};

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [subNavKey, setSubNavKey] = useState(0);
  const location = useLocation();
  const { t } = useLanguage();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  const isLanding = location.pathname === "/";

  // Detect active community from URL
  const activeCommunity = useMemo(() => {
    const segments = location.pathname.split("/").filter(Boolean);
    if (segments.length > 0) {
      const slug = segments[0];
      if (COMMUNITY_SLUGS.includes(slug as any)) return slug;
    }
    return null;
  }, [location.pathname]);

  // Detect active sub-link
  const activeSubPath = useMemo(() => {
    if (!activeCommunity) return null;
    const rest = location.pathname.replace(`/${activeCommunity}`, "") || "";
    return rest;
  }, [activeCommunity, location.pathname]);

  // Bump subNavKey when community changes to retrigger stagger animation
  const prevCommunity = useMemo(() => activeCommunity, [activeCommunity]);
  useEffect(() => {
    setSubNavKey((k) => k + 1);
  }, [prevCommunity]);

  const showSubNav = !!activeCommunity;

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled || !isLanding
            ? "navbar-glass bg-[rgba(10,56,54,0.85)] shadow-lg border-b border-border/20"
            : "bg-transparent"
        }`}
      >
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className={`flex-shrink-0 transition-transform duration-300 ${scrolled ? "scale-90" : "scale-100"}`}>
            <USAMLogo size="sm" />
          </Link>

          {/* Community pills — desktop */}
          <div className="hidden lg:flex items-center gap-1">
            {COMMUNITIES.map((c) => {
              const isActive = activeCommunity === c.id;
              return (
                <Link
                  key={c.id}
                  to={`/${c.id}/feed`}
                  className={`nav-pill px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-0
                    ${isActive
                      ? "bg-white/12 border border-white/20 text-primary-foreground"
                      : "text-primary-foreground/80 hover:text-primary-foreground border border-transparent"
                    }`}
                >
                  <span
                    className="inline-block w-[7px] h-[7px] rounded-full flex-shrink-0 mr-1.5 transition-shadow duration-200"
                    style={{
                      background: COMMUNITY_DOTS[c.id],
                      boxShadow: isActive ? `0 0 6px ${COMMUNITY_DOTS[c.id]}` : "none",
                    }}
                  />
                  {c.name}
                </Link>
              );
            })}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            <LanguageToggle />
            <DarkModeToggle />
            <Link
              to="/auth/signin"
              className="px-4 py-2 rounded-lg text-sm font-medium text-primary-foreground/80 hover:text-primary-foreground transition-colors"
            >
              {t("signIn")}
            </Link>
            <Link
              to="/auth/signup"
              className="btn-shimmer px-4 py-2 rounded-lg text-sm font-semibold text-primary-foreground transition-all duration-300 hover:scale-[1.03] hover:shadow-lg hover:shadow-primary-glow/20 active:scale-[0.96]"
              style={{ background: "linear-gradient(135deg, #0a3836, #14776e)" }}
            >
              {t("signUp")}
            </Link>
          </div>

          {/* Mobile hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <DarkModeToggle />
            <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2" aria-label="Toggle menu">
              {mobileOpen ? (
                <X className="w-6 h-6 text-primary-foreground" />
              ) : (
                <Menu className="w-6 h-6 text-primary-foreground" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Sub-navigation bar */}
      {showSubNav && activeCommunity && (
        <div
          key={subNavKey}
          className="fixed top-16 left-0 right-0 z-40 sub-nav-bar"
          style={{
            height: 44,
            background: "rgba(10,56,54,0.95)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            animation: "subNavReveal 300ms cubic-bezier(0.16,1,0.3,1) forwards",
          }}
          data-community={activeCommunity}
        >
          <div
            className="container mx-auto px-4 h-full flex items-center overflow-x-auto"
            style={{ scrollbarWidth: "none" }}
          >
            {SUB_NAV_LINKS[activeCommunity]?.map((link, i) => {
              const fullPath = `/${activeCommunity}${link.path}`;
              const isLinkActive = activeSubPath === link.path;
              const accentColor = COMMUNITY_DOTS[activeCommunity];
              return (
                <Link
                  key={link.label}
                  to={fullPath}
                  className="sub-nav-link-item flex-shrink-0"
                  style={{
                    color: isLinkActive ? "#fff" : "rgba(255,255,255,0.6)",
                    fontSize: "0.82rem",
                    fontWeight: 500,
                    padding: "0 14px",
                    height: 44,
                    display: "flex",
                    alignItems: "center",
                    borderBottom: `2px solid ${isLinkActive ? accentColor : "transparent"}`,
                    transition: "all 200ms ease",
                    whiteSpace: "nowrap",
                    animation: `subLinksIn 300ms cubic-bezier(0.16,1,0.3,1) forwards`,
                    animationDelay: `${i * 30}ms`,
                    opacity: 0,
                  }}
                  onMouseEnter={(e) => {
                    if (!isLinkActive) {
                      e.currentTarget.style.color = "#fff";
                      e.currentTarget.style.borderBottomColor = "rgba(255,255,255,0.3)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isLinkActive) {
                      e.currentTarget.style.color = "rgba(255,255,255,0.6)";
                      e.currentTarget.style.borderBottomColor = "transparent";
                    }
                  }}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-background/95 navbar-glass flex flex-col items-center justify-center gap-6 page-enter">
          {COMMUNITIES.map((c) => (
            <Link
              key={c.id}
              to={`/${c.id}/feed`}
              className="text-2xl font-semibold text-foreground hover:text-primary-glow transition-colors flex items-center gap-3"
            >
              <span
                className="inline-block w-2.5 h-2.5 rounded-full"
                style={{ background: COMMUNITY_DOTS[c.id] }}
              />
              {c.name}
            </Link>
          ))}
          <div className="h-px w-24 bg-border my-2" />
          <Link to="/auth/signin" className="text-lg text-muted-foreground hover:text-foreground transition-colors">
            Sign In
          </Link>
          <Link to="/auth/signup" className="px-6 py-3 rounded-lg bg-primary-glow text-primary-foreground font-semibold">
            Sign Up Free
          </Link>
        </div>
      )}
    </>
  );
}
