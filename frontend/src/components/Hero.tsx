import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ParticleBackground from "./ParticleBackground";
import USAMLogo from "./USAMLogo";
import { COMMUNITIES } from "@/lib/communities";
import { ChevronDown } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import type { TranslationKey } from "@/i18n/translations";

// Community SVG Icons
const communityIcons: Record<string, React.ReactNode> = {
  freelancespace: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="community-icon">
      <path d="M3 5h10v8H3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M5 5V3.5a.5.5 0 01.5-.5h5a.5.5 0 01.5.5V5" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
  studentzone: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="community-icon">
      <path d="M8 2L2 5l6 3 6-3-6-3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M2 5v5M5 6.5v4a3 3 0 006 0v-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  hrconnect: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="community-icon">
      <circle cx="8" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M2.5 13.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  launchpad: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="community-icon">
      <path d="M8 13V3M8 3l-3 3M8 3l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
};

export default function Hero() {
  const [showPills, setShowPills] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const timer = setTimeout(() => setShowPills(true), 1400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden mesh-gradient-bg noise-overlay">
      <ParticleBackground />

      {/* USAM watermark */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none" aria-hidden>
        <div className="absolute inset-0 opacity-[0.02]">
          {Array.from({ length: 15 }).map((_, i) => (
            <span
              key={i}
              className="absolute font-black text-7xl text-primary-foreground/50"
              style={{
                top: `${(i % 5) * 22}%`,
                left: `${(i * 19) % 100}%`,
                transform: "rotate(-15deg)",
              }}
            >
              USAM
            </span>
          ))}
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-4 text-center">
        {/* Logo */}
        <div className="logo-entrance mb-8">
          <USAMLogo size="lg" />
        </div>

        {/* Badge */}
        <div
          className="split-word inline-block mb-6 px-4 py-1.5 rounded-full border border-primary-foreground/20 text-xs font-medium tracking-wide uppercase"
          style={{ color: "#becfcf", animationDelay: "300ms" }}
        >
          {t("heroBadge")}
        </div>

        {/* Headline */}
        <h1 className="font-black leading-[1.05] mb-6 tracking-tight" style={{ fontFamily: "'Poppins', sans-serif", fontSize: "clamp(3rem, 7vw, 5.5rem)", letterSpacing: "-0.02em", textAlign: "center" }}>
          <div className="headline-line-1" style={{ color: "#ffffff" }}>
            {t("heroLine1")}
          </div>
          <div className="headline-line-2" style={{
            background: "linear-gradient(135deg, #becfcf 0%, #ffffff 50%, #14776e 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            {t("heroLine2")}
          </div>
          <div className="headline-line-3" style={{ color: "#ffffff" }}>
            {t("heroLine3")}
          </div>
        </h1>

        {/* Sub-headline */}
        <p
          className="text-lg sm:text-xl max-w-2xl mx-auto mb-10 split-word"
          style={{ color: "#becfcf", animationDelay: "1800ms" }}
        >
          {t("heroSub")}
        </p>

        {/* Community pills */}
        <div className={`flex flex-wrap justify-center gap-3 mb-10 transition-all duration-700 ${showPills ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          {COMMUNITIES.map((c, i) => (
            <div
              key={c.id}
              className="elastic-in group relative px-5 py-2.5 rounded-full border border-primary-foreground/20 cursor-pointer transition-all duration-300 hover:border-primary-foreground/50 hover:bg-primary-foreground/10"
              style={{ animationDelay: `${1400 + i * 100}ms` }}
            >
              <span className="text-sm font-medium inline-flex items-center" style={{ color: "#ececec" }}>
                <span className="inline-flex items-center me-1.5 opacity-85 group-hover:scale-125 group-hover:rotate-12 transition-transform duration-300">
                  {communityIcons[c.id]}
                </span>
                {t(c.id as TranslationKey)}
              </span>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg bg-card text-card-foreground text-xs shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                {t(`${c.id}Tagline` as TranslationKey)}
              </div>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className={`flex flex-wrap justify-center gap-4 transition-all duration-700 delay-300 ${showPills ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <Link
            to="/communities"
            className="btn-shimmer px-8 py-3.5 rounded-xl font-semibold text-primary-foreground transition-all duration-300 hover:shadow-lg hover:shadow-primary-glow/30 hover:scale-[1.04] active:scale-[0.96]"
            style={{ background: "linear-gradient(135deg, #0a3836, #14776e)" }}
          >
            {t("exploreCommunities")}
          </Link>
          <Link
            to="/auth/signup"
            className="border-pulse px-8 py-3.5 rounded-xl font-semibold border-2 transition-all duration-300 hover:bg-primary-foreground/10 hover:scale-[1.04] active:scale-[0.96]"
            style={{ borderColor: "#ececec", color: "#ececec" }}
          >
            {t("signUp")}
          </Link>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bounce-arrow">
        <ChevronDown className="w-8 h-8" style={{ color: "#becfcf" }} />
      </div>
    </section>
  );
}
