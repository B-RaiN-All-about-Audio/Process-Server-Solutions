import React, { useState } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import {
  ServiceOrder,
  FieldOrderStatus,
  ClosedStatus,
  ServiceInvoiceStatus,
  ServiceSpeedRequested,
} from '../types';

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

  // Format today's date as MM/DD/YYYY
  const getTodayFormatted = () => {
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  };

  const getDueDateFormatted = () => {
    const due = new Date();
    due.setDate(due.getDate() + 7);
    const mm = String(due.getMonth() + 1).padStart(2, '0');
    const dd = String(due.getDate()).padStart(2, '0');
    const yyyy = due.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  };

  // State matching every single field in IMG_0111.png
  const [entityBeingServed, setEntityBeingServed] = useState('');
  const [serviceAddress, setServiceAddress] = useState('');
  const [dateAdded, setDateAdded] = useState(getTodayFormatted());
  const [orderStatus, setOrderStatus] = useState<FieldOrderStatus>('Open');
  const [dateClosed, setDateClosed] = useState('');
  const [closedStatus, setClosedStatus] = useState<ClosedStatus>('N/A');
  const [responsiblePartyClient, setResponsiblePartyClient] = useState('');
  const [serviceInvoiceStatus, setServiceInvoiceStatus] = useState<ServiceInvoiceStatus>('Not Sent–Not Paid');
  const [dueDateRequested, setDueDateRequested] = useState(getDueDateFormatted());
  const [serviceSpeedRequested, setServiceSpeedRequested] = useState<ServiceSpeedRequested>('Standard (3–5 Days)');
  const [plaintiffName, setPlaintiffName] = useState('');
  const [defendantName, setDefendantName] = useState('');
  const [commentsNotes, setCommentsNotes] = useState('');

  const [validationError, setValidationError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!entityBeingServed.trim() || !serviceAddress.trim()) {
      setValidationError('Please enter the "Entity Being Served" and "Service Address".');
      return;
    }

    const timestamp = Date.now();
    const caseNum = `CV-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    const newOrder: ServiceOrder = {
      id: `ord-${timestamp}`,
      // Fields exactly matching IMG_0111.png:
      entityBeingServed: entityBeingServed.trim(),
      serviceAddress: serviceAddress.trim(),
      dateAdded: dateAdded.trim() || getTodayFormatted(),
      orderStatus,
      dateClosed: dateClosed.trim() || (orderStatus === 'Closed' || orderStatus === 'Served' ? getTodayFormatted() : 'N/A'),
      closedStatus: orderStatus === 'Served' ? 'Served' : closedStatus,
      responsiblePartyClient: responsiblePartyClient.trim() || 'Summit Legal Group',
      serviceInvoiceStatus,
      dueDateRequested: dueDateRequested.trim() || getDueDateFormatted(),
      serviceSpeedRequested,
      plaintiffName: plaintiffName.trim() || 'Plaintiff Party',
      defendantName: defendantName.trim() || entityBeingServed.trim(),
      commentsNotes: commentsNotes.trim(),

      // Backward compatibility fields:
      caseNumber: caseNum,
      courtName: 'Superior Court of California',
      recipientName: entityBeingServed.trim(),
      plaintiff: plaintiffName.trim() || 'Plaintiff Party',
      defendant: defendantName.trim() || entityBeingServed.trim(),
      clientName: responsiblePartyClient.trim() || 'Summit Legal Group',
      clientFirm: responsiblePartyClient.trim() || 'Summit Legal Group',
      clientEmail: 'contact@summitlegal.com',
      clientPhone: '(555) 019-2831',
      priority:
        serviceSpeedRequested === 'Same Day Urgent'
          ? 'same_day'
          : serviceSpeedRequested === 'Rush (24–48 Hours)'
          ? 'rush'
          : 'routine',
      status:
        orderStatus === 'Served'
          ? 'served'
          : orderStatus === 'Non-Served'
          ? 'non_served'
          : orderStatus === 'In Progress'
          ? 'in_progress'
          : 'assigned',
      specialInstructions: commentsNotes.trim(),
      assignedServerName: 'Marcus Vance',
      assignedServerPhone: '(310) 555-7291',
      documentTypes: ['Summons & Complaint', 'Notice of Case Assignment'],
      attempts: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deadlineDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    };

    onCreateOrder(newOrder);
    onClose();
  };

  return (
    <div
      id="modal-enter-new-order-overlay"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-700/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5"
    >
      <div
        id="modal-enter-new-order-container"
        className="bg-slate-800 w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-700/80 text-white overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header matching IMG_0111.png */}
        <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between bg-slate-800">
          <div>
            <span className="text-[11px] font-bold tracking-widest text-emerald-400 uppercase">
              FIELD WORKFLOW
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Enter New Service Order
            </h2>
          </div>
          <button
            id="btn-close-new-order-modal"
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body with exact labels from IMG_0111.png */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {validationError && (
            <div className="p-3 bg-rose-950/60 border border-rose-700/60 rounded-lg text-rose-300 text-xs">
              {validationError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Entity Being Served */}
            <div>
              <label
                htmlFor="input-entity-being-served"
                className="block text-xs font-semibold text-slate-300 mb-1.5"
              >
                Entity Being Served <span className="text-emerald-400">*</span>
              </label>
              <input
                id="input-entity-being-served"
                type="text"
                required
                value={entityBeingServed}
                onChange={(e) => {
                  setEntityBeingServed(e.target.value);
                  setValidationError('');
                }}
                placeholder="Full Individual Name or Corporate Entity"
                className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-lg text-white placeholder-slate-500 text-xs focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
              />
            </div>

            {/* 2. Service Address */}
            <div>
              <label
                htmlFor="input-service-address"
                className="block text-xs font-semibold text-slate-300 mb-1.5"
              >
                Service Address <span className="text-emerald-400">*</span>
              </label>
              <input
                id="input-service-address"
                type="text"
                required
                value={serviceAddress}
                onChange={(e) => {
                  setServiceAddress(e.target.value);
                  setValidationError('');
                }}
                placeholder="123 Main St, Ste 100, City, ST 00000"
                className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-lg text-white placeholder-slate-500 text-xs focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
              />
            </div>

            {/* 3. Date Added (MM/DD/YYYY) */}
            <div>
              <label
                htmlFor="input-date-added"
                className="block text-xs font-semibold text-slate-300 mb-1.5"
              >
                Date Added (MM/DD/YYYY)
              </label>
              <input
                id="input-date-added"
                type="text"
                value={dateAdded}
                onChange={(e) => setDateAdded(e.target.value)}
                placeholder="MM/DD/YYYY"
                className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-lg text-white placeholder-slate-500 text-xs focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition font-mono"
              />
            </div>

            {/* 4. Order Status */}
            <div>
              <label
                htmlFor="select-order-status"
                className="block text-xs font-semibold text-slate-300 mb-1.5"
              >
                Order Status
              </label>
              <select
                id="select-order-status"
                value={orderStatus}
                onChange={(e) => setOrderStatus(e.target.value as FieldOrderStatus)}
                className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-lg text-white text-xs focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
              >
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Served">Served</option>
                <option value="Non-Served">Non-Served</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            {/* 5. Date Closed (MM/DD/YYYY) */}
            <div>
              <label
                htmlFor="input-date-closed"
                className="block text-xs font-semibold text-slate-300 mb-1.5"
              >
                Date Closed (MM/DD/YYYY)
              </label>
              <input
                id="input-date-closed"
                type="text"
                value={dateClosed}
                onChange={(e) => setDateClosed(e.target.value)}
                placeholder="MM/DD/YYYY"
                className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-lg text-white placeholder-slate-500 text-xs focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition font-mono"
              />
            </div>

            {/* 6. Closed Status */}
            <div>
              <label
                htmlFor="select-closed-status"
                className="block text-xs font-semibold text-slate-300 mb-1.5"
              >
                Closed Status
              </label>
              <select
                id="select-closed-status"
                value={closedStatus}
                onChange={(e) => setClosedStatus(e.target.value as ClosedStatus)}
                className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-lg text-white text-xs focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
              >
                <option value="N/A">N/A</option>
                <option value="Served">Served</option>
                <option value="Non-Served">Non-Served</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Expired">Expired</option>
              </select>
            </div>

            {/* 7. Responsible Party (Client) */}
            <div>
              <label
                htmlFor="input-responsible-party"
                className="block text-xs font-semibold text-slate-300 mb-1.5"
              >
                Responsible Party (Client)
              </label>
              <input
                id="input-responsible-party"
                type="text"
                value={responsiblePartyClient}
                onChange={(e) => setResponsiblePartyClient(e.target.value)}
                placeholder="Summit Legal Group"
                className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-lg text-white placeholder-slate-500 text-xs focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
              />
            </div>

            {/* 8. Service Invoice Status */}
            <div>
              <label
                htmlFor="select-service-invoice-status"
                className="block text-xs font-semibold text-slate-300 mb-1.5"
              >
                Service Invoice Status
              </label>
              <select
                id="select-service-invoice-status"
                value={serviceInvoiceStatus}
                onChange={(e) =>
                  setServiceInvoiceStatus(e.target.value as ServiceInvoiceStatus)
                }
                className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-lg text-white text-xs focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
              >
                <option value="Not Sent–Not Paid">Not Sent–Not Paid</option>
                <option value="Sent–Pending">Sent–Pending</option>
                <option value="Paid in Full">Paid in Full</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>

            {/* 9. Due Date Requested (MM/DD/YYYY) */}
            <div>
              <label
                htmlFor="input-due-date-requested"
                className="block text-xs font-semibold text-slate-300 mb-1.5"
              >
                Due Date Requested (MM/DD/YYYY)
              </label>
              <input
                id="input-due-date-requested"
                type="text"
                value={dueDateRequested}
                onChange={(e) => setDueDateRequested(e.target.value)}
                placeholder="MM/DD/YYYY"
                className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-lg text-white placeholder-slate-500 text-xs focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition font-mono"
              />
            </div>

            {/* 10. Service Speed Requested */}
            <div>
              <label
                htmlFor="select-service-speed-requested"
                className="block text-xs font-semibold text-slate-300 mb-1.5"
              >
                Service Speed Requested
              </label>
              <select
                id="select-service-speed-requested"
                value={serviceSpeedRequested}
                onChange={(e) =>
                  setServiceSpeedRequested(e.target.value as ServiceSpeedRequested)
                }
                className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-lg text-white text-xs focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
              >
                <option value="Standard (3–5 Days)">Standard (3–5 Days)</option>
                <option value="Rush (24–48 Hours)">Rush (24–48 Hours)</option>
                <option value="Same Day Urgent">Same Day Urgent</option>
              </select>
            </div>

            {/* 11. Plaintiff Name */}
            <div>
              <label
                htmlFor="input-plaintiff-name"
                className="block text-xs font-semibold text-slate-300 mb-1.5"
              >
                Plaintiff Name
              </label>
              <input
                id="input-plaintiff-name"
                type="text"
                value={plaintiffName}
                onChange={(e) => setPlaintiffName(e.target.value)}
                placeholder="Plaintiff or Petitioner"
                className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-lg text-white placeholder-slate-500 text-xs focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
              />
            </div>

            {/* 12. Defendant Name */}
            <div>
              <label
                htmlFor="input-defendant-name"
                className="block text-xs font-semibold text-slate-300 mb-1.5"
              >
                Defendant Name
              </label>
              <input
                id="input-defendant-name"
                type="text"
                value={defendantName}
                onChange={(e) => setDefendantName(e.target.value)}
                placeholder="Defendant or Respondent"
                className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-lg text-white placeholder-slate-500 text-xs focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
              />
            </div>

            {/* 13. Comments/Notes (full-width) */}
            <div className="md:col-span-2">
              <label
                htmlFor="textarea-comments-notes"
                className="block text-xs font-semibold text-slate-300 mb-1.5"
              >
                Comments/Notes
              </label>
              <textarea
                id="textarea-comments-notes"
                rows={3}
                value={commentsNotes}
                onChange={(e) => setCommentsNotes(e.target.value)}
                placeholder="Comments/Notes..."
                className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-lg text-white placeholder-slate-500 text-xs focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition resize-none"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              id="btn-cancel-new-order"
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              id="btn-submit-new-order"
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition"
            >
              <CheckCircle2 className="w-4 h-4" />
              Save Service Order
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
