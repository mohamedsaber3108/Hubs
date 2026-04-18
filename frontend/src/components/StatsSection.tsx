import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useCountUp } from "@/hooks/useCountUp";
import { Users, Globe, CalendarDays, Briefcase } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import type { TranslationKey } from "@/i18n/translations";

const stats: { value: number; labelKey: TranslationKey; suffix: string; icon: typeof Users }[] = [
  { value: 50000, labelKey: "communityMembers", suffix: "+", icon: Users },
  { value: 4, labelKey: "uniqueCommunities", suffix: "", icon: Globe },
  { value: 200, labelKey: "monthlyEvents", suffix: "+", icon: CalendarDays },
  { value: 1000, labelKey: "opportunities", suffix: "+", icon: Briefcase },
];

const testimonials = [
  {
    quote: { en: "USAM Hub completely transformed how I find freelance clients in the MENA region. The community is incredible.", ar: "غيّر يو سام هب تماماً طريقة إيجادي لعملاء العمل الحر في منطقة الشرق الأوسط. المجتمع رائع." },
    name: "Sara A.",
    role: { en: "Freelance Designer", ar: "مصممة مستقلة" },
    community: "FreelanceSpace",
  },
  {
    quote: { en: "I found my internship through LaunchPad and met mentors who changed my career trajectory.", ar: "وجدت تدريبي من خلال لانش باد وقابلت مرشدين غيّروا مسيرتي المهنية." },
    name: "Omar K.",
    role: { en: "Software Engineer", ar: "مهندس برمجيات" },
    community: "LaunchPad",
  },
  {
    quote: { en: "The HR Connect space helped me build a network of 500+ recruiters. Our hiring pipeline has never been stronger.", ar: "ساعدني إتش آر كونكت في بناء شبكة تضم أكثر من 500 مسؤول توظيف." },
    name: "Layla M.",
    role: { en: "HR Director", ar: "مديرة الموارد البشرية" },
    community: "HR Connect",
  },
];

function StatItem({ value, labelKey, suffix, started, icon: Icon }: {
  value: number; labelKey: TranslationKey; suffix: string; started: boolean; icon: typeof Users;
}) {
  const count = useCountUp(value, 2000, started);
  const { t } = useLanguage();
  return (
    <div className="text-center group">
      <div className={`w-12 h-12 mx-auto mb-3 flex items-center justify-center rounded-lg ${started ? "icon-spin-reveal active" : "icon-spin-reveal"}`} style={{ background: "rgba(20,119,110,0.2)" }}>
        <Icon className="w-5 h-5" style={{ color: "#14776e" }} />
      </div>
      <div className="stat-number text-4xl sm:text-5xl font-black" style={{ color: "#14776e" }}>
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-sm font-medium mt-2" style={{ color: "#becfcf" }}>
        {t(labelKey)}
      </div>
    </div>
  );
}

export default function StatsSection() {
  const { ref, revealed } = useScrollReveal(0.2);

  return (
    <section
      className="relative py-24 overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0a3836 0%, #0d2e2c 50%, #081f1e 100%)" }}
    >
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div className="absolute rounded-full" style={{ width: 400, height: 400, top: "-10%", left: "-5%", background: "rgba(20,119,110,0.15)", filter: "blur(80px)", animation: "orbDrift 8s ease-in-out infinite" }} />
        <div className="absolute rounded-full" style={{ width: 300, height: 300, bottom: "-10%", right: "-5%", background: "rgba(190,207,207,0.08)", filter: "blur(60px)", animation: "orbDrift 8s ease-in-out infinite reverse" }} />
      </div>
      <div className="absolute inset-0 gradient-sweep scanline pointer-events-none" />
      <div className="absolute top-0 left-0 w-full overflow-hidden leading-none -translate-y-[1px]">
        <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-12">
          <path d="M0 60L60 48C120 36 240 12 360 6C480 0 600 12 720 18C840 24 960 24 1080 18C1200 12 1320 0 1380 -6L1440 -12V0H0V60Z" fill="#0a3836" />
        </svg>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div ref={ref} className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          {stats.map((s, i) => (
            <div key={i} className="relative">
              <StatItem {...s} started={revealed} />
              {i < stats.length - 1 && (
                <div className="hidden lg:block absolute end-0 top-1/2 -translate-y-1/2 w-px h-12 transition-opacity duration-1000"
                  style={{ background: "linear-gradient(180deg, transparent, rgba(20,119,110,0.3), transparent)", opacity: revealed ? 1 : 0, transitionDelay: `${i * 200}ms` }} />
              )}
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <TestimonialCard key={i} testimonial={t} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({ testimonial: item, index }: { testimonial: typeof testimonials[number]; index: number }) {
  const { ref, revealed } = useScrollReveal(0.1);
  const { locale } = useLanguage();

  return (
    <div
      ref={ref}
      className={`scroll-reveal ${revealed ? "revealed" : ""} relative rounded-2xl p-6 border transition-all duration-400 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary-glow/10`}
      style={{ transitionDelay: `${index * 150}ms`, background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}
    >
      <span className="absolute top-4 end-6 text-5xl font-serif leading-none pointer-events-none select-none" style={{ color: "rgba(20,119,110,0.15)" }} aria-hidden>"</span>
      <p className="text-sm leading-relaxed mb-6 relative z-10" style={{ color: "#becfcf" }}>"{item.quote[locale]}"</p>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg ring-2 ring-offset-1"
          style={{ background: "rgba(20,119,110,0.3)", boxShadow: "0 0 12px rgba(20,119,110,0.2), inset 0 0 0 2px rgba(20,119,110,0.3)" }}>
          <span className="text-sm font-bold text-white">{item.name[0]}</span>
        </div>
        <div>
          <p className="font-semibold text-sm" style={{ color: "#ececec" }}>{item.name}</p>
          <p className="text-xs" style={{ color: "#becfcf" }}>{item.role[locale]} · {item.community}</p>
        </div>
      </div>
    </div>
  );
}
