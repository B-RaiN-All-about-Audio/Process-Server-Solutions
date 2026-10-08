import React from 'react';
import { 
  ShieldCheck, 
  FileText, 
  MapPin, 
  Award, 
  BarChart3, 
  Bell, 
  User, 
  Database, 
  Plus, 
  Radio, 
  Briefcase, 
  Smartphone, 
  LogOut, 
  X,
  ChevronRight
} from 'lucide-react';
import { UserRole, UserProfile, PageTab } from '../types';

interface SidebarProps {
  activeTab: PageTab;
  onSelectTab: (tab: PageTab) => void;
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  ordersCount: number;
  attemptsCount: number;
  servedCount: number;
  unreadCount: number;
  currentUser: UserProfile | null;
  onOpenAuth: () => void;
  onSignOut: () => void;
  onOpenNewOrder: () => void;
  onSimulateFieldAction: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  firestoreConnected: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  currentRole,
  onRoleChange,
  ordersCount,
  attemptsCount,
  servedCount,
  unreadCount,
  currentUser,
  onOpenAuth,
  onSignOut,
  onOpenNewOrder,
  onSimulateFieldAction,
  isOpenMobile,
  onCloseMobile,
  firestoreConnected,
}) => {
  const navItems: Array<{
    id: PageTab;
    label: string;
    icon: React.ElementType;
    badge?: number | string;
    badgeColor?: string;
    description: string;
  }> = [
    {
      id: 'orders',
      label: 'Service Orders',
      icon: FileText,
      badge: ordersCount,
      badgeColor: 'bg-teal-500/20 text-teal-300 border border-teal-500/30',
      description: 'Active cases & court summons',
    },
    {
      id: 'field',
      label: 'Field Command',
      icon: MapPin,
      badge: attemptsCount,
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
      description: 'GPS attempts & server logs',
    },
    {
      id: 'affidavits',
      label: 'Proof of Service',
      icon: ShieldCheck,
      badge: servedCount,
      badgeColor: 'bg-teal-500/20 text-teal-300 border border-teal-500/30',
      description: 'Legal affidavits & signatures',
    },
    {
      id: 'analytics',
      label: 'Metrics & Reports',
      icon: BarChart3,
      description: 'Turnaround & success rates',
    },
    {
      id: 'notifications',
      label: 'Dispatch Alerts',
      icon: Bell,
      badge: unreadCount > 0 ? unreadCount : undefined,
      badgeColor: 'bg-red-500 text-white font-bold animate-pulse',
      description: 'Real-time multi-channel feed',
    },
    {
      id: 'account',
      label: 'SaaS Account',
      icon: User,
      badge: currentUser ? currentUser.subscriptionPlan.toUpperCase() : 'FREE',
      badgeColor: 'bg-slate-700 text-slate-300 text-[10px]',
      description: 'Profile & Cloud SQL database',
    },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div 
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-slate-900 border-r border-slate-800 text-white flex flex-col transition-transform duration-200 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Brand Bar */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-teal-600 flex items-center justify-center shadow-inner shadow-teal-400/20 shrink-0">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight text-white">
                  ProcessServer<span className="text-teal-500">Solutions</span>
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-medium bg-teal-500/15 text-teal-500 border border-teal-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span>
                  Live Dispatch
                </span>
                <span className="text-[10px] text-slate-400">Cloud SQL DB</span>
              </div>
            </div>
          </div>

          {/* Close button on mobile */}
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role Perspective Switcher Box */}
        <div className="px-4 pt-3 pb-2 border-b border-slate-800/60 shrink-0">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
            <span>Active Perspective</span>
            <span className="text-[10px] text-teal-500">Toggle View</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950/60 rounded-xl border border-slate-800">
            <button
              id="sidebar-role-client-btn"
              onClick={() => onRoleChange('client')}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-xs font-semibold transition ${
                currentRole === 'client'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5" />
                <span>Client / Firm</span>
              </div>
              <span className="text-[9px] opacity-75 mt-0.5">Attorney Portal</span>
            </button>

            <button
              id="sidebar-role-server-btn"
              onClick={() => onRoleChange('process_server')}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-xs font-semibold transition ${
                currentRole === 'process_server'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5" />
                <span>Server App</span>
              </div>
              <span className="text-[9px] opacity-75 mt-0.5">Field Command</span>
            </button>
          </div>
        </div>

        {/* Primary Action Button */}
        <div className="px-4 py-3 shrink-0">
          <button
            id="sidebar-new-order-btn"
            onClick={() => {
              onOpenNewOrder();
              onCloseMobile();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-slate-700 to-teal-600 hover:from-slate-600 hover:to-teal-500 text-white shadow-sm shadow-teal-600/30 transition active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>New Service Order</span>
          </button>
        </div>

        {/* Navigation Page Tabs Listed on Left */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          <div className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Navigation Pages
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                id={`sidebar-tab-${item.id}`}
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition group ${
                  isActive
                    ? 'bg-teal-600 text-white font-semibold shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-1.5 rounded-lg transition ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400 group-hover:text-teal-500'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-medium truncate">{item.label}</div>
                    <div className={`text-[10px] truncate ${isActive ? 'text-teal-100' : 'text-slate-400'}`}>
                      {item.description}
                    </div>
                  </div>
                </div>

                {item.badge !== undefined && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ml-2 ${
                    isActive ? 'bg-white/25 text-white' : (item.badgeColor || 'bg-slate-800 text-slate-300')
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Quick Simulation & Activity Trigger */}
        <div className="px-4 py-2 border-t border-slate-800/80 shrink-0">
          <button
            id="sidebar-simulate-btn"
            onClick={onSimulateFieldAction}
            title="Trigger a live simulated process server field attempt"
            className="w-full flex items-center justify-between p-2 rounded-xl text-xs bg-slate-950/60 hover:bg-slate-800/80 text-slate-300 border border-slate-800 transition"
          >
            <div className="flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-teal-500 animate-pulse" />
              <span className="font-medium">Simulate Field Event</span>
            </div>
            <span className="text-[10px] text-teal-500">Test Feed</span>
          </button>
        </div>

        {/* User Account & Database Status Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/80 shrink-0">
          {currentUser ? (
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={() => {
                  onSelectTab('account');
                  onCloseMobile();
                }}
                className="flex items-center gap-2.5 min-w-0 text-left hover:opacity-90 transition flex-1"
              >
                <div className="w-8 h-8 rounded-lg bg-teal-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                  {currentUser.fullName.charAt(0)}
                </div>
                <div className="truncate">
                  <div className="text-xs font-bold text-white truncate">
                    {currentUser.fullName}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {currentUser.organizationName}
                  </div>
                </div>
              </button>

              <button
                onClick={onSignOut}
                title="Sign Out"
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              id="sidebar-login-btn"
              onClick={() => {
                onOpenAuth();
                onCloseMobile();
              }}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-teal-500 border border-teal-500/30 transition"
            >
              <User className="w-3.5 h-3.5" />
              <span>Sign In / Demo Login</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
