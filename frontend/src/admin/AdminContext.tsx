import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { adminAuthService } from './services/adminAuth.service';
import { adminTokenStorage } from './adminApi';
import type { AdminUser } from './adminTypes';

interface AdminContextType {
  admin: AdminUser | null;
  isAdminLoggedIn: boolean;
  isLoading: boolean;
  adminLogin: (email: string, password: string, totp?: string) => Promise<void>;
  adminLogout: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType>({
  admin: null, isAdminLoggedIn: false, isLoading: true,
  adminLogin: async () => {}, adminLogout: async () => {},
});

export function AdminProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin]     = useState<AdminUser | null>(null);
  const [isLoading, setLoad]  = useState(true);

  useEffect(() => {
    const token = adminTokenStorage.get();
    if (!token) { setLoad(false); return; }
    adminAuthService.me()
      .then(setAdmin)
      .catch(() => adminTokenStorage.clear())
      .finally(() => setLoad(false));
  }, []);

  useEffect(() => {
    const h = () => setAdmin(null);
    window.addEventListener('admin:logout', h);
    return () => window.removeEventListener('admin:logout', h);
  }, []);

  const adminLogin = useCallback(async (email: string, password: string, totp?: string) => {
    const a = await adminAuthService.login(email, password, totp);
    setAdmin(a);
  }, []);

  const adminLogout = useCallback(async () => {
    await adminAuthService.logout();
    setAdmin(null);
  }, []);

  return (
    <AdminContext.Provider value={{ admin, isAdminLoggedIn: !!admin, isLoading, adminLogin, adminLogout }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdminAuth() { return useContext(AdminContext); }
