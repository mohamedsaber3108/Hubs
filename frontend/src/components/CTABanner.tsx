import { Link } from "react-router-dom";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useLanguage } from "@/i18n/LanguageContext";

export default function CTABanner() {
  const { ref, revealed } = useScrollReveal(0.2);
  const { t } = useLanguage();

  return (
    <section className="relative py-24 overflow-hidden noise-overlay cta-gradient-mesh">
      {/* Floating decorative dots */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="absolute w-4 h-4 rounded-full bg-white/5"
            style={{
              left: `${15 + i * 20}%`,
              top: `${20 + (i % 2) * 40}%`,
              filter: "blur(2px)",
              animation: `floatUp ${6 + i}s ease-in-out infinite`,
              animationDelay: `${i * 1.5}s`,
            }}
          />
        ))}
      </div>

      <div ref={ref} className={`scroll-reveal ${revealed ? "revealed" : ""} container mx-auto px-4 text-center relative z-10`}>
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-6 tracking-tight hero-gradient-text">
          {t("ctaTitle")}
        </h2>
        <p className="text-lg mb-10 max-w-lg mx-auto" style={{ color: "#becfcf" }}>
          {t("ctaSub")}
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            to="/auth/signup"
            className="btn-shimmer px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 hover:scale-[1.05] hover:shadow-[0_12px_40px_rgba(255,255,255,0.25)] active:scale-[0.96]"
            style={{ background: "#fff", color: "#0a3836" }}
          >
            {t("getStarted")}
          </Link>
          <Link
            to="/communities"
            className="cta-outline-btn px-8 py-4 rounded-xl font-bold text-lg border-2 transition-all duration-300 hover:scale-[1.04] active:scale-[0.96]"
            style={{ borderColor: "#becfcf", color: "#becfcf" }}
          >
            {t("exploreCommunities")}
          </Link>
        </div>
      </div>

      <div className="absolute top-1/2 left-0 w-64 h-64 rounded-full -translate-x-1/2 -translate-y-1/2 opacity-10 blur-3xl" style={{ background: "#14776e" }} />
      <div className="absolute bottom-0 right-0 w-48 h-48 rounded-full translate-x-1/4 translate-y-1/4 opacity-10 blur-2xl" style={{ background: "#5ab3ad" }} />
    </section>
  );
}
