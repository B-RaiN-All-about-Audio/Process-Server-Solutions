import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  MapPin, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  FileText, 
  ArrowRight, 
  PlusCircle, 
  LayoutGrid, 
  Table as TableIcon,
  ShieldCheck,
  User,
  Zap
} from 'lucide-react';
import { ServiceOrder, ServicePriority, OrderStatus, UserRole } from '../types';

interface OrderListProps {
  orders: ServiceOrder[];
  currentRole: UserRole;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  onSelectOrder: (order: ServiceOrder) => void;
  onLogAttempt: (order: ServiceOrder) => void;
  onViewProof: (order: ServiceOrder) => void;
}

export const OrderList: React.FC<OrderListProps> = ({
  orders,
  currentRole,
  selectedStatus,
  onStatusChange,
  onSelectOrder,
  onLogAttempt,
  onViewProof,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const filteredOrders = orders.filter((order) => {
    // Status filter
    if (selectedStatus !== 'all' && order.status !== selectedStatus) {
      return false;
    }
    // Priority filter
    if (selectedPriority !== 'all' && order.priority !== selectedPriority) {
      return false;
    }
    // Search query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchCase = order.caseNumber.toLowerCase().includes(q);
      const matchRecipient = order.recipientName.toLowerCase().includes(q);
      const matchPlaintiff = order.plaintiff.toLowerCase().includes(q);
      const matchDefendant = order.defendant.toLowerCase().includes(q);
      const matchAddress = order.serviceAddress.toLowerCase().includes(q);
      const matchServer = (order.assignedServerName || '').toLowerCase().includes(q);
      return matchCase || matchRecipient || matchPlaintiff || matchDefendant || matchAddress || matchServer;
    }
    return true;
  });

  const getPriorityBadge = (priority: ServicePriority) => {
    switch (priority) {
      case 'same_day':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <Zap className="w-3 h-3 text-rose-600 fill-rose-600" />
            Same-Day Rush
          </span>
        );
      case 'rush':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            Rush 48h
          </span>
        );
      case 'routine':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
            Routine Service
          </span>
        );
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'served':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            SERVED & VERIFIED
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" />
            IN PROGRESS (ATTEMPTING)
          </span>
        );
      case 'assigned':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
            <User className="w-3.5 h-3.5 text-blue-600" />
            ASSIGNED TO SERVER
          </span>
        );
      case 'non_served':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-800 border border-red-200">
            <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
            NON-SERVED / EVADING
          </span>
        );
      case 'draft':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
            Draft
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="order-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by case #, recipient, plaintiff, defendant, address, or server..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>

          {/* Right controls: Priority filter & View toggle */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-600">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                id="priority-filter-select"
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="bg-transparent border-none text-xs font-medium text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="all">All Priorities</option>
                <option value="same_day">Same-Day Priority</option>
                <option value="rush">Rush (24-48h)</option>
                <option value="routine">Routine</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50 p-0.5">
              <button
                id="view-grid-btn"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition ${viewMode === 'grid' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-400 hover:text-slate-700'}`}
                title="Grid Cards View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                id="view-table-btn"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md transition ${viewMode === 'table' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-400 hover:text-slate-700'}`}
                title="Table View"
              >
                <TableIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Status Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
          {[
            { key: 'all', label: 'All Orders', count: orders.length },
            { key: 'in_progress', label: 'In Progress / Attempting', count: orders.filter(o => o.status === 'in_progress').length },
            { key: 'assigned', label: 'Assigned', count: orders.filter(o => o.status === 'assigned').length },
            { key: 'served', label: 'Served & Verified', count: orders.filter(o => o.status === 'served').length },
            { key: 'non_served', label: 'Non-Served', count: orders.filter(o => o.status === 'non_served').length },
          ].map((tab) => (
            <button
              key={tab.key}
              id={`tab-status-${tab.key}`}
              onClick={() => onStatusChange(tab.key)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition flex items-center gap-1.5 ${
                selectedStatus === tab.key
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                selectedStatus === tab.key ? 'bg-slate-800 text-slate-200' : 'bg-slate-200 text-slate-700'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Orders Grid / Table */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">No service orders found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search keywords or switching filters to view active orders.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredOrders.map((order) => {
            const lastAttempt = order.attempts[order.attempts.length - 1];
            return (
              <div
                key={order.id}
                id={`order-card-${order.id}`}
                className="bg-white rounded-xl border border-slate-200 hover:border-blue-300 shadow-xs hover:shadow-md transition flex flex-col justify-between overflow-hidden group"
              >
                {/* Header info */}
                <div className="p-4 sm:p-5 border-b border-slate-100 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-800 tracking-wide">
                          {order.caseNumber}
                        </span>
                        {getPriorityBadge(order.priority)}
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 mt-1 line-clamp-1 group-hover:text-blue-600 transition">
                        {order.plaintiff} v. {order.defendant}
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-1">{order.courtName}</p>
                    </div>
                    <div>{getStatusBadge(order.status)}</div>
                  </div>

                  {/* Recipient & Address */}
                  <div className="space-y-1.5 pt-1 text-xs">
                    <div className="flex items-start gap-2 text-slate-700">
                      <User className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                      <div>
                        <span className="font-semibold text-slate-900">Serve Target: </span>
                        <span>{order.recipientName}</span>
                        {order.recipientPhone && (
                          <span className="text-slate-500 ml-1.5 font-mono">{order.recipientPhone}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-2 text-slate-600">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                      <span className="line-clamp-2">{order.serviceAddress}</span>
                    </div>

                    {order.assignedServerName && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span>Process Server: </span>
                        <span className="font-medium text-slate-800">{order.assignedServerName}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Field Activity Status Snippet */}
                <div className="px-4 sm:px-5 py-3 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-700">
                      {order.attempts.length} {order.attempts.length === 1 ? 'Attempt' : 'Attempts'} Logged
                    </span>
                    {lastAttempt && (
                      <span className="text-[11px] text-slate-500">
                        • Last: {new Date(lastAttempt.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  {lastAttempt?.verifiedGps && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <MapPin className="w-3 h-3" />
                      GPS Stamped
                    </span>
                  )}
                </div>

                {/* Card Action footer */}
                <div className="p-3 sm:px-5 sm:py-3 bg-white flex items-center justify-between gap-2">
                  <button
                    id={`btn-view-order-${order.id}`}
                    onClick={() => onSelectOrder(order)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition"
                  >
                    View File & History
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center gap-2">
                    {order.status === 'served' && (
                      <button
                        id={`btn-proof-order-${order.id}`}
                        onClick={() => onViewProof(order)}
                        className="px-2.5 py-1 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition"
                      >
                        Proof of Service
                      </button>
                    )}

                    {order.status !== 'served' && (
                      <button
                        id={`btn-log-attempt-${order.id}`}
                        onClick={() => onLogAttempt(order)}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                          currentRole === 'process_server'
                            ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        Log Field Attempt
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Case # / Parties</th>
                  <th className="py-3 px-4">Recipient & Address</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Attempts</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-slate-800">{order.caseNumber}</div>
                      <div className="font-medium text-slate-900 mt-0.5 line-clamp-1">
                        {order.plaintiff} v. {order.defendant}
                      </div>
                      <div className="text-[11px] text-slate-400 line-clamp-1">{order.courtName}</div>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-semibold text-slate-900">{order.recipientName}</div>
                      <div className="text-slate-500 line-clamp-1">{order.serviceAddress}</div>
                    </td>
                    <td className="py-3 px-4">{getPriorityBadge(order.priority)}</td>
                    <td className="py-3 px-4">{getStatusBadge(order.status)}</td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-700">{order.attempts.length} logged</span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onSelectOrder(order)}
                          className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition"
                        >
                          View
                        </button>
                        {order.status !== 'served' ? (
                          <button
                            onClick={() => onLogAttempt(order)}
                            className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white font-medium transition"
                          >
                            Log Attempt
                          </button>
                        ) : (
                          <button
                            onClick={() => onViewProof(order)}
                            className="px-2.5 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-medium transition"
                          >
                            Proof
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
