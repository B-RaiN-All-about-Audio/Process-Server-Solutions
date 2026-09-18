import React from 'react';
import { X, Printer, ShieldCheck, Download, CheckCircle2, FileText } from 'lucide-react';
import { ServiceOrder } from '../types';

interface ProofOfServiceModalProps {
  order: ServiceOrder | null;
  onClose: () => void;
}

export const ProofOfServiceModal: React.FC<ProofOfServiceModalProps> = ({
  order,
  onClose,
}) => {
  if (!order) return null;

  const servedAttempt = order.attempts.find(
    (a) => a.outcome === 'personal_service' || a.outcome === 'substituted_service'
  ) || order.attempts[order.attempts.length - 1];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Top Bar */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-sm font-bold">Official Proof of Service / Affidavit</h2>
              <p className="text-[11px] text-slate-400">Judicially formatted for electronic court filing</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save as PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Legal Document Container */}
        <div className="p-6 sm:p-10 overflow-y-auto font-serif text-slate-900 bg-white space-y-6 text-xs sm:text-sm leading-relaxed border-t border-slate-200 print:p-0 print:border-none">
          
          {/* Header Caption */}
          <div className="border-2 border-slate-900 p-4 space-y-2">
            <div className="text-center font-sans font-bold text-xs uppercase tracking-widest pb-2 border-b border-slate-300">
              AFFIDAVIT / PROOF OF SERVICE OF LEGAL PROCESS
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="border-r border-slate-300 pr-3 space-y-1 font-sans">
                <div className="text-[10px] uppercase font-bold text-slate-500">Court Jurisdiction:</div>
                <div className="font-bold text-xs">{order.courtName}</div>
                <div className="pt-2 text-[10px] uppercase font-bold text-slate-500">Requesting Attorney / Party:</div>
                <div className="text-xs">{order.clientName}</div>
                <div className="text-xs text-slate-600">{order.clientFirm}</div>
              </div>

              <div className="space-y-1.5 font-sans pl-2">
                <div className="flex justify-between border-b pb-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Case Number:</span>
                  <span className="font-mono font-bold text-xs">{order.caseNumber}</span>
                </div>
                {order.hearingDate && (
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Hearing Date:</span>
                    <span className="text-xs">{new Date(order.hearingDate).toLocaleDateString()}</span>
                  </div>
                )}
                <div className="pt-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Parties:</span>
                  <div className="font-bold text-xs">{order.plaintiff}</div>
                  <div className="text-[11px] text-slate-500 italic">vs.</div>
                  <div className="font-bold text-xs">{order.defendant}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 1: Server Identity */}
          <div className="space-y-1.5">
            <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-slate-700">
              1. DECLARATION OF REGISTERED PROCESS SERVER
            </h3>
            <p>
              I, <strong>{servedAttempt?.serverName || order.assignedServerName || 'Registered Process Server'}</strong>, declare under penalty of perjury under the laws of the State that I am a citizen of the United States, over 18 years of age, and not a party to or interested in the above-entitled action. I am a registered and bonded process server in good standing under Certificate / Badge #<strong>{servedAttempt?.serverBadgeId || 'REG-4991'}</strong>.
            </p>
          </div>

          {/* Section 2: Documents Served */}
          <div className="space-y-1.5">
            <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-slate-700">
              2. DOCUMENTS DELIVERED
            </h3>
            <p>
              On the date and time specified below, I received and subsequently served true and correct copies of the following legal documents:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2 font-sans text-xs">
              {order.documentTypes.map((doc, idx) => (
                <li key={idx} className="font-medium">{doc}</li>
              ))}
            </ul>
          </div>

          {/* Section 3: Manner and Place of Service */}
          <div className="space-y-2">
            <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-slate-700">
              3. TIME, MANNER, AND LOCATION OF SERVICE
            </h3>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 font-sans text-xs space-y-1.5">
              <div>
                <strong>Party Served: </strong>
                <span>{servedAttempt?.recipientNameServed || order.recipientName}</span>
                {servedAttempt?.relationshipToRecipient && (
                  <span className="text-slate-600"> ({servedAttempt.relationshipToRecipient})</span>
                )}
              </div>
              <div>
                <strong>Date and Time of Service: </strong>
                <span>
                  {servedAttempt?.timestamp ? new Date(servedAttempt.timestamp).toLocaleString([], {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : 'Pending Verification'}
                </span>
              </div>
              <div>
                <strong>Address of Service: </strong>
                <span>{servedAttempt?.locationAddress || order.serviceAddress}</span>
              </div>
              {servedAttempt?.verifiedGps && (
                <div className="text-emerald-800 font-mono text-[11px]">
                  <strong>GPS Geolocation Stamp: </strong>
                  <span>Lat: {servedAttempt.latitude.toFixed(5)}, Lng: {servedAttempt.longitude.toFixed(5)} (Cryptographically Logged)</span>
                </div>
              )}
            </div>

            <p className="pt-1">
              <strong>Manner of Service: </strong>
              {servedAttempt?.outcome === 'personal_service' ? (
                <span>
                  <strong>PERSONAL SERVICE.</strong> By personally delivering and handing copies of the documents mentioned above directly to the recipient named herein, advising them of the contents and nature of legal process.
                </span>
              ) : (
                <span>
                  <strong>SUBSTITUTED SERVICE.</strong> By leaving the documents with an individual of suitable age and discretion at the recipient's usual place of abode or business, informing them of the nature of the papers, followed by statutory mailing of conforming copies.
                </span>
              )}
            </p>
          </div>

          {/* Section 4: Physical Description of Party Served */}
          {servedAttempt?.recipientDescription && (
            <div className="space-y-1.5">
              <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-slate-700">
                4. RECIPIENT PHYSICAL PROFILE
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-sans text-xs bg-slate-50 p-2.5 rounded border">
                <div><strong>Age:</strong> ~{servedAttempt.recipientDescription.approxAge}</div>
                <div><strong>Gender:</strong> {servedAttempt.recipientDescription.gender}</div>
                <div><strong>Height:</strong> {servedAttempt.recipientDescription.height}</div>
                <div><strong>Weight:</strong> {servedAttempt.recipientDescription.weight}</div>
                <div><strong>Hair:</strong> {servedAttempt.recipientDescription.hairColor}</div>
                <div><strong>Glasses:</strong> {servedAttempt.recipientDescription.wearsGlasses ? 'Yes' : 'No'}</div>
                {servedAttempt.recipientDescription.distinguishingFeatures && (
                  <div className="col-span-2">
                    <strong>Features:</strong> {servedAttempt.recipientDescription.distinguishingFeatures}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Section 5: Signature & Verification */}
          <div className="pt-6 border-t border-slate-300 space-y-4 font-sans">
            <p className="text-xs italic">
              I certify and declare under penalty of perjury under the laws of the State that the foregoing statements are true and correct.
            </p>

            <div className="flex flex-wrap items-end justify-between gap-6 pt-4">
              <div className="space-y-1 text-xs">
                <div><strong>Date of Execution: </strong>{new Date(order.proofOfServiceSignedAt || Date.now()).toLocaleDateString()}</div>
                <div><strong>County of Registration: </strong>Los Angeles / Orange County</div>
                <div><strong>Status: </strong>Registered & Bonded Process Server</div>
              </div>

              <div className="text-center space-y-1">
                <div className="w-52 border-b-2 border-slate-900 pb-1 flex items-center justify-center min-h-12">
                  {servedAttempt?.signatureUrl ? (
                    <img
                      src={servedAttempt.signatureUrl}
                      alt="Declarant Signature"
                      className="h-10 object-contain"
                    />
                  ) : (
                    <span className="font-mono text-xs text-slate-400">[Digital Verified Seal]</span>
                  )}
                </div>
                <div className="text-xs font-bold">{servedAttempt?.serverName || order.assignedServerName}</div>
                <div className="text-[10px] text-slate-500">Declarant / Process Server</div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center print:hidden">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Digital Proof of Service Certificate #POS-{order.id.toUpperCase()}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
