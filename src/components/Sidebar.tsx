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
  LogOut, 
  X,
  ChevronRight,
  Receipt
} from 'lucide-react';
import { UserRole, UserProfile, PageTab } from '../types';
import { BrandLogo } from './BrandLogo';

interface SidebarProps {
  activeTab: PageTab;
  onSelectTab: (tab: PageTab) => void;
  currentRole?: UserRole;
  onRoleChange?: (role: UserRole) => void;
  ordersCount: number;
  attemptsCount: number;
  servedCount: number;
  unreadCount: number;
  currentUser: UserProfile | null;
  onOpenAuth: () => void;
  onSignOut: () => void;
  onOpenNewOrder: () => void;
  onSimulateFieldAction?: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  firestoreConnected: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  currentRole: _currentRole,
  onRoleChange: _onRoleChange,
  ordersCount,
  attemptsCount,
  servedCount,
  unreadCount,
  currentUser,
  onOpenAuth,
  onSignOut,
  onOpenNewOrder,
  onSimulateFieldAction: _onSimulateFieldAction,
  isOpenMobile,
  onCloseMobile,
  firestoreConnected: _firestoreConnected,
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
      badgeColor: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
      description: 'Active cases & court summons',
    },
    {
      id: 'invoices',
      label: 'Service Invoices',
      icon: Receipt,
      description: 'Standard format & Stripe billing',
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
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
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
          className="fixed inset-0 z-40 bg-slate-700/50 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 z-50 w-80 bg-slate-800 border-r border-slate-700 text-white flex flex-col transition-transform duration-200 ease-in-out shadow-2xl lg:shadow-none ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Brand Bar */}
        <div className="p-5 border-b border-slate-800/80 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <BrandLogo 
              variant="dark" 
              onClick={() => onSelectTab('orders')} 
              className="min-w-0 flex-1"
            />

            {/* Close button on mobile drawer */}
            <button
              onClick={onCloseMobile}
              className="p-2 -mr-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition lg:hidden shrink-0"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
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
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-sm shadow-blue-600/30 transition active:scale-98"
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
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-1.5 rounded-lg transition ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400 group-hover:text-blue-400'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-medium truncate">{item.label}</div>
                    <div className={`text-[10px] truncate ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
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

        {/* User Account & Database Status Footer */}
        <div className="p-3 border-t border-slate-700 bg-slate-800/90 shrink-0">
          {currentUser ? (
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={() => {
                  onSelectTab('account');
                  onCloseMobile();
                }}
                className="flex items-center gap-2.5 min-w-0 text-left hover:opacity-90 transition flex-1"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
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
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-blue-400 border border-blue-500/30 transition"
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
