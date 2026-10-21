import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import USAMLogo from "@/components/USAMLogo";
import { authService } from "@/services/auth.service";
import { useAuth } from "@/contexts/AuthContext";

// OAuth landing page. The backend (SEC-03) redirects here WITHOUT a token in
// the URL — it set an httpOnly refresh cookie instead. We exchange that cookie
// for an access token, load the profile, and route the user onward.
export default function AuthCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [error, setError] = useState(false);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // guard React 18 strict-mode double-invoke
    ran.current = true;

    if (params.get("error")) { setError(true); return; }

    authService
      .exchangeOAuth()
      .then((user) => {
        setUser(user);
        navigate(user.onboarding_completed ? "/dashboard" : "/onboarding", { replace: true });
      })
      .catch(() => setError(true));
  }, [params, navigate, setUser]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <USAMLogo size="md" />
      {error ? (
        <>
          <p className="text-foreground font-medium mt-6">Sign-in could not be completed</p>
          <button onClick={() => navigate("/auth/signin", { replace: true })} className="mt-3 text-sm text-primary-glow hover:underline">
            Back to sign in
          </button>
        </>
      ) : (
        <div className="flex items-center gap-2 text-muted-foreground mt-6">
          <Loader2 className="w-5 h-5 animate-spin text-primary-glow" /> Completing sign-in…
        </div>
      )}
    </div>
  );
}
