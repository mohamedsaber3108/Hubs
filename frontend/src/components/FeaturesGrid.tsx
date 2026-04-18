import { useScrollReveal } from "@/hooks/useScrollReveal";
import {
  Newspaper, Users, CalendarDays, Trophy,
  Briefcase, UserCheck, Gamepad2, Bot,
  BookOpen, Bell, Moon, Smartphone,
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import type { TranslationKey } from "@/i18n/translations";

const features: { icon: typeof Newspaper; nameKey: TranslationKey; descKey: TranslationKey }[] = [
  { icon: Newspaper, nameKey: "featureFeed", descKey: "featureFeedDesc" },
  { icon: Users, nameKey: "featureGroups", descKey: "featureGroupsDesc" },
  { icon: CalendarDays, nameKey: "featureEvents", descKey: "featureEventsDesc" },
  { icon: Trophy, nameKey: "featureChallenges", descKey: "featureChallengesDesc" },
  { icon: Briefcase, nameKey: "featureOpportunities", descKey: "featureOpportunitiesDesc" },
  { icon: UserCheck, nameKey: "featureMentorMatching", descKey: "featureMentorMatchingDesc" },
  { icon: Gamepad2, nameKey: "featureGamification", descKey: "featureGamificationDesc" },
  { icon: Bot, nameKey: "featureAI", descKey: "featureAIDesc" },
  { icon: BookOpen, nameKey: "featureResources", descKey: "featureResourcesDesc" },
  { icon: Bell, nameKey: "featureNotifications", descKey: "featureNotificationsDesc" },
  { icon: Moon, nameKey: "featureDarkMode", descKey: "featureDarkModeDesc" },
  { icon: Smartphone, nameKey: "featureMobile", descKey: "featureMobileDesc" },
];

export default function FeaturesGrid() {
  const { ref, revealed } = useScrollReveal(0.1);
  const { t } = useLanguage();

  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div ref={ref} className={`scroll-reveal ${revealed ? "revealed" : ""} text-center mb-16`}>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-foreground mb-4 tracking-tight">
            {t("featuresTitle")}
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            {t("featuresSub")}
          </p>
        </div>

        <div className={`stagger-children ${revealed ? "revealed" : ""} grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4`}>
          {features.map((f, i) => {
            const Icon = f.icon;
            const col = i % 6;
            const row = Math.floor(i / 6);
            const delay = row * 100 + col * 80;

            return (
              <div
                key={i}
                className="group relative p-7 rounded-2xl bg-card transition-all duration-300 hover:shadow-[0_16px_40px_rgba(10,56,54,0.1)] hover:-translate-y-1.5 text-center feature-card-elevated"
                style={{ border: "1px solid rgba(10,56,54,0.07)", transitionDelay: `${delay}ms` }}
              >
                <div className="feature-icon-container w-[52px] h-[52px] mx-auto mb-3 rounded-full flex items-center justify-center transition-all duration-250" style={{ background: "rgba(10,56,54,0.06)" }}>
                  <Icon className="w-6 h-6 transition-all duration-250" style={{ color: "#14776e" }} />
                </div>
                <h4 className="font-semibold text-sm text-foreground mb-1">{t(f.nameKey)}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{t(f.descKey)}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
