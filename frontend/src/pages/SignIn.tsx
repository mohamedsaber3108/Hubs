import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import USAMLogo from "@/components/USAMLogo";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import { useLoginMutation } from "@/hooks/api/useAuth";
import { authService } from "@/services/auth.service";
import { toast } from "sonner";

export default function SignIn() {
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]   = useState(false);
  const [remember, setRemember] = useState(false);
  const { t }                 = useLanguage();
  const location              = useLocation();
  const navigate              = useNavigate();
  const { mutate: login, isPending } = useLoginMutation();

  // After login, redirect back to where they came from
  const from = (location.state as any)?.from?.pathname || '/dashboard';
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    login({ email, password, remember }, {
      onSuccess: () => navigate(from, { replace: true }),
    });
  };

  const handleOAuth = (provider: 'google' | 'linkedin') => {
    window.location.href = authService.oauthUrl(provider);
  };

  return (
    <div className="min-h-screen flex page-enter">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-primary items-center justify-center">
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 30% 20%, hsl(172 68% 27% / 0.6) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, hsl(175 68% 18% / 0.8) 0%, transparent 50%), radial-gradient(ellipse at 50% 50%, hsl(175 72% 13%) 0%, hsl(215 28% 7%) 100%)" }} />
        <div className="relative z-10 text-center px-12">
          <USAMLogo size="lg" />
          <p className="text-primary-foreground/70 mt-6 text-lg max-w-md mx-auto">
            {t("heroLine1")} {t("heroLine2")} {t("heroLine3")}
          </p>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center px-6 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden flex justify-center">
            <Link to="/"><USAMLogo size="md" /></Link>
          </div>

          <div>
            <h1 className="text-3xl font-bold text-foreground">{t("welcomeBack")}</h1>
            <p className="text-muted-foreground mt-1">{t("signInToAccount")}</p>
          </div>

          {/* OAuth buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => handleOAuth('google')} className="flex items-center justify-center gap-2 px-4 py-2.5 border border-border rounded-lg bg-card hover:bg-secondary transition-colors text-sm font-medium text-foreground">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Google
            </button>
            <button onClick={() => handleOAuth('linkedin')} className="flex items-center justify-center gap-2 px-4 py-2.5 border border-border rounded-lg bg-card hover:bg-secondary transition-colors text-sm font-medium text-foreground">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.47 2H3.53A1.45 1.45 0 0 0 2 3.47v17.06A1.45 1.45 0 0 0 3.47 22h17.06A1.45 1.45 0 0 0 22 20.53V3.47A1.45 1.45 0 0 0 20.47 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 1 1 8.3 6.5a1.78 1.78 0 0 1-1.8 1.75zM20 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0 0 14 14.19V19h-3v-9h2.9v1.3a3.11 3.11 0 0 1 2.7-1.4c1.55 0 3.36.86 3.36 3.66z" />
              </svg>
              LinkedIn
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">{t("orContinueWithEmail")}</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="peer w-full px-4 pt-5 pb-2 border border-input rounded-lg bg-background text-foreground input-glow focus:outline-none placeholder-transparent"
                placeholder="Email" id="signin-email"
              />
              <label htmlFor="signin-email" className="absolute start-4 top-2 text-xs text-muted-foreground transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:text-xs peer-focus:text-primary-glow">
                {t("emailAddress")}
              </label>
            </div>

            <div className="relative">
              <input
                type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required
                className="peer w-full px-4 pt-5 pb-2 pe-12 border border-input rounded-lg bg-background text-foreground input-glow focus:outline-none placeholder-transparent"
                placeholder="Password" id="signin-pw"
              />
              <label htmlFor="signin-pw" className="absolute start-4 top-2 text-xs text-muted-foreground transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:text-xs peer-focus:text-primary-glow">
                {t("password")}
              </label>
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <button type="button" onClick={() => setRemember(!remember)}
                  className={`w-9 h-5 rounded-full transition-colors relative ${remember ? "bg-primary-glow" : "bg-muted"}`}>
                  <span className={`absolute top-0.5 start-0.5 w-4 h-4 rounded-full bg-primary-foreground transition-transform ${remember ? "translate-x-4 rtl:-translate-x-4" : ""}`} />
                </button>
                <span className="text-sm text-muted-foreground">{t("rememberMe")}</span>
              </label>
              <Link to="/auth/forgot-password" className="text-sm text-primary-glow hover:underline">{t("forgotPassword")}</Link>
            </div>

            <Button type="submit" disabled={isPending || !email || !password} className="w-full bg-primary-glow hover:bg-primary-glow/90 text-primary-foreground h-11">
              {isPending ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Signing in…</> : t("signIn")}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            {t("dontHaveAccount")}{" "}
            <Link to="/auth/signup" className="text-primary-glow hover:underline font-medium">{t("signUp")}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
