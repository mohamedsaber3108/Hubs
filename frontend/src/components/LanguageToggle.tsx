import { useLanguage } from "@/i18n/LanguageContext";

export default function LanguageToggle() {
  const { locale, setLocale } = useLanguage();

  return (
    <button
      onClick={() => setLocale(locale === "en" ? "ar" : "en")}
      className="relative px-2.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 hover:bg-primary-foreground/10 text-primary-foreground/80 hover:text-primary-foreground border border-transparent hover:border-primary-foreground/20"
      aria-label={locale === "en" ? "Switch to Arabic" : "Switch to English"}
      title={locale === "en" ? "العربية" : "English"}
    >
      {locale === "en" ? "عربي" : "EN"}
    </button>
  );
}
