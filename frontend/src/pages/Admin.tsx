import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminProvider, useAdminAuth } from '@/admin/AdminContext';
import AdminLogin from '@/admin/components/AdminLogin';
import AdminLayout from '@/admin/components/AdminLayout';
import OverviewPanel  from '@/admin/pages/OverviewPanel';
import UsersPanel     from '@/admin/pages/UsersPanel';
import ContentPanel   from '@/admin/pages/ContentPanel';
import AnalyticsPanel from '@/admin/pages/AnalyticsPanel';
import SettingsPanel  from '@/admin/pages/SettingsPanel';
import SystemPanel    from '@/admin/pages/SystemPanel';
import LogsPanel      from '@/admin/pages/LogsPanel';
import { adminSystemService } from '@/admin/services/adminSystem.service';

// Separate QueryClient for admin — isolated cache
const adminQueryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

function AdminDashboard() {
  const { isAdminLoggedIn, isLoading } = useAdminAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  useEffect(() => {
    if (!isAdminLoggedIn) return;
    adminSystemService.getMaintenance()
      .then((d) => setMaintenanceMode(d?.enabled ?? false))
      .catch(() => {});
  }, [isAdminLoggedIn]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary-glow border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdminLoggedIn) return <AdminLogin />;

  const PANELS: Record<string, React.ReactNode> = {
    overview:  <OverviewPanel />,
    users:     <UsersPanel />,
    content:   <ContentPanel />,
    analytics: <AnalyticsPanel />,
    settings:  <SettingsPanel />,
    system:    <SystemPanel />,
    logs:      <LogsPanel />,
  };

  return (
    <AdminLayout activeTab={activeTab} onTabChange={setActiveTab} maintenanceMode={maintenanceMode}>
      {PANELS[activeTab] ?? <OverviewPanel />}
    </AdminLayout>
  );
}

export default function Admin() {
  return (
    <QueryClientProvider client={adminQueryClient}>
      <AdminProvider>
        <AdminDashboard />
      </AdminProvider>
    </QueryClientProvider>
  );
}
