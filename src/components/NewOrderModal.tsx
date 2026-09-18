import React, { useState } from 'react';
import { X, Plus, FileText, AlertCircle, ShieldCheck, MapPin, User, Send } from 'lucide-react';
import { ServiceOrder, ServicePriority } from '../types';

interface NewOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateOrder: (newOrder: ServiceOrder) => void;
}

export const NewOrderModal: React.FC<NewOrderModalProps> = ({
  isOpen,
  onClose,
  onCreateOrder,
}) => {
  if (!isOpen) return null;

  const [caseNumber, setCaseNumber] = useState('');
  const [courtName, setCourtName] = useState('Superior Court of California, County of Los Angeles');
  const [plaintiff, setPlaintiff] = useState('');
  const [defendant, setDefendant] = useState('');
  const [hearingDate, setHearingDate] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [serviceAddress, setServiceAddress] = useState('');
  const [alternateAddress, setAlternateAddress] = useState('');
  const [priority, setPriority] = useState<ServicePriority>('routine');
  const [specialInstructions, setSpecialInstructions] = useState('');
  
  // Client details
  const [clientName, setClientName] = useState('Brandon Raynor, Esq.');
  const [clientFirm, setClientFirm] = useState('Raynor Legal Advocates PC');
  const [clientEmail, setClientEmail] = useState('brandon@raynorlaw.com');
  const [clientPhone, setClientPhone] = useState('(310) 555-2244');

  // Document types
  const COMMON_DOCS = [
    'Summons & Complaint',
    'Subpoena Duces Tecum',
    'Civil Case Cover Sheet',
    '3-Day Notice to Pay or Quit',
    'Temporary Restraining Order',
    'Notice of Deposition',
    'Small Claims Claim & Order'
  ];
  const [selectedDocs, setSelectedDocs] = useState<string[]>([COMMON_DOCS[0]]);
  const [customDoc, setCustomDoc] = useState('');

  const toggleDoc = (doc: string) => {
    if (selectedDocs.includes(doc)) {
      if (selectedDocs.length > 1) {
        setSelectedDocs(selectedDocs.filter((d) => d !== doc));
      }
    } else {
      setSelectedDocs([...selectedDocs, doc]);
    }
  };

  const handleAddCustomDoc = () => {
    if (customDoc.trim() && !selectedDocs.includes(customDoc.trim())) {
      setSelectedDocs([...selectedDocs, customDoc.trim()]);
      setCustomDoc('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!caseNumber.trim() || !recipientName.trim() || !serviceAddress.trim()) {
      alert('Please fill in required fields (Case #, Recipient, Service Address).');
      return;
    }

    const newOrder: ServiceOrder = {
      id: `ord-${Date.now()}`,
      caseNumber: caseNumber.trim(),
      courtName: courtName.trim(),
      plaintiff: plaintiff.trim() || 'Plaintiff Party',
      defendant: defendant.trim() || recipientName.trim(),
      hearingDate: hearingDate || undefined,
      documentTypes: selectedDocs,
      recipientName: recipientName.trim(),
      recipientPhone: recipientPhone.trim() || undefined,
      serviceAddress: serviceAddress.trim(),
      alternateAddress: alternateAddress.trim() || undefined,
      priority,
      status: 'assigned',
      specialInstructions: specialInstructions.trim() || undefined,
      clientName: clientName.trim(),
      clientFirm: clientFirm.trim(),
      clientEmail: clientEmail.trim(),
      clientPhone: clientPhone.trim(),
      assignedServerName: 'Marcus Vance',
      assignedServerPhone: '(310) 555-7291',
      attempts: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deadlineDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };

    onCreateOrder(newOrder);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-600">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">New Service of Process Order</h2>
              <p className="text-xs text-slate-400">Submit legal paperwork for immediate field dispatch</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs">

          {/* Section: Court & Case */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              1. Case & Judicial Jurisdiction
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Case Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 26STCV14920"
                  value={caseNumber}
                  onChange={(e) => setCaseNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Court Jurisdiction *</label>
                <input
                  type="text"
                  required
                  value={courtName}
                  onChange={(e) => setCourtName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Plaintiff / Petitioner</label>
                <input
                  type="text"
                  placeholder="e.g. Acme Holdings Corp"
                  value={plaintiff}
                  onChange={(e) => setPlaintiff(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Defendant / Respondent</label>
                <input
                  type="text"
                  placeholder="e.g. John Doe, et al."
                  value={defendant}
                  onChange={(e) => setDefendant(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section: Recipient & Location */}
          <div className="space-y-3 pt-2 border-t border-slate-200">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              2. Recipient Information & Address
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Party to be Served *</label>
                <input
                  type="text"
                  required
                  placeholder="Full legal name of subject"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Recipient Phone (Optional)</label>
                <input
                  type="text"
                  placeholder="(310) 555-0199"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-700 font-semibold block mb-1">Primary Service Address *</label>
              <input
                type="text"
                required
                placeholder="Street address, unit/suite, city, state, zip"
                value={serviceAddress}
                onChange={(e) => setServiceAddress(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-slate-700 font-semibold block mb-1">Alternate / Workplace Address (Optional)</label>
              <input
                type="text"
                placeholder="Business name, workplace address, or second home"
                value={alternateAddress}
                onChange={(e) => setAlternateAddress(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Section: Priority & Service Speed */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              3. Service Urgency Level
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { key: 'routine', label: 'Routine Service', desc: 'First attempt within 3-5 days' },
                { key: 'rush', label: 'Rush (48 Hours)', desc: 'First attempt within 24-48 hrs' },
                { key: 'same_day', label: 'Same-Day Urgent', desc: 'Immediate dispatch within 4 hrs' },
              ].map((p) => (
                <button
                  type="button"
                  key={p.key}
                  onClick={() => setPriority(p.key as ServicePriority)}
                  className={`p-3 rounded-xl border text-left transition ${
                    priority === p.key
                      ? 'border-blue-600 bg-blue-50/70 text-blue-950 ring-2 ring-blue-500/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                  }`}
                >
                  <div className="font-bold">{p.label}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{p.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Section: Documents Included */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              4. Documents in Packet ({selectedDocs.length} selected)
            </h3>

            <div className="flex flex-wrap gap-1.5">
              {COMMON_DOCS.map((doc) => {
                const isSelected = selectedDocs.includes(doc);
                return (
                  <button
                    type="button"
                    key={doc}
                    onClick={() => toggleDoc(doc)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {doc}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                placeholder="Add other document name..."
                value={customDoc}
                onChange={(e) => setCustomDoc(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomDoc();
                  }
                }}
                className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
              <button
                type="button"
                onClick={handleAddCustomDoc}
                className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold"
              >
                Add
              </button>
            </div>
          </div>

          {/* Section: Special Instructions */}
          <div className="space-y-1.5 pt-2 border-t border-slate-200">
            <label className="text-xs font-bold text-slate-700 block">
              Special Instructions / Server Safety Notes
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Gate code #1234, aggressive guard dog on premise, best time morning before 8am..."
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Submit Action */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-sm shadow-blue-600/30 transition flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              Submit Service Order & Dispatch Server
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
