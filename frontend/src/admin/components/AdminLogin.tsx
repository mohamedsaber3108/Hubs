import { useState } from 'react';
import { Shield, Eye, EyeOff, Loader2, KeyRound } from 'lucide-react';
import { useAdminAuth } from '../AdminContext';
import { toast } from 'sonner';

export default function AdminLogin() {
  const { adminLogin } = useAdminAuth();
  const [email, setEmail]   = useState('');
  const [password, setPw]   = useState('');
  const [totp, setTotp]     = useState('');
  const [showPw, setShowPw] = useState(false);
  const [pending, setPending] = useState(false);
  const [needTotp, setNeedTotp] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    try {
      await adminLogin(email, password, totp || undefined);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Login failed';
      if (msg.toLowerCase().includes('totp') || msg.toLowerCase().includes('2fa')) {
        setNeedTotp(true);
        toast.error('2FA code required');
      } else {
        toast.error(msg);
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      {/* Subtle grid background */}
      <div className="fixed inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'linear-gradient(hsl(172 68% 27%) 1px, transparent 1px), linear-gradient(90deg, hsl(172 68% 27%) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="relative w-full max-w-md">
        {/* Glow */}
        <div className="absolute -inset-1 rounded-2xl bg-primary-glow/10 blur-xl" />

        <div className="relative bg-card border border-border rounded-2xl p-8 shadow-2xl">
          {/* Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-primary-glow/10 border border-primary-glow/20 flex items-center justify-center mb-4">
              <Shield className="w-7 h-7 text-primary-glow" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Admin Portal</h1>
            <p className="text-sm text-muted-foreground mt-1">USAM Hub — Restricted Access</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Email</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required
                className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary-glow/30 focus:border-primary-glow/50 transition-all" />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Password</label>
              <div className="relative">
                <input value={password} onChange={(e) => setPw(e.target.value)} type={showPw ? 'text' : 'password'} required
                  className="w-full px-4 py-3 pe-11 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary-glow/30 focus:border-primary-glow/50 transition-all" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {needTotp && (
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block flex items-center gap-1.5">
                  <KeyRound className="w-3 h-3" /> 2FA Code
                </label>
                <input value={totp} onChange={(e) => setTotp(e.target.value)} type="text" maxLength={6} placeholder="000000"
                  className="w-full px-4 py-3 rounded-xl bg-background border border-primary-glow/40 text-foreground text-sm text-center tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-primary-glow/30 transition-all" />
              </div>
            )}

            <button type="submit" disabled={pending || !email || !password}
              className="w-full py-3 rounded-xl bg-primary-glow text-primary-foreground font-semibold text-sm transition-all hover:bg-primary-glow/90 disabled:opacity-50 flex items-center justify-center gap-2 mt-2">
              {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
              {pending ? 'Authenticating…' : 'Sign In to Admin'}
            </button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Unauthorized access is monitored and logged.
          </p>
        </div>
      </div>
    </div>
  );
}
