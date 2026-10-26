import React, { useState, useMemo } from 'react';
import { 
  Receipt, 
  Search, 
  Filter, 
  CreditCard, 
  Printer, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  DollarSign, 
  ChevronRight, 
  Plus,
  ArrowUpDown,
  Building2,
  Calendar,
  Eye,
  Send
} from 'lucide-react';
import { 
  ServiceOrder, 
  ServiceInvoice, 
  UserProfile,
  createDefaultInvoiceFromOrder,
  getOrderEntity,
  getOrderResponsibleParty,
  getOrderInvoiceStatus,
  extractClientEmail
} from '../types';

interface InvoicesViewProps {
  orders: ServiceOrder[];
  currentUser?: UserProfile | null;
  onOpenInvoiceModal: (order: ServiceOrder) => void;
  onUpdateInvoiceStatus: (orderId: string, status: string) => void;
  onOpenStripeCheckout: (order: ServiceOrder) => void;
}

export const InvoicesView: React.FC<InvoicesViewProps> = ({
  orders,
  currentUser,
  onOpenInvoiceModal,
  onUpdateInvoiceStatus,
  onOpenStripeCheckout,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<string>('');
  const [emailingId, setEmailingId] = useState<string | null>(null);
  const [emailFeedback, setEmailFeedback] = useState<string | null>(null);

  const handleEmailInvoice = async (order: ServiceOrder, invoice: ServiceInvoice) => {
    const email = extractClientEmail(order);
    setEmailingId(order.id);
    try {
      const res = await fetch(`/api/orders/${order.id}/email-invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientEmail: email,
          clientName: getOrderResponsibleParty(order),
          invoiceNumber: invoice.id,
          amount: invoice.total,
          serviceTitle: order.entityBeingServed || order.caseNumber || 'Civil Service Order',
          attachedPdfName: `Invoice_${invoice.id}.pdf`
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to email invoice');
      onUpdateInvoiceStatus(order.id, 'Sent–Pending');
      setEmailFeedback(`Invoice #${invoice.id} automatically emailed to ${email} with attached PDF!`);
      setTimeout(() => setEmailFeedback(null), 4000);
    } catch (e: any) {
      setEmailFeedback(`Error emailing invoice: ${e.message}`);
      setTimeout(() => setEmailFeedback(null), 4000);
    } finally {
      setEmailingId(null);
    }
  };

  // Map each order to its auto-generated invoice reflecting user's organization name
  const invoicesWithOrder = useMemo(() => {
    return orders.map((order) => ({
      order,
      invoice: createDefaultInvoiceFromOrder(order, currentUser),
    }));
  }, [orders, currentUser]);

  // Financial statistics
  const stats = useMemo(() => {
    let totalBilled = 0;
    let totalCollected = 0;
    let pendingAmount = 0;
    let paidCount = 0;
    let pendingCount = 0;
    let notSentCount = 0;

    invoicesWithOrder.forEach(({ invoice }) => {
      totalBilled += invoice.total;
      if (invoice.status === 'Paid in Full') {
        totalCollected += invoice.total;
        paidCount++;
      } else if (invoice.status === 'Sent–Pending') {
        pendingAmount += invoice.balanceDue;
        pendingCount++;
      } else {
        pendingAmount += invoice.balanceDue;
        notSentCount++;
      }
    });

    return {
      totalBilled,
      totalCollected,
      pendingAmount,
      paidCount,
      pendingCount,
      notSentCount,
    };
  }, [invoicesWithOrder]);

  // Filtered invoices
  const filtered = useMemo(() => {
    return invoicesWithOrder.filter(({ order, invoice }) => {
      const entity = getOrderEntity(order).toLowerCase();
      const client = getOrderResponsibleParty(order).toLowerCase();
      const caseNum = (order.caseNumber || order.id).toLowerCase();
      const invId = invoice.id.toLowerCase();
      const q = searchTerm.toLowerCase();

      const matchesSearch =
        entity.includes(q) || client.includes(q) || caseNum.includes(q) || invId.includes(q);

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'paid' && invoice.status === 'Paid in Full') ||
        (statusFilter === 'sent' && invoice.status === 'Sent–Pending') ||
        (statusFilter === 'unpaid' && invoice.status === 'Not Sent–Not Paid');

      return matchesSearch && matchesStatus;
    });
  }, [invoicesWithOrder, searchTerm, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Top Banner / Headline */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <Receipt className="w-6 h-6 text-blue-600" />
            <span>Service Invoices & Billing</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Standardized civil process billing format branded to <span className="font-semibold text-slate-800">{currentUser?.organizationName || 'your organization'}</span> with integrated Stripe online checkout.
          </p>
        </div>

        {/* Quick generator dropdown */}
        <div className="flex items-center gap-2">
          <select
            value={selectedOrderForInvoice}
            onChange={(e) => {
              const ord = orders.find((o) => o.id === e.target.value);
              if (ord) {
                onOpenInvoiceModal(ord);
                setSelectedOrderForInvoice('');
              }
            }}
            className="bg-white border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg px-3 py-2 shadow-2xs focus:outline-hidden focus:border-blue-500"
          >
            <option value="">+ Generate Invoice for Order...</option>
            {orders.map((o) => (
              <option key={o.id} value={o.id}>
                {o.caseNumber || o.id} – {getOrderEntity(o)} ({getOrderResponsibleParty(o)})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Financial Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Total Receivables</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-900">
            ${stats.totalBilled.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">{orders.length} Total Service Orders</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600 uppercase">Paid in Full</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-700">
            ${stats.totalCollected.toFixed(2)}
          </div>
          <div className="text-[11px] text-emerald-600 mt-1">{stats.paidCount} Paid Invoices</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-600 uppercase">Pending / Due</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-amber-600">
            ${stats.pendingAmount.toFixed(2)}
          </div>
          <div className="text-[11px] text-amber-600 mt-1">
            {stats.pendingCount + stats.notSentCount} Outstanding
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-600 uppercase">Stripe Gateway</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-base font-bold text-slate-900">Configured & Ready</div>
          <div className="text-[11px] text-indigo-600 mt-1">Accepts Visa, MC, Amex, Apple Pay</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Case/Job #, Entity, or Client..."
            className="w-full text-xs text-slate-800 placeholder-slate-400 bg-transparent focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-medium">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-md transition ${
                statusFilter === 'all'
                  ? 'bg-white shadow-2xs text-slate-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({invoicesWithOrder.length})
            </button>
            <button
              onClick={() => setStatusFilter('unpaid')}
              className={`px-2.5 py-1 rounded-md transition ${
                statusFilter === 'unpaid'
                  ? 'bg-white shadow-2xs text-slate-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Not Sent ({stats.notSentCount})
            </button>
            <button
              onClick={() => setStatusFilter('sent')}
              className={`px-2.5 py-1 rounded-md transition ${
                statusFilter === 'sent'
                  ? 'bg-white shadow-2xs text-slate-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sent–Pending ({stats.pendingCount})
            </button>
            <button
              onClick={() => setStatusFilter('paid')}
              className={`px-2.5 py-1 rounded-md transition ${
                statusFilter === 'paid'
                  ? 'bg-white shadow-2xs text-slate-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Paid ({stats.paidCount})
            </button>
          </div>
        </div>
      </div>

      {/* Invoices List Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                <th className="py-3 px-4">Case or Job #</th>
                <th className="py-3 px-4">Entity Being Served</th>
                <th className="py-3 px-4">Responsible Party (Client)</th>
                <th className="py-3 px-4">Billing Date</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-center">Invoice Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    No invoices matching current search or filters.
                  </td>
                </tr>
              ) : (
                filtered.map(({ order, invoice }) => {
                  const entity = getOrderEntity(order);
                  const client = getOrderResponsibleParty(order);
                  const isPaid = invoice.status === 'Paid in Full';
                  const isSent = invoice.status === 'Sent–Pending';

                  return (
                    <tr
                      key={invoice.id}
                      className="hover:bg-slate-50/80 transition group"
                    >
                      {/* Case # & Issuing Company */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {invoice.caseOrJobNumber}
                        <div className="text-[10px] font-sans font-semibold text-blue-600 truncate max-w-[180px]" title={invoice.companyName}>
                          {invoice.companyName}
                        </div>
                      </td>

                      {/* Entity */}
                      <td className="py-3.5 px-4 font-medium text-slate-900">
                        {entity}
                      </td>

                      {/* Client */}
                      <td className="py-3.5 px-4 text-slate-700">
                        {client}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-slate-600 font-mono">
                        {invoice.billingDate}
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                        ${invoice.total.toFixed(2)}
                        {invoice.balanceDue > 0 && (
                          <div className="text-[10px] text-amber-600 font-normal">
                            Due: ${invoice.balanceDue.toFixed(2)}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                            isPaid
                              ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30'
                              : isSent
                              ? 'bg-blue-500/10 text-blue-700 border-blue-500/30'
                              : 'bg-amber-500/10 text-amber-700 border-amber-500/30'
                          }`}
                        >
                          {isPaid ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Clock className="w-3 h-3 text-amber-600" />
                          )}
                          {invoice.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {/* Review & Print Button */}
                          <button
                            onClick={() => onOpenInvoiceModal(order)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition shadow-2xs"
                            title="Review & Print Invoice"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                            Review
                          </button>

                          {/* Email Invoice to Client Button */}
                          <button
                            onClick={() => handleEmailInvoice(order, invoice)}
                            disabled={emailingId === order.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition shadow-2xs cursor-pointer disabled:opacity-50"
                            title={`Email invoice with attached PDF to ${extractClientEmail(order)}`}
                          >
                            {emailingId === order.id ? (
                              <>
                                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                                <span>Sending...</span>
                              </>
                            ) : (
                              <>
                                <Send className="w-3.5 h-3.5" />
                                <span>Email to Client</span>
                              </>
                            )}
                          </button>

                          {/* Stripe Pay Button */}
                          {!isPaid ? (
                            <button
                              onClick={() => onOpenInvoiceModal(order)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition shadow-2xs"
                              title="Process Stripe Payment"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              Pay (Stripe)
                            </button>
                          ) : (
                            <button
                              onClick={() => onOpenInvoiceModal(order)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium"
                              title="View Receipt"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              Receipt
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
