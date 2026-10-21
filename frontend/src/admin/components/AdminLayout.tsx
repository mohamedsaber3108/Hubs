import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, FileText, BarChart3, Settings,
  Server, ScrollText, LogOut, ChevronLeft, ChevronRight,
  Shield, Bell, Menu, X, AlertTriangle, Tag
} from 'lucide-react';
import USAMLogo from '@/components/USAMLogo';
import { useAdminAuth } from '../AdminContext';

const NAV = [
  { id: 'overview',    label: 'Overview',    icon: LayoutDashboard },
  { id: 'users',       label: 'Users',       icon: Users },
  { id: 'content',     label: 'Content',     icon: FileText },
  { id: 'offers',      label: 'Offers',      icon: Tag },
  { id: 'analytics',   label: 'Analytics',   icon: BarChart3 },
  { id: 'settings',    label: 'Settings',    icon: Settings },
  { id: 'system',      label: 'System',      icon: Server },
  { id: 'logs',        label: 'Logs',        icon: ScrollText },
];

const ROLE_BADGE: Record<string, string> = {
  super_admin: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20',
  admin:       'bg-primary-glow/10 text-primary-glow border-primary-glow/20',
  moderator:   'bg-blue-400/10 text-blue-400 border-blue-400/20',
};

interface AdminLayoutProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  children: React.ReactNode;
  maintenanceMode?: boolean;
}

export default function AdminLayout({ activeTab, onTabChange, children, maintenanceMode }: AdminLayoutProps) {
  const { admin, adminLogout } = useAdminAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-border ${collapsed ? 'justify-center' : ''}`}>
        {collapsed ? (
          <Shield className="w-7 h-7 text-primary-glow" />
        ) : (
          <>
            <Shield className="w-6 h-6 text-primary-glow flex-shrink-0" />
            <div>
              <p className="font-bold text-foreground text-sm leading-none">USAM Admin</p>
              <p className="text-xs text-muted-foreground mt-0.5">Control Panel</p>
            </div>
          </>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto">
        {NAV.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <button key={id} onClick={() => { onTabChange(id); setMobileOpen(false); }}
              title={collapsed ? label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                ${active
                  ? 'bg-primary-glow text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }
                ${collapsed ? 'justify-center' : ''}`}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
              {!collapsed && id === 'system' && maintenanceMode && (
                <span className="ms-auto w-2 h-2 rounded-full bg-amber-400" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Admin info + logout */}
      <div className="border-t border-border p-3">
        {!collapsed && admin && (
          <div className="flex items-center gap-2.5 px-2 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-primary-glow/20 flex items-center justify-center text-sm font-bold text-primary-glow flex-shrink-0">
              {admin.first_name[0]}{admin.last_name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">{admin.first_name} {admin.last_name}</p>
              <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${ROLE_BADGE[admin.role] || ROLE_BADGE.moderator}`}>
                {admin.role.replace('_', ' ')}
              </span>
            </div>
          </div>
        )}
        <button onClick={adminLogout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all ${collapsed ? 'justify-center' : ''}`}>
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex flex-col flex-shrink-0 bg-card border-e border-border transition-all duration-300 ${collapsed ? 'w-16' : 'w-56'}`}>
        <SidebarContent />
        <button onClick={() => setCollapsed(!collapsed)}
          className="absolute left-0 top-1/2 -translate-y-1/2 translate-x-[calc(100%-1px)] w-5 h-10 bg-card border border-border rounded-e-lg flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors z-10 hidden md:flex"
          style={{ left: collapsed ? '3.5rem' : '13.5rem' }}>
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-card border-e border-border z-50">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-14 flex items-center gap-3 px-4 border-b border-border bg-card flex-shrink-0">
          <button onClick={() => setMobileOpen(true)} className="md:hidden text-muted-foreground hover:text-foreground">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <span className="text-sm font-semibold text-foreground capitalize">{activeTab}</span>
          </div>
          {maintenanceMode && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs text-amber-400 font-medium">Maintenance Mode</span>
            </div>
          )}
          <div className="w-7 h-7 rounded-full bg-primary-glow/20 flex items-center justify-center text-xs font-bold text-primary-glow">
            {admin?.first_name[0]}{admin?.last_name[0]}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
