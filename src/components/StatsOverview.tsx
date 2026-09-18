import React from 'react';
import { CheckCircle, Clock, Zap, FileCheck } from 'lucide-react';
import { ServiceOrder, UserRole, UserProfile } from '../types';

interface StatsOverviewProps {
  orders: ServiceOrder[];
  currentRole: UserRole;
  onFilterByStatus: (status: string) => void;
  activeStatusFilter: string;
  currentUser?: UserProfile | null;
  onOpenAuth?: () => void;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({
  orders,
  currentRole,
  onFilterByStatus,
  activeStatusFilter,
}) => {
  const totalOrders = orders.length;
  const servedOrders = orders.filter((o) => o.status === 'served').length;
  const inProgressOrders = orders.filter((o) => o.status === 'in_progress').length;
  const assignedOrders = orders.filter((o) => o.status === 'assigned').length;
  const rushOrders = orders.filter((o) => o.priority === 'rush' || o.priority === 'same_day').length;

  const totalAttempts = orders.reduce((acc, o) => acc + o.attempts.length, 0);
  const serveSuccessRate = totalOrders > 0 ? Math.round((servedOrders / totalOrders) * 100) : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* Total Orders Card */}
      <button
        id="stat-all-orders"
        onClick={() => onFilterByStatus('all')}
        className={`text-left p-4 rounded-xl border bg-white shadow-xs transition hover:border-blue-400 hover:shadow-sm ${
          activeStatusFilter === 'all' ? 'ring-2 ring-blue-500 border-blue-500' : 'border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Matters</span>
          <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
            <FileCheck className="w-4 h-4" />
          </span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-extrabold text-slate-900">{totalOrders}</span>
          <span className="text-xs text-slate-500">active files</span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1">
          {rushOrders} marked Rush or Same-Day
        </p>
      </button>

      {/* Served Successfully */}
      <button
        id="stat-served-orders"
        onClick={() => onFilterByStatus('served')}
        className={`text-left p-4 rounded-xl border bg-white shadow-xs transition hover:border-emerald-400 hover:shadow-sm ${
          activeStatusFilter === 'served' ? 'ring-2 ring-emerald-500 border-emerald-500' : 'border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Served & Executed</span>
          <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
            <CheckCircle className="w-4 h-4" />
          </span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-extrabold text-emerald-700">{servedOrders}</span>
          <span className="text-xs text-emerald-600 font-medium">({serveSuccessRate}%)</span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1">
          Affidavit proof of service ready
        </p>
      </button>

      {/* In Field / In Progress */}
      <button
        id="stat-progress-orders"
        onClick={() => onFilterByStatus('in_progress')}
        className={`text-left p-4 rounded-xl border bg-white shadow-xs transition hover:border-amber-400 hover:shadow-sm ${
          activeStatusFilter === 'in_progress' ? 'ring-2 ring-amber-500 border-amber-500' : 'border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">In Progress</span>
          <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
            <Clock className="w-4 h-4" />
          </span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-extrabold text-amber-700">{inProgressOrders}</span>
          <span className="text-xs text-slate-500">active field</span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1">
          {totalAttempts} GPS field attempts logged
        </p>
      </button>

      {/* Assigned / Awaiting Attempt */}
      <button
        id="stat-assigned-orders"
        onClick={() => onFilterByStatus('assigned')}
        className={`text-left p-4 rounded-xl border bg-white shadow-xs transition hover:border-indigo-400 hover:shadow-sm ${
          activeStatusFilter === 'assigned' ? 'ring-2 ring-indigo-500 border-indigo-500' : 'border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Assigned Queue</span>
          <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
            <Zap className="w-4 h-4" />
          </span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-extrabold text-indigo-700">{assignedOrders}</span>
          <span className="text-xs text-slate-500">ready to run</span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1">
          Target turnaround &lt; 24 hrs
        </p>
      </button>
    </div>
  );
};
