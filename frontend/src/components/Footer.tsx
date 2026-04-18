import { Link } from "react-router-dom";
import USAMLogo from "./USAMLogo";
import { COMMUNITIES } from "@/lib/communities";
import { useLanguage } from "@/i18n/LanguageContext";
import type { TranslationKey } from "@/i18n/translations";

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="py-16 bg-card border-t border-border">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <USAMLogo size="sm" />
            <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
              {t("footerTagline")}
            </p>
          </div>

          {COMMUNITIES.map((c) => (
            <div key={c.id}>
              <h4 className="font-bold text-sm text-foreground mb-3">
                {t(c.id as TranslationKey)}
              </h4>
              <ul className="space-y-2">
                {(["feed", "events", "groups", "resources"] as TranslationKey[]).map((link) => (
                  <li key={link}>
                    <Link to="/communities" className="text-sm text-muted-foreground hover:text-primary-glow transition-colors">
                      {t(link)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-border pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            {t("footerCopyright")}
          </p>
        </div>
      </div>
    </footer>
  );
}
