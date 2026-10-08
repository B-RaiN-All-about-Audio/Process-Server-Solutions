import React from 'react';
import { 
  BarChart3, 
  CheckCircle2, 
  Clock, 
  Zap, 
  MapPin, 
  TrendingUp, 
  ShieldCheck, 
  Calendar,
  AlertCircle
} from 'lucide-react';
import { ServiceOrder, UserRole } from '../types';

interface AnalyticsViewProps {
  orders: ServiceOrder[];
  currentRole: UserRole;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  orders,
  currentRole,
}) => {
  const total = orders.length;
  const served = orders.filter((o) => o.status === 'served').length;
  const inProgress = orders.filter((o) => o.status === 'in_progress').length;
  const assigned = orders.filter((o) => o.status === 'assigned').length;
  const nonServed = orders.filter((o) => o.status === 'non_served').length;

  const sameDay = orders.filter((o) => o.priority === 'same_day').length;
  const rush = orders.filter((o) => o.priority === 'rush').length;
  const routine = orders.filter((o) => o.priority === 'routine').length;

  const totalAttempts = orders.reduce((acc, o) => acc + o.attempts.length, 0);
  const successRate = total > 0 ? Math.round((served / total) * 100) : 0;
  const avgAttemptsPerMatter = total > 0 ? (totalAttempts / total).toFixed(1) : '0.0';

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-teal-500/10 text-teal-600 rounded-xl border border-teal-500/20">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Legal Dispatch Operational Intelligence</h2>
            <p className="text-xs text-slate-500">
              Service velocity, priority turnaround benchmarks, and field performance metrics
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className="px-3 py-1.5 rounded-xl bg-teal-50 text-teal-900 border border-teal-200">
            {total} Active Legal Matters
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-teal-50 text-teal-900 border border-teal-200">
            {successRate}% Success Rate
          </span>
        </div>
      </div>

      {/* Top 4 KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Service Success</span>
            <CheckCircle2 className="w-4 h-4 text-teal-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{successRate}%</div>
          <p className="text-[11px] text-slate-500 mt-1">{served} of {total} matters completed</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Field Attempts</span>
            <MapPin className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{totalAttempts}</div>
          <p className="text-[11px] text-slate-500 mt-1">{avgAttemptsPerMatter} avg per case file</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Rush & Same-Day</span>
            <Zap className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{sameDay + rush}</div>
          <p className="text-[11px] text-slate-500 mt-1">{sameDay} Same-day, {rush} Rush</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Active Field Pipeline</span>
            <Clock className="w-4 h-4 text-teal-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{inProgress + assigned}</div>
          <p className="text-[11px] text-slate-500 mt-1">{inProgress} in-progress, {assigned} assigned</p>
        </div>
      </div>

      {/* Breakdown Grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Case Status Distribution</h3>
          
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                <span>Served & Executed</span>
                <span>{served} ({total > 0 ? Math.round((served / total) * 100) : 0}%)</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-teal-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${total > 0 ? (served / total) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                <span>In Progress (Active Attempts)</span>
                <span>{inProgress} ({total > 0 ? Math.round((inProgress / total) * 100) : 0}%)</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-teal-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${total > 0 ? (inProgress / total) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                <span>Assigned to Server</span>
                <span>{assigned} ({total > 0 ? Math.round((assigned / total) * 100) : 0}%)</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-amber-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${total > 0 ? (assigned / total) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                <span>Non-Served / Diligence Exhausted</span>
                <span>{nonServed} ({total > 0 ? Math.round((nonServed / total) * 100) : 0}%)</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-rose-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${total > 0 ? (nonServed / total) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Priority Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Service Urgency Breakdown</h3>

          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-rose-900">Same-Day Urgent Dispatch</div>
                <div className="text-[11px] text-rose-700">Sub-4 hour initial attempt target</div>
              </div>
              <span className="text-base font-extrabold text-rose-800">{sameDay}</span>
            </div>

            <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-amber-900">Rush Service</div>
                <div className="text-[11px] text-amber-700">Sub-24 hour initial attempt target</div>
              </div>
              <span className="text-base font-extrabold text-amber-800">{rush}</span>
            </div>

            <div className="p-3 rounded-xl bg-teal-50/70 border border-teal-200 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-teal-900">Routine Service</div>
                <div className="text-[11px] text-teal-700">Standard 3-5 day attempt window</div>
              </div>
              <span className="text-base font-extrabold text-teal-800">{routine}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
