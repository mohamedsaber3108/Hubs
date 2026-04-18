import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';
import { tokenStorage } from '@/lib/api';
import { connectSockets, disconnectSockets } from '@/lib/socket';
import type { AuthUser } from '@/lib/types';

interface AuthContextType {
  user: AuthUser | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (u: AuthUser | null) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null, isLoggedIn: false, isLoading: true,
  login: async () => {}, logout: async () => {}, setUser: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient           = useQueryClient();

  // On mount: try to restore session
  useEffect(() => {
    const token = tokenStorage.get();
    if (!token) { setIsLoading(false); return; }
    authService.getMe()
      .then((u) => { setUser(u); connectSockets(); })
      .catch(() => tokenStorage.clear())
      .finally(() => setIsLoading(false));
  }, []);

  // Listen for forced logout (from 401 interceptor)
  useEffect(() => {
    const handler = () => { setUser(null); disconnectSockets(); queryClient.clear(); };
    window.addEventListener('auth:logout', handler);
    return () => window.removeEventListener('auth:logout', handler);
  }, [queryClient]);

  const login = useCallback(async (email: string, password: string, remember = false) => {
    const u = await authService.login({ email, password, remember_me: remember });
    setUser(u);
    connectSockets();
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
    disconnectSockets();
    queryClient.clear();
  }, [queryClient]);

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, isLoading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }

// Backward-compat alias used by existing components
export function useUser() {
  const { user, isLoggedIn, setUser } = useAuth();
  return { user, isLoggedIn, setUser };
}
