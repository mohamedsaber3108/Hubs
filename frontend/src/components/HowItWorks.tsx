import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Users, UserCircle, Network } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import type { TranslationKey } from "@/i18n/translations";

const steps: { icon: typeof Users; titleKey: TranslationKey; descKey: TranslationKey }[] = [
  { icon: Users, titleKey: "chooseSpace", descKey: "chooseSpaceDesc" },
  { icon: UserCircle, titleKey: "buildProfile", descKey: "buildProfileDesc" },
  { icon: Network, titleKey: "connectGrow", descKey: "connectGrowDesc" },
];

export default function HowItWorks() {
  const { ref, revealed } = useScrollReveal(0.15);
  const { t } = useLanguage();

  return (
    <section
      className="relative py-24"
      style={{
        backgroundColor: "hsl(var(--card))",
        backgroundImage: "radial-gradient(circle, rgba(10,56,54,0.08) 1px, transparent 1px)",
        backgroundSize: "32px 32px",
      }}
    >
      {/* Wave divider from stats */}
      <div className="absolute top-0 left-0 w-full overflow-hidden leading-none -translate-y-[1px]">
        <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-12">
          <path d="M0 0H1440V30C1380 45 1200 60 960 50C720 40 480 20 240 30C120 35 60 42 0 50V0Z" fill="#081f1e" />
        </svg>
      </div>

      <div className="container mx-auto px-4">
        <div ref={ref} className={`scroll-reveal ${revealed ? "revealed" : ""} text-center mb-16`}>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-foreground mb-4 tracking-tight">
            {t("howItWorksTitle")}
          </h2>
          <p className="text-lg text-muted-foreground">{t("howItWorksSub")}</p>
        </div>

        <div className="relative max-w-4xl mx-auto">
          <svg
            className="absolute top-9 left-0 w-full h-4 hidden md:block pointer-events-none"
            viewBox="0 0 800 16" fill="none" preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="pathGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0a3836" />
                <stop offset="100%" stopColor="#becfcf" />
              </linearGradient>
            </defs>
            <path
              d="M130 8 L670 8" stroke="url(#pathGrad)" strokeWidth="2" strokeLinecap="round" strokeDasharray="6 6"
              className={`path-draw ${revealed ? "drawn" : ""}`}
              style={{ strokeDasharray: "1000", strokeDashoffset: revealed ? "0" : "1000", transition: "stroke-dashoffset 1.5s cubic-bezier(0.16, 1, 0.3, 1) 0.3s" }}
            />
          </svg>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <StepCard key={i} step={s} index={i} parentRevealed={revealed} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function StepCard({ step, index, parentRevealed }: { step: typeof steps[number]; index: number; parentRevealed: boolean }) {
  const { ref, revealed } = useScrollReveal(0.1);
  const { t } = useLanguage();
  const Icon = step.icon;

  return (
    <div ref={ref} className={`scroll-reveal ${revealed ? "revealed" : ""} text-center`} style={{ transitionDelay: `${index * 200}ms` }}>
      <div
        className={`step-pulse-ring ${parentRevealed ? "active" : ""} relative w-[72px] h-[72px] mx-auto mb-6 rounded-2xl flex items-center justify-center transition-transform duration-300 hover:-translate-y-1`}
        style={{ background: "#0a3836", animationDelay: `${index * 500 + 800}ms` }}
      >
        <Icon
          className={`w-6 h-6 text-white icon-spin-reveal ${parentRevealed ? "active" : ""}`}
          style={{ transitionDelay: `${index * 300 + 500}ms` }}
        />
      </div>
      <div className="text-sm font-bold mb-2" style={{ color: "#14776e" }}>{t("step")} {index + 1}</div>
      <h3 className="text-xl font-bold text-foreground mb-3">{t(step.titleKey)}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{t(step.descKey)}</p>
    </div>
  );
}
