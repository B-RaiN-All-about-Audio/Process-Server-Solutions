import React, { useState } from 'react';
import { 
  ShieldCheck, 
  FileCheck, 
  Printer, 
  CheckCircle2, 
  Clock, 
  Search, 
  Building2, 
  Calendar, 
  User, 
  MapPin,
  Download
} from 'lucide-react';
import { ServiceOrder, UserRole } from '../types';

interface AffidavitsViewProps {
  orders: ServiceOrder[];
  currentRole: UserRole;
  onViewProof: (order: ServiceOrder) => void;
  onSelectOrder: (order: ServiceOrder) => void;
}

export const AffidavitsView: React.FC<AffidavitsViewProps> = ({
  orders,
  currentRole,
  onViewProof,
  onSelectOrder,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const servedOrders = orders.filter((o) => o.status === 'served');

  const filteredServed = servedOrders.filter((order) => {
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchCase = order.caseNumber.toLowerCase().includes(q);
      const matchCourt = order.courtName.toLowerCase().includes(q);
      const matchRecipient = order.recipientName.toLowerCase().includes(q);
      const matchServer = (order.assignedServerName || '').toLowerCase().includes(q);
      const matchFirm = order.clientFirm.toLowerCase().includes(q);
      return matchCase || matchCourt || matchRecipient || matchServer || matchFirm;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl border border-emerald-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Legal Proof of Service & Court Affidavits</h2>
            <p className="text-xs text-slate-500">
              Judicial Council compliant declarations of service, server badge certifications, and timestamped returns
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-bold">
            {servedOrders.length} Executed Affidavits Ready
          </span>
        </div>
      </div>

      {/* Affidavit Records Table / Cards */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Affidavit Archive & Court Filing Returns</h3>
            <p className="text-xs text-slate-500">Click any affidavit below to review signature, legal statements, or print</p>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search case #, court, recipient..."
              className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-56 sm:w-64"
            />
          </div>
        </div>

        {filteredServed.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <FileCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold">No executed proof of service records found</p>
            <p className="text-xs text-slate-400 mt-1">
              Once an order is marked as served or personal service is executed in Field Command, certified affidavits generate here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredServed.map((order) => {
              const successfulAttempt = order.attempts.find(
                (a) => a.outcome === 'personal_service' || a.outcome === 'substituted_service'
              ) || order.attempts[order.attempts.length - 1];

              return (
                <div key={order.id} className="p-4 sm:p-5 hover:bg-slate-50/70 transition flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {order.caseNumber}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Executed & Ready
                      </span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-600 font-medium">
                        {order.courtName}
                      </span>
                    </div>

                    <div className="text-sm font-bold text-slate-900">
                      Party Served: {order.recipientName}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-500 pt-1">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>Server: <strong className="text-slate-700">{order.assignedServerName || 'Certified Server'}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Signed At: {order.proofOfServiceSignedAt ? new Date(order.proofOfServiceSignedAt).toLocaleDateString() : 'Today'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 sm:col-span-2 truncate">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{order.serviceAddress}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                    <button
                      onClick={() => onSelectOrder(order)}
                      className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 transition"
                    >
                      Matter Details
                    </button>
                    <button
                      id={`view-proof-btn-${order.id}`}
                      onClick={() => onViewProof(order)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>View & Print Affidavit</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
