import { Link, useLocation } from "react-router-dom";
import { Home, Search, PlusCircle, Bell, User } from "lucide-react";

const NAV_ITEMS = [
  { to: "/dashboard", icon: Home, label: "Home" },
  { to: "/search", icon: Search, label: "Search" },
  { to: "/feed", icon: PlusCircle, label: "Create" },
  { to: "/dashboard", icon: Bell, label: "Alerts" },
  { to: "/profile/sara_designs", icon: User, label: "Profile" },
];

export default function MobileNav() {
  const { pathname } = useLocation();
  const isLanding = pathname === "/" || pathname.startsWith("/auth");
  if (isLanding) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-lg border-t border-border md:hidden safe-area-bottom">
      <div className="flex items-center justify-around py-1.5 px-2">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.to;
          return (
            <Link key={item.label} to={item.to} className="flex flex-col items-center gap-0.5 py-1 px-3">
              <item.icon className={`w-5 h-5 transition-colors ${active ? "text-primary-glow" : "text-muted-foreground"}`} />
              <span className={`text-[10px] ${active ? "text-primary-glow font-medium" : "text-muted-foreground"}`}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
