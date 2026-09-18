import React from 'react';
import { 
  Bell, 
  Plus, 
  Menu, 
  Briefcase, 
  Smartphone, 
  Radio, 
  User, 
  LogOut,
  ShieldCheck,
  CheckCircle2,
  Database
} from 'lucide-react';
import { UserRole, UserProfile, PageTab } from '../types';

interface HeaderProps {
  activeTab: PageTab;
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  unreadCount: number;
  onOpenNotifications: () => void;
  onOpenNewOrder: () => void;
  pushEnabled: boolean;
  onTogglePush: () => void;
  onSimulateFieldAction: () => void;
  currentUser: UserProfile | null;
  onOpenAuth: () => void;
  onSignOut: () => void;
  onToggleMobileSidebar: () => void;
  firestoreConnected: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  currentRole,
  onRoleChange,
  unreadCount,
  onOpenNotifications,
  onOpenNewOrder,
  pushEnabled,
  onTogglePush,
  onSimulateFieldAction,
  currentUser,
  onOpenAuth,
  onSignOut,
  onToggleMobileSidebar,
  firestoreConnected,
}) => {
  const getTabTitle = (tab: PageTab) => {
    switch (tab) {
      case 'orders':
        return {
          title: 'Service Orders & Dispatch',
          subtitle: 'Active court summons, subpoena delivery & real-time matter tracking',
        };
      case 'field':
        return {
          title: 'Field Command & GPS Logs',
          subtitle: 'Geo-verified service attempts, physical recipient profiles & affidavits in the field',
        };
      case 'affidavits':
        return {
          title: 'Proof of Service & Affidavits',
          subtitle: 'Court-certified declarations of diligence and completed service returns',
        };
      case 'analytics':
        return {
          title: 'Operational Metrics & Reports',
          subtitle: 'Turnaround benchmarks, service completion rates & case volume',
        };
      case 'notifications':
        return {
          title: 'Dispatch Alerts & Activity Feed',
          subtitle: 'Live multi-channel notification log for field events & milestone updates',
        };
      case 'account':
        return {
          title: 'SaaS Account & Database Config',
          subtitle: 'Cloud SQL PostgreSQL persistence, server licensing & firm profile',
        };
    }
  };

  const currentMeta = getTabTitle(activeTab);

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 text-slate-800 shadow-xs">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18 gap-3">
          
          {/* Left: Mobile hamburger + Page Title */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              id="mobile-menu-toggle"
              onClick={onToggleMobileSidebar}
              className="p-2 -ml-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 lg:hidden focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Open navigation sidebar"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="truncate">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight truncate flex items-center gap-2">
                <span>{currentMeta.title}</span>
                <span className={`hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                  currentRole === 'client' 
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}>
                  {currentRole === 'client' ? (
                    <>
                      <Briefcase className="w-3 h-3" />
                      Attorney Portal
                    </>
                  ) : (
                    <>
                      <Smartphone className="w-3 h-3" />
                      Server View
                    </>
                  )}
                </span>
              </h1>
              <p className="text-xs text-slate-500 hidden md:block truncate">
                {currentMeta.subtitle}
              </p>
            </div>
          </div>

          {/* Right: Uncluttered Clean Controls */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Quick Simulate Button (Desktop only, subtle) */}
            <button
              id="header-simulate-btn"
              onClick={onSimulateFieldAction}
              title="Simulate live field attempt"
              className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 transition"
            >
              <Radio className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
              <span>Simulate Event</span>
            </button>

            {/* Notification Bell */}
            <button
              id="header-notifications-bell"
              onClick={onOpenNotifications}
              className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition"
              aria-label="View notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute 1 top-1.5 right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-xs">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Primary "+ New Service Order" Action */}
            <button
              id="header-create-order-btn"
              onClick={onOpenNewOrder}
              className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span><span className="hidden sm:inline">New </span>Order</span>
            </button>

            {/* Profile Avatar / Auth trigger */}
            {currentUser ? (
              <button
                onClick={onOpenAuth}
                title={`Logged in as ${currentUser.fullName} (${currentUser.organizationName})`}
                className="flex items-center gap-2 p-1 pl-2 rounded-xl hover:bg-slate-100 border border-slate-200 transition"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                  {currentUser.fullName.charAt(0)}
                </div>
                <span className="text-xs font-semibold text-slate-700 hidden sm:inline max-w-[100px] truncate">
                  {currentUser.fullName.split(' ')[0]}
                </span>
              </button>
            ) : (
              <button
                onClick={onOpenAuth}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 transition"
              >
                <User className="w-3.5 h-3.5" />
                <span>Login</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
