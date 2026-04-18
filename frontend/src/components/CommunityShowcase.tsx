import { useScrollReveal } from "@/hooks/useScrollReveal";
import { COMMUNITIES } from "@/lib/communities";
import { Link } from "react-router-dom";

const cardStyles: Record<string, {
  bg: string;
  pattern?: string;
  textColor: string;
  chipBg: string;
  chipBorder: string;
  btnBg: string;
  btnColor: string;
  featureIcon: string;
}> = {
  freelancespace: {
    bg: "radial-gradient(ellipse at 30% 50%, #ff9a5c 0%, #ff6b1a 40%, #e55000 100%)",
    pattern: "radial-gradient(circle at 90% 20%, rgba(255,255,255,0.08) 0%, transparent 50%)",
    textColor: "#fff",
    chipBg: "rgba(0,0,0,0.15)",
    chipBorder: "rgba(255,255,255,0.2)",
    btnBg: "rgba(255,255,255,0.95)",
    btnColor: "#e55000",
    featureIcon: "✦",
  },
  studentzone: {
    bg: "radial-gradient(ellipse at 70% 30%, #8fb8b8 0%, #6a9e9e 40%, #4a8585 100%)",
    pattern: "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.04) 1px, transparent 1px)",
    textColor: "#0a3836",
    chipBg: "rgba(10,56,54,0.12)",
    chipBorder: "rgba(10,56,54,0.2)",
    btnBg: "#0a3836",
    btnColor: "#ececec",
    featureIcon: "✦",
  },
  hrconnect: {
    bg: "radial-gradient(ellipse at 40% 60%, #2d8a85 0%, #1a6b66 50%, #0d4f4c 100%)",
    pattern: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
    textColor: "#fff",
    chipBg: "rgba(255,255,255,0.12)",
    chipBorder: "rgba(255,255,255,0.18)",
    btnBg: "rgba(255,255,255,0.95)",
    btnColor: "#0d4f4c",
    featureIcon: "✦",
  },
  launchpad: {
    bg: "radial-gradient(ellipse at 60% 40%, #4cd964 0%, #28a745 50%, #1a7a30 100%)",
    pattern: "radial-gradient(circle at 15% 25%, rgba(255,255,255,0.1) 0%, transparent 50%)",
    textColor: "#fff",
    chipBg: "rgba(0,0,0,0.12)",
    chipBorder: "rgba(255,255,255,0.2)",
    btnBg: "rgba(255,255,255,0.95)",
    btnColor: "#1a7a30",
    featureIcon: "✦",
  },
};

/* Abstract SVG icons for each community */
function CommunityIcon({ id, revealed }: { id: string; revealed: boolean }) {
  const containerBase =
    "w-16 h-16 flex items-center justify-center rounded-[18px] border mb-5 transition-all duration-[400ms] group-hover:rotate-[8deg] group-hover:scale-105";
  const containerStyle = (bg: string): React.CSSProperties => ({
    background: bg,
    borderColor: "rgba(255,255,255,0.25)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    transform: revealed ? "scale(1)" : "scale(0)",
    transition:
      "transform 600ms cubic-bezier(0.34,1.56,0.64,1)",
    transitionDelay: revealed ? "200ms" : "0ms",
  });

  if (id === "freelancespace") {
    return (
      <div className={containerBase} style={containerStyle("rgba(255,255,255,0.15)")}>
        <svg width="32" height="32" viewBox="0 0 56 56" fill="none" className={revealed ? "community-icon-spin" : ""}>
          <path
            d="M10 28c0-8 6-14 14-14s10 6 10 6 2-6 10-6 12 6 12 14-6 14-12 14-10-6-10-6-2 6-10 6S10 36 10 28z"
            stroke="white" strokeWidth="2.5" strokeLinecap="round"
          />
          <circle cx="28" cy="28" r="3" fill="white" />
          <circle cx="28" cy="28" r="6" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
        </svg>
      </div>
    );
  }

  if (id === "studentzone") {
    return (
      <div className={containerBase} style={containerStyle("rgba(0,0,0,0.12)")}>
        <svg width="32" height="32" viewBox="0 0 56 56" fill="none">
          <circle
            cx="28" cy="28" r="18" stroke="white" strokeWidth="2" strokeDasharray="4 3"
            className={revealed ? "community-dash-rotate" : ""}
            style={{ transformOrigin: "28px 28px" }}
          />
          <circle cx="28" cy="10" r="3" fill="white" />
          <circle cx="46" cy="28" r="3" fill="white" />
          <circle cx="28" cy="46" r="3" fill="rgba(255,255,255,0.4)" />
          <circle cx="10" cy="28" r="3" fill="rgba(255,255,255,0.4)" />
          <path d="M28 10L34 22H22L28 10z" fill="white" />
        </svg>
      </div>
    );
  }

  if (id === "hrconnect") {
    return (
      <div className={containerBase} style={containerStyle("rgba(255,255,255,0.15)")}>
        <svg width="32" height="32" viewBox="0 0 56 56" fill="none">
          <circle cx="28" cy="14" r="5" fill="white" className="community-node-pulse" style={{ animationDelay: "0s" }} />
          <circle cx="14" cy="38" r="4" fill="rgba(255,255,255,0.7)" className="community-node-pulse" style={{ animationDelay: "0.5s" }} />
          <circle cx="42" cy="38" r="4" fill="rgba(255,255,255,0.7)" className="community-node-pulse" style={{ animationDelay: "1s" }} />
          <line x1="28" y1="19" x2="14" y2="34" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="28" y1="19" x2="42" y2="34" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="14" y1="38" x2="42" y2="38" stroke="rgba(255,255,255,0.3)" strokeWidth="1" strokeDasharray="3 2" />
        </svg>
      </div>
    );
  }

  if (id === "launchpad") {
    return (
      <div className={containerBase} style={containerStyle("rgba(255,255,255,0.15)")}>
        <svg width="32" height="32" viewBox="0 0 56 56" fill="none">
          <ellipse
            cx="28" cy="32" rx="18" ry="8"
            stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"
            className={revealed ? "community-orbit-rotate" : ""}
            style={{ transformOrigin: "28px 32px" }}
          />
          <path d="M28 44V18" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M20 26l8-10 8 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="46" cy="20" r="2.5" fill="white" opacity="0.6" className="community-twinkle" style={{ animationDelay: "0s" }} />
          <circle cx="40" cy="12" r="1.5" fill="white" opacity="0.4" className="community-twinkle" style={{ animationDelay: "0.7s" }} />
          <circle cx="48" cy="32" r="1.5" fill="white" opacity="0.3" className="community-twinkle" style={{ animationDelay: "1.4s" }} />
        </svg>
      </div>
    );
  }

  return null;
}

/* Floating decorative elements per card */
function FloatingDecorations({ id }: { id: string }) {
  if (id === "freelancespace") {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="absolute rounded-xl bg-white/10 backdrop-blur-sm border border-white/20"
            style={{
              width: `${60 + i * 15}px`,
              height: `${40 + i * 10}px`,
              right: `${10 + i * 12}%`,
              top: `${15 + i * 20}%`,
              animation: `float${i + 1} ${4 + i * 0.8}s ease-in-out infinite`,
              animationDelay: `${i * 0.5}s`,
            }}
          />
        ))}
      </div>
    );
  }
  if (id === "studentzone") {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-white/20"
            style={{
              right: `${15 + i * 18}%`,
              top: `${20 + i * 15}%`,
              animation: `floatUp ${5 + i}s ease-in-out infinite`,
              animationDelay: `${i * 1.2}s`,
            }}
          />
        ))}
      </div>
    );
  }
  if (id === "hrconnect") {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div
          className="absolute w-32 h-32 rounded-full border border-white/10"
          style={{
            right: "8%",
            top: "10%",
            animation: "stepPulseRing 3s ease-in-out infinite",
          }}
        />
      </div>
    );
  }
  if (id === "launchpad") {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div
          className="absolute w-6 h-6 rounded-full bg-white/10"
          style={{
            left: "5%",
            bottom: "15%",
            animation: "rocketFloat 4s ease-in-out infinite",
          }}
        />
      </div>
    );
  }
  return null;
}

export default function CommunityShowcase() {
  return (
    <section className="relative py-24 bg-background">
      {/* Wave divider from hero */}
      <div className="absolute top-0 left-0 w-full overflow-hidden leading-none -translate-y-[1px]">
        <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-16 sm:h-20">
          <path d="M0 80L48 68C96 56 192 32 288 24C384 16 480 24 576 36C672 48 768 64 864 64C960 64 1056 48 1152 36C1248 24 1344 16 1392 12L1440 8V0H0V80Z" fill="hsl(var(--background))" />
        </svg>
      </div>

      <div className="container mx-auto px-4">
        <SectionHeader />
        <div className="space-y-16 mt-16">
          {COMMUNITIES.map((c, i) => (
            <CommunityCard key={c.id} community={c} index={i} />
          ))}
        </div>
      </div>

      {/* Bottom gradient fade into stats */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-b from-transparent to-[#0a3836] pointer-events-none" />
    </section>
  );
}

function SectionHeader() {
  const { ref, revealed } = useScrollReveal();
  return (
    <div ref={ref} className={`text-center scroll-reveal ${revealed ? "revealed" : ""}`}>
      <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-foreground mb-4 tracking-tight">
        Four Worlds, One Platform
      </h2>
      <p className="text-lg text-muted-foreground max-w-xl mx-auto">
        Pick your space. Build your network. Grow without limits.
      </p>
    </div>
  );
}

function CommunityCard({ community: c, index }: { community: (typeof COMMUNITIES)[number]; index: number }) {
  const { ref, revealed } = useScrollReveal(0.1);
  const isEven = index % 2 === 0;
  const style = cardStyles[c.id];

  return (
    <div
      ref={ref}
      className={`scroll-reveal ${revealed ? "revealed" : ""} community-card-elevated noise-overlay group`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div
        className="relative p-8 sm:p-12 lg:p-16 min-h-[420px] flex flex-col lg:flex-row items-center gap-8 rounded-3xl overflow-hidden"
        style={{ background: style.bg }}
      >
        {/* Pattern overlay */}
        {style.pattern && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: style.pattern,
              backgroundSize: c.id === "hrconnect" ? "40px 40px" : undefined,
            }}
          />
        )}

        {/* Floating decorations */}
        <FloatingDecorations id={c.id} />

        {/* Inner top highlight */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

        <div className={`flex-1 relative z-10 ${isEven ? "lg:order-1" : "lg:order-2"}`}>
          <CommunityIcon id={c.id} revealed={revealed} />
          <h3
            className="text-3xl sm:text-4xl font-extrabold mb-2 tracking-tight"
            style={{ color: style.textColor }}
          >
            {c.name}
          </h3>
          <p className="text-lg font-medium mb-2 opacity-90" style={{ color: style.textColor }}>
            {c.tagline}
          </p>
          <p className="mb-6 opacity-80 max-w-md" style={{ color: style.textColor }}>
            {c.description}
          </p>
          <Link
            to="/auth/signup"
            className="btn-shimmer inline-block px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-[1.04] hover:shadow-[0_8px_24px_rgba(0,0,0,0.2)] active:scale-[0.96]"
            style={{ background: style.btnBg, color: style.btnColor }}
          >
            Join {c.name} →
          </Link>
        </div>

        <div className={`flex-1 relative z-10 ${isEven ? "lg:order-2" : "lg:order-1"}`}>
          <div className={`stagger-children ${revealed ? "revealed" : ""} grid grid-cols-1 sm:grid-cols-2 gap-3`}>
            {c.features.map((f, fi) => (
              <div
                key={fi}
                className="community-chip flex items-start gap-2 p-3 rounded-xl backdrop-blur-sm transition-all duration-200 hover:translate-x-1"
                style={{
                  background: style.chipBg,
                  borderWidth: 1,
                  borderStyle: "solid",
                  borderColor: style.chipBorder,
                }}
              >
                <span className="text-lg mt-0.5">{style.featureIcon}</span>
                <span className="text-sm font-medium" style={{ color: style.textColor }}>
                  {f}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm font-semibold opacity-70" style={{ color: style.textColor }}>
            {c.members} members
          </p>
        </div>
      </div>
    </div>
  );
}
