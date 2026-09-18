import React, { useState } from 'react';
import { 
  MapPin, 
  Navigation, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  User, 
  Camera, 
  FileText, 
  ShieldCheck, 
  PlusCircle, 
  Compass, 
  Search,
  ChevronRight
} from 'lucide-react';
import { ServiceOrder, ServiceAttempt, UserRole } from '../types';

interface FieldCommandViewProps {
  orders: ServiceOrder[];
  currentRole: UserRole;
  onLogAttempt: (order: ServiceOrder) => void;
  onSelectOrder: (order: ServiceOrder) => void;
  onViewProof: (order: ServiceOrder) => void;
}

export const FieldCommandView: React.FC<FieldCommandViewProps> = ({
  orders,
  currentRole,
  onLogAttempt,
  onSelectOrder,
  onViewProof,
}) => {
  const [filterOutcome, setFilterOutcome] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Collect all attempts across all orders with their parent order reference
  const allAttemptsWithOrder = orders.flatMap((order) =>
    order.attempts.map((att) => ({
      ...att,
      orderCaseNumber: order.caseNumber,
      orderRecipient: order.recipientName,
      orderAddress: order.serviceAddress,
      orderPriority: order.priority,
      orderStatus: order.status,
      orderRef: order,
    }))
  ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const filteredAttempts = allAttemptsWithOrder.filter((item) => {
    if (filterOutcome !== 'all' && item.outcome !== filterOutcome) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchServer = item.serverName.toLowerCase().includes(q);
      const matchRecipient = item.orderRecipient.toLowerCase().includes(q);
      const matchCase = item.orderCaseNumber.toLowerCase().includes(q);
      const matchAddress = item.locationAddress.toLowerCase().includes(q);
      const matchNotes = item.notes.toLowerCase().includes(q);
      return matchServer || matchRecipient || matchCase || matchAddress || matchNotes;
    }
    return true;
  });

  const activeOrdersForService = orders.filter(
    (o) => o.status === 'in_progress' || o.status === 'assigned'
  );

  const getOutcomeBadge = (outcome: ServiceAttempt['outcome']) => {
    switch (outcome) {
      case 'personal_service':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Personal Service Executed
          </span>
        );
      case 'substituted_service':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-100 text-teal-800 border border-teal-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
            Substituted Service
          </span>
        );
      case 'no_answer':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            No Answer / Knock
          </span>
        );
      case 'resident_not_home':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            Not Home (Stakeout)
          </span>
        );
      case 'refused_service':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
            <XCircle className="w-3.5 h-3.5 text-red-600" />
            Subject Refused
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
            <AlertTriangle className="w-3.5 h-3.5 text-slate-600" />
            {outcome.replace('_', ' ')}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-amber-500/10 text-amber-600 rounded-xl border border-amber-500/20">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Process Server Field Intelligence</h2>
            <p className="text-xs text-slate-500">
              Live GPS-verified attempt logs, physical descriptions, field photographs, and digital affidavits
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-200">
            {allAttemptsWithOrder.length} Total Attempts Logged
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200">
            100% GPS Geocoded
          </span>
        </div>
      </div>

      {/* Quick Dispatch: Active Matters Ready for Field Logging */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Active Service Route Queue</h3>
            <p className="text-xs text-slate-500">Select any active summons to record an on-scene field attempt</p>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            {activeOrdersForService.length} Ready for Serve
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {activeOrdersForService.map((ord) => (
            <div 
              key={ord.id}
              className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-blue-400 hover:shadow-xs transition flex flex-col justify-between gap-3"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-mono text-xs font-bold text-slate-800">{ord.caseNumber}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${
                    ord.priority === 'same_day' 
                      ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                      : ord.priority === 'rush' 
                        ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                        : 'bg-blue-100 text-blue-800 border border-blue-200'
                  }`}>
                    {ord.priority.replace('_', ' ')}
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-900">{ord.recipientName}</div>
                <div className="text-xs text-slate-500 flex items-center gap-1 mt-1 truncate">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{ord.serviceAddress}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-200/80">
                <button
                  id={`field-log-attempt-${ord.id}`}
                  onClick={() => onLogAttempt(ord)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Log Field Attempt</span>
                </button>
                <button
                  onClick={() => onSelectOrder(ord)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition"
                  title="View order details"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Field Activity Log Feed */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Real-Time Field Activity Timeline</h3>
            <p className="text-xs text-slate-500">Every recorded knock, witness interview, and completed service</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search server, address, subject..."
                className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-44 sm:w-56"
              />
            </div>

            {/* Filter by outcome */}
            <select
              value={filterOutcome}
              onChange={(e) => setFilterOutcome(e.target.value)}
              className="py-1.5 px-2.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Outcomes</option>
              <option value="personal_service">Personal Service</option>
              <option value="substituted_service">Substituted Service</option>
              <option value="no_answer">No Answer</option>
              <option value="resident_not_home">Resident Not Home</option>
              <option value="refused_service">Refused</option>
            </select>
          </div>
        </div>

        {filteredAttempts.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <MapPin className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold">No field attempts match your current criteria</p>
            <p className="text-xs text-slate-400 mt-1">Try resetting search filters or logging a new attempt above.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredAttempts.map((att) => (
              <div key={att.id} className="p-4 sm:p-5 hover:bg-slate-50/70 transition space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    {getOutcomeBadge(att.outcome)}
                    <span className="font-mono text-xs font-bold text-slate-700">
                      {att.orderCaseNumber}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs font-semibold text-slate-800">
                      Target: {att.orderRecipient}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{new Date(att.timestamp).toLocaleString()}</span>
                  </div>
                </div>

                {/* Server Info & GPS Location */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span>
                      Server: <strong className="text-slate-800">{att.serverName}</strong> (Badge #{att.serverBadgeId})
                    </span>
                  </div>

                  <div className="flex items-center gap-2 truncate">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">
                      GPS Verified: {att.latitude.toFixed(4)}, {att.longitude.toFixed(4)} — {att.locationAddress}
                    </span>
                  </div>
                </div>

                {/* Field Notes */}
                <p className="text-xs sm:text-sm text-slate-700 italic bg-white p-3 rounded-xl border border-slate-200/80">
                  "{att.notes}"
                </p>

                {/* Recipient description if present */}
                {att.recipientDescription && (
                  <div className="text-xs bg-amber-50/70 p-3 rounded-xl border border-amber-200/60 text-amber-900 flex flex-wrap gap-x-4 gap-y-1">
                    <span className="font-semibold">Recipient Physical Profile:</span>
                    <span>Age: ~{att.recipientDescription.approxAge}</span>
                    <span>Gender: {att.recipientDescription.gender}</span>
                    <span>Height: {att.recipientDescription.height}</span>
                    <span>Weight: {att.recipientDescription.weight}</span>
                    <span>Hair: {att.recipientDescription.hairColor}</span>
                    <span>Glasses: {att.recipientDescription.wearsGlasses ? 'Yes' : 'No'}</span>
                    {att.recipientDescription.distinguishingFeatures && (
                      <span>Notes: {att.recipientDescription.distinguishingFeatures}</span>
                    )}
                  </div>
                )}

                {/* Photo & Actions */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-3">
                    {att.photoUrl && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-blue-600 font-medium">
                        <Camera className="w-3.5 h-3.5" />
                        Photographic Evidence Timestamped
                      </span>
                    )}
                    {att.signatureUrl && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Digital Handover Signature Captured
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSelectOrder(att.orderRef)}
                      className="px-3 py-1 rounded-lg text-xs font-semibold text-slate-700 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 transition"
                    >
                      Case Details
                    </button>
                    {(att.outcome === 'personal_service' || att.outcome === 'substituted_service') && (
                      <button
                        onClick={() => onViewProof(att.orderRef)}
                        className="px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition"
                      >
                        View Affidavit
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
