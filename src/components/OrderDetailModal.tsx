import React from 'react';
import { 
  X, 
  MapPin, 
  Calendar, 
  Clock, 
  FileText, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Phone, 
  Mail, 
  ExternalLink, 
  Camera, 
  User, 
  FileCheck,
  Navigation,
  Copy,
  PlusCircle
} from 'lucide-react';
import { ServiceOrder, ServiceAttempt, UserRole } from '../types';

interface OrderDetailModalProps {
  order: ServiceOrder | null;
  onClose: () => void;
  currentRole: UserRole;
  onLogAttempt: (order: ServiceOrder) => void;
  onViewProof: (order: ServiceOrder) => void;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  order,
  onClose,
  currentRole,
  onLogAttempt,
  onViewProof,
}) => {
  if (!order) return null;

  const [copied, setCopied] = React.useState(false);

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(order.serviceAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getOutcomeLabel = (outcome: ServiceAttempt['outcome']) => {
    switch (outcome) {
      case 'personal_service':
        return { label: 'Personal Service (Directly to Subject)', color: 'text-teal-700 bg-teal-50 border-teal-200' };
      case 'substituted_service':
        return { label: 'Substituted Service (Co-occupant / Agent)', color: 'text-teal-700 bg-teal-50 border-teal-200' };
      case 'resident_not_home':
        return { label: 'Resident Not Home (Knocked & Inquired)', color: 'text-amber-700 bg-amber-50 border-amber-200' };
      case 'no_answer':
        return { label: 'No Answer / Door Unanswered', color: 'text-amber-700 bg-amber-50 border-amber-200' };
      case 'address_vacant':
        return { label: 'Address Vacant / Relocated', color: 'text-red-700 bg-red-50 border-red-200' };
      case 'refused_service':
        return { label: 'Service Refused / Hostile / Evading', color: 'text-rose-700 bg-rose-50 border-rose-200' };
      case 'bad_address':
      default:
        return { label: 'Bad Address / Diligent Search Needed', color: 'text-slate-700 bg-slate-100 border-slate-200' };
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-6 bg-slate-900 text-white flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-bold bg-slate-800 px-2.5 py-1 rounded border border-slate-700 text-teal-500">
                {order.caseNumber}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                order.priority === 'same_day' 
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : order.priority === 'rush'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-slate-800 text-slate-300 border border-slate-700'
              }`}>
                {order.priority.toUpperCase()} PRIORITY
              </span>
              {order.status === 'served' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  SERVED
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <Clock className="w-3.5 h-3.5" />
                  IN PROGRESS
                </span>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-bold mt-2 text-white">
              {order.plaintiff} v. {order.defendant}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">{order.courtName}</p>
          </div>
          <button
            id="close-order-modal-btn"
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 divide-y divide-slate-200">

          {/* Top Quick Actions Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>Created: {new Date(order.createdAt).toLocaleDateString()}</span>
              <span>•</span>
              <span className="text-rose-600 font-semibold">
                Deadline: {new Date(order.deadlineDate).toLocaleDateString()}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {order.status === 'served' ? (
                <button
                  id="view-proof-action-btn"
                  onClick={() => onViewProof(order)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white shadow-xs transition"
                >
                  <FileCheck className="w-4 h-4" />
                  Inspect Official Proof of Service
                </button>
              ) : (
                <button
                  id="log-attempt-action-btn"
                  onClick={() => onLogAttempt(order)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-xs transition"
                >
                  <PlusCircle className="w-4 h-4" />
                  Log New Field Attempt
                </button>
              )}
            </div>
          </div>

          {/* Section: Service Target & Location */}
          <div className="pt-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Service Target & Address
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Recipient Details */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <User className="w-4 h-4 text-teal-600" />
                  <span>Target: {order.recipientName}</span>
                </div>
                {order.recipientPhone && (
                  <p className="text-xs text-slate-600 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>Phone: {order.recipientPhone}</span>
                  </p>
                )}
                <div className="text-xs text-slate-500 pt-1">
                  <span className="font-semibold text-slate-700">Client / Requesting Attorney:</span>
                  <div>{order.clientName} ({order.clientFirm})</div>
                  <div className="flex items-center gap-3 text-slate-600 mt-1">
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3 text-slate-400" />
                      {order.clientEmail}
                    </span>
                    <span>{order.clientPhone}</span>
                  </div>
                </div>
              </div>

              {/* Service Address & Notes */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <div className="font-bold text-slate-900">{order.serviceAddress}</div>
                      {order.alternateAddress && (
                        <div className="text-slate-500 mt-1">
                          <span className="font-medium text-slate-700">Alternate: </span>
                          {order.alternateAddress}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={handleCopyAddress}
                    className="p-1.5 rounded-md hover:bg-slate-200 text-slate-500 transition"
                    title="Copy Address"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                {copied && (
                  <span className="text-[10px] text-teal-600 font-medium block">
                    Address copied to clipboard!
                  </span>
                )}

                {order.specialInstructions && (
                  <div className="mt-2 p-2 rounded bg-amber-50 border border-amber-200 text-xs text-amber-900">
                    <span className="font-bold">Instructions: </span>
                    {order.specialInstructions}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section: Documents Included */}
          <div className="pt-6 space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Legal Documents in Service Packet ({order.documentTypes.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {order.documentTypes.map((doc, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 text-teal-900 border border-teal-200 text-xs font-medium"
                >
                  <FileText className="w-3.5 h-3.5 text-teal-600" />
                  {doc}
                </span>
              ))}
            </div>
          </div>

          {/* Section: Field Attempt Timeline */}
          <div className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Field Attempt History & Live Activity ({order.attempts.length})
              </h3>
              {order.assignedServerName && (
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                  Assigned Server: <strong>{order.assignedServerName}</strong>
                </span>
              )}
            </div>

            {order.attempts.length === 0 ? (
              <div className="p-6 rounded-xl border border-dashed border-slate-300 text-center bg-slate-50/50">
                <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-medium text-slate-600">No field attempts logged yet.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  The process server will record their first GPS-verified visit shortly.
                </p>
              </div>
            ) : (
              <div className="space-y-4 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200">
                {order.attempts.map((attempt, index) => {
                  const outcomeMeta = getOutcomeLabel(attempt.outcome);
                  return (
                    <div key={attempt.id} className="relative pl-8 space-y-2">
                      {/* Timeline dot */}
                      <div className={`absolute left-2 top-1.5 -translate-x-1/2 w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center ${
                        attempt.outcome === 'personal_service' || attempt.outcome === 'substituted_service'
                          ? 'border-teal-500'
                          : 'border-amber-500'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          attempt.outcome === 'personal_service' || attempt.outcome === 'substituted_service'
                            ? 'bg-teal-500'
                            : 'bg-amber-500'
                        }`} />
                      </div>

                      {/* Attempt Card */}
                      <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">
                              Attempt #{index + 1}
                            </span>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${outcomeMeta.color}`}>
                              {outcomeMeta.label}
                            </span>
                          </div>
                          <span className="text-xs text-slate-500 flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {new Date(attempt.timestamp).toLocaleString([], {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>

                        {/* Location & GPS badge */}
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="font-medium text-slate-800">{attempt.locationAddress}</span>
                          {attempt.verifiedGps && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-teal-100 text-teal-800 font-mono text-[10px] rounded font-bold">
                              GPS: {attempt.latitude.toFixed(4)}, {attempt.longitude.toFixed(4)} ✓
                            </span>
                          )}
                          <span className="text-slate-400 ml-auto">
                            Server: {attempt.serverName} ({attempt.serverBadgeId})
                          </span>
                        </div>

                        {/* Recipient Details (if served) */}
                        {attempt.recipientNameServed && (
                          <div className="p-2.5 rounded-lg bg-teal-50/70 border border-teal-200 text-xs text-teal-950 space-y-1">
                            <div className="font-bold flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                              Served to: {attempt.recipientNameServed} ({attempt.relationshipToRecipient})
                            </div>
                            {attempt.recipientDescription && (
                              <div className="text-[11px] text-teal-800 grid grid-cols-2 sm:grid-cols-3 gap-1 pt-1 border-t border-teal-200/50">
                                <div><span className="font-medium">Age:</span> ~{attempt.recipientDescription.approxAge}</div>
                                <div><span className="font-medium">Height:</span> {attempt.recipientDescription.height}</div>
                                <div><span className="font-medium">Weight:</span> {attempt.recipientDescription.weight}</div>
                                <div><span className="font-medium">Hair:</span> {attempt.recipientDescription.hairColor}</div>
                                <div><span className="font-medium">Glasses:</span> {attempt.recipientDescription.wearsGlasses ? 'Yes' : 'No'}</div>
                                {attempt.recipientDescription.distinguishingFeatures && (
                                  <div className="col-span-2 sm:col-span-3">
                                    <span className="font-medium">Features:</span> {attempt.recipientDescription.distinguishingFeatures}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Server Notes */}
                        {attempt.notes && (
                          <div className="text-xs text-slate-700 bg-white p-2 rounded border border-slate-200/70">
                            <span className="font-semibold text-slate-800">Field Notes: </span>
                            {attempt.notes}
                          </div>
                        )}

                        {/* Photo Evidence & Signature */}
                        <div className="flex flex-wrap items-center gap-3 pt-1">
                          {attempt.photoUrl && (
                            <div className="space-y-1">
                              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                <Camera className="w-3 h-3 text-slate-400" />
                                Photo Verification
                              </span>
                              <img
                                src={attempt.photoUrl}
                                alt="Field attempt proof"
                                className="w-24 h-16 object-cover rounded-lg border border-slate-300 shadow-xs hover:scale-105 transition cursor-pointer"
                                onClick={() => window.open(attempt.photoUrl, '_blank')}
                              />
                            </div>
                          )}

                          {attempt.signatureUrl && (
                            <div className="space-y-1">
                              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                                Server Verification Stamp
                              </span>
                              <div className="p-1 bg-slate-50 border border-slate-200 rounded flex items-center justify-center">
                                <img
                                  src={attempt.signatureUrl}
                                  alt="Server signature"
                                  className="h-10 w-28 object-contain"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            {order.status === 'served' ? (
              <span className="text-teal-700 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-teal-600" />
                Service legally completed on {new Date(order.proofOfServiceSignedAt || order.updatedAt).toLocaleDateString()}
              </span>
            ) : (
              <span>Status updates broadcast in real-time via Web, Email & Push alerts.</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 transition"
            >
              Close
            </button>
            {order.status === 'served' && (
              <button
                onClick={() => onViewProof(order)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 shadow-xs transition flex items-center gap-1.5"
              >
                <FileCheck className="w-4 h-4" />
                Proof of Service
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
