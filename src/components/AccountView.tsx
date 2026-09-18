import React, { useState } from 'react';
import { 
  Building2, 
  User, 
  ShieldCheck, 
  Database, 
  CreditCard, 
  CheckCircle2, 
  LogOut, 
  Sparkles, 
  Mail, 
  Phone, 
  MapPin, 
  Award,
  RefreshCw
} from 'lucide-react';
import { UserProfile, UserRole } from '../types';

interface AccountViewProps {
  currentUser: UserProfile | null;
  currentRole: UserRole;
  onOpenAuth: () => void;
  onSignOut: () => void;
  onRoleChange: (role: UserRole) => void;
  firestoreConnected: boolean;
}

export const AccountView: React.FC<AccountViewProps> = ({
  currentUser,
  currentRole,
  onOpenAuth,
  onSignOut,
  onRoleChange,
  firestoreConnected,
}) => {
  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-indigo-500/10 text-indigo-600 rounded-xl border border-indigo-500/20">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">SaaS Profile & Cloud Database</h2>
            <p className="text-xs text-slate-500">
              Enterprise tenant management, PostgreSQL Cloud SQL sync, and multi-tier licensing
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Cloud SQL & Firestore Active</span>
          </div>
        </div>
      </div>

      {currentUser ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Profile Info */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-blue-600 text-white font-bold text-lg flex items-center justify-center shadow-xs">
                  {currentUser.fullName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{currentUser.fullName}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>{currentUser.organizationName}</span>
                    <span>•</span>
                    <span className="capitalize font-semibold text-blue-600">{currentUser.role.replace('_', ' ')}</span>
                  </div>
                </div>
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
                {currentUser.subscriptionPlan} Tier
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-slate-400 font-medium block mb-1">Email Address</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  {currentUser.email}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-slate-400 font-medium block mb-1">Contact Phone</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  {currentUser.phone || '(555) 234-5678'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-slate-400 font-medium block mb-1">Badge & License Number</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1.5 font-mono">
                  <Award className="w-3.5 h-3.5 text-amber-500" />
                  {currentUser.badgeNumber || 'Certified Judicial Officer'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-slate-400 font-medium block mb-1">Primary Jurisdiction Coverage</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                  {currentUser.coverageArea || 'Greater Metropolitan / Countywide'}
                </span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                onClick={onOpenAuth}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              >
                Switch Account / Role
              </button>

              <button
                onClick={onSignOut}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 border border-red-200 transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>

          {/* Database & Subscription Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <Database className="w-4 h-4 text-blue-600" />
              <span>SaaS Data Architecture</span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Your service orders, GPS coordinates, recipient descriptions, and affidavits are persisted to both Cloud SQL (PostgreSQL) and Firebase Firestore.
            </p>

            <div className="space-y-2.5 pt-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-600">Database Engine</span>
                <span className="font-mono font-bold text-slate-800">PostgreSQL (Cloud SQL)</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-600">Real-time Stream</span>
                <span className="font-semibold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Firestore Live
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-600">Tenant Level</span>
                <span className="font-bold text-blue-700 uppercase">{currentUser.subscriptionPlan}</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={onOpenAuth}
                className="w-full py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-xs transition"
              >
                Manage Subscription Plan
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-xs text-center max-w-xl mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center border border-blue-100">
            <User className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">SaaS Account Sign In / Registration</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Create a law firm account or process server credential to persist cases to Cloud SQL, configure automated email/SMS dispatch notifications, and generate digital proof of service.
            </p>
          </div>

          <button
            onClick={onOpenAuth}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-xs transition inline-flex items-center gap-2"
          >
            <User className="w-4 h-4" />
            <span>Open Demo Sign In / Registration</span>
          </button>
        </div>
      )}
    </div>
  );
};
