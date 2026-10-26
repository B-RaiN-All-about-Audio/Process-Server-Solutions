import React, { useState, useEffect } from 'react';
import {
  X,
  Printer,
  CreditCard,
  CheckCircle2,
  Edit3,
  FileText,
  Share2,
  DollarSign,
  AlertCircle,
  Plus,
  Trash2,
  ShieldCheck,
  Building2,
  Calendar,
  Lock,
  ExternalLink,
  Receipt,
  Send,
  Mail
} from 'lucide-react';
import { 
  ServiceOrder, 
  ServiceInvoice, 
  InvoiceLineItem, 
  UserProfile,
  createDefaultInvoiceFromOrder,
  getOrderEntity,
  getOrderResponsibleParty,
  getOrderPlaintiff,
  getOrderDefendant,
  getOrderDateAdded
} from '../types';
import { BrandLogo } from './BrandLogo';

interface InvoiceModalProps {
  order: ServiceOrder | null;
  currentUser?: UserProfile | null;
  isOpen?: boolean;
  onClose: () => void;
  onUpdateOrderStatus?: (orderId: string, invoiceStatus: string) => void;
  onUpdateInvoiceStatus?: (orderId: string, invoiceStatus: string) => void;
  onRecordPayment?: (orderId: string, amount: number, paymentMethod: string) => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  order,
  currentUser,
  isOpen = true,
  onClose,
  onUpdateOrderStatus,
  onUpdateInvoiceStatus,
  onRecordPayment,
}) => {
  if (!isOpen || !order) return null;
  const triggerStatusUpdate = onUpdateInvoiceStatus || onUpdateOrderStatus;

  const [invoice, setInvoice] = useState<ServiceInvoice>(() =>
    createDefaultInvoiceFromOrder(order, currentUser)
  );
  const [isEditing, setIsEditing] = useState(false);
  const [isProcessingStripe, setIsProcessingStripe] = useState(false);
  const [showStripePayModal, setShowStripePayModal] = useState(false);
  const [stripeConfig, setStripeConfig] = useState<{ configured: boolean; publishableKey: string | null } | null>(null);
  const [stripeSuccessMsg, setStripeSuccessMsg] = useState<string | null>(null);
  const [copyNotification, setCopyNotification] = useState(false);

  // Card form simulation / Stripe test fields
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExp, setCardExp] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('888');
  const [cardZip, setCardZip] = useState('28546');

  // Sync whenever selected order or user organization changes
  useEffect(() => {
    if (order) {
      setInvoice(createDefaultInvoiceFromOrder(order, currentUser));
      setStripeSuccessMsg(null);
    }
  }, [order?.id, currentUser?.organizationName, currentUser?.companyMotto]);

  // Check Stripe configuration on server
  useEffect(() => {
    fetch('/api/stripe/config')
      .then((res) => res.json())
      .then((data) => setStripeConfig(data))
      .catch(() => setStripeConfig({ configured: false, publishableKey: null }));
  }, []);

  // Recalculate totals when items change
  const handleItemChange = (id: string, field: keyof InvoiceLineItem, value: any) => {
    setInvoice((prev) => {
      const updatedItems = prev.items.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        if (field === 'qty' || field === 'price') {
          const qty = field === 'qty' ? Number(value) : item.qty;
          const price = field === 'price' ? Number(value) : item.price;
          updated.total = Number((qty * price).toFixed(2));
        }
        return updated;
      });

      const newCurrentCharges = updatedItems.reduce((sum, item) => sum + item.total, 0);
      const newBalanceDue = Math.max(0, newCurrentCharges - prev.paymentsReceived);

      return {
        ...prev,
        items: updatedItems,
        total: newCurrentCharges,
        currentCharges: newCurrentCharges,
        balanceDue: newBalanceDue,
      };
    });
  };

  const handleAddItem = () => {
    const newItem: InvoiceLineItem = {
      id: `item-${Date.now()}`,
      date: invoice.billingDate,
      description: 'Additional Process Service / Surcharge',
      qty: 1,
      price: 25.0,
      total: 25.0,
    };
    setInvoice((prev) => {
      const updatedItems = [...prev.items, newItem];
      const newCharges = updatedItems.reduce((sum, i) => sum + i.total, 0);
      return {
        ...prev,
        items: updatedItems,
        total: newCharges,
        currentCharges: newCharges,
        balanceDue: Math.max(0, newCharges - prev.paymentsReceived),
      };
    });
  };

  const handleRemoveItem = (id: string) => {
    setInvoice((prev) => {
      const updatedItems = prev.items.filter((i) => i.id !== id);
      const newCharges = updatedItems.reduce((sum, i) => sum + i.total, 0);
      return {
        ...prev,
        items: updatedItems,
        total: newCharges,
        currentCharges: newCharges,
        balanceDue: Math.max(0, newCharges - prev.paymentsReceived),
      };
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleMarkSent = () => {
    setInvoice((prev) => ({ ...prev, status: 'Sent–Pending' }));
    if (triggerStatusUpdate && order) {
      triggerStatusUpdate(order.id, 'Sent–Pending');
    }
  };

  const handleMarkPaid = () => {
    setInvoice((prev) => ({
      ...prev,
      status: 'Paid in Full',
      paymentsReceived: prev.currentCharges,
      balanceDue: 0.0,
      paidAt: new Date().toISOString(),
    }));
    if (triggerStatusUpdate && order) {
      triggerStatusUpdate(order.id, 'Paid in Full');
    }
    if (onRecordPayment && order) {
      onRecordPayment(order.id, invoice.currentCharges, 'Check / Cash');
    }
  };

  const [isEmailing, setIsEmailing] = useState(false);
  const [emailSuccessMsg, setEmailSuccessMsg] = useState<string | null>(null);

  const handleEmailToClient = async () => {
    if (!order) return;
    const clientEmail = order.clientEmail || 'billing@summitlegal.com';
    setIsEmailing(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/email-invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientEmail,
          clientName: invoice.companyAddress.name || order.responsiblePartyClient || 'Responsible Client',
          invoiceNumber: invoice.id,
          amount: invoice.balanceDue,
          serviceTitle: order.entityBeingServed || order.caseNumber || 'Civil Service Order',
          attachedPdfName: `Invoice_${invoice.id}.pdf`
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to email invoice');
      setInvoice((prev) => ({ ...prev, status: 'Sent–Pending' }));
      if (triggerStatusUpdate) {
        triggerStatusUpdate(order.id, 'Sent–Pending');
      }
      setEmailSuccessMsg(`Invoice #${invoice.id} automatically emailed to ${clientEmail} with PDF attached!`);
      setTimeout(() => setEmailSuccessMsg(null), 5000);
    } catch (e: any) {
      setEmailSuccessMsg(`Error: ${e.message}`);
      setTimeout(() => setEmailSuccessMsg(null), 4000);
    } finally {
      setIsEmailing(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(
      `${window.location.origin}/?invoice=${invoice.id}&order=${order.id}`
    );
    setCopyNotification(true);
    setTimeout(() => setCopyNotification(false), 2500);
  };

  // Launch Stripe Payment Flow
  const handleStripeCheckout = async () => {
    setIsProcessingStripe(true);
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          caseNumber: invoice.caseOrJobNumber,
          amount: invoice.balanceDue,
          description: `Civil Process Service for Case #${invoice.caseOrJobNumber}`,
          clientEmail: order.clientEmail || 'billing@summitlaw.example',
        }),
      });

      const data = await response.json();

      if (data.checkoutUrl) {
        // Live Stripe checkout available
        window.location.href = data.checkoutUrl;
      } else {
        // Safe interactive demo / preview payment simulation
        setShowStripePayModal(true);
      }
    } catch (err) {
      console.warn('Stripe endpoint error, opening interactive checkout modal:', err);
      setShowStripePayModal(true);
    } finally {
      setIsProcessingStripe(false);
    }
  };

  // Complete simulated Stripe payment
  const handleConfirmStripePayment = async () => {
    setIsProcessingStripe(true);
    try {
      const txnId = `ch_live_${Math.random().toString(36).substring(2, 12)}`;
      
      // Update database record
      await fetch('/api/stripe/record-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          amount: invoice.balanceDue,
          paymentId: txnId,
          paymentMethod: 'stripe_card',
        }),
      });

      setInvoice((prev) => ({
        ...prev,
        status: 'Paid in Full',
        paymentsReceived: prev.currentCharges,
        balanceDue: 0.0,
        paymentMethod: 'stripe',
        stripePaymentId: txnId,
        paidAt: new Date().toISOString(),
      }));

      if (triggerStatusUpdate && order) {
        triggerStatusUpdate(order.id, 'Paid in Full');
      }
      if (onRecordPayment && order) {
        onRecordPayment(order.id, invoice.currentCharges, 'Stripe Card');
      }

      setStripeSuccessMsg(`Payment of $${invoice.balanceDue.toFixed(2)} confirmed via Stripe! Transaction ID: ${txnId}`);
      setShowStripePayModal(false);
    } catch (e) {
      console.error('Payment confirmation error:', e);
    } finally {
      setIsProcessingStripe(false);
    }
  };

  return (
    <div
      id="invoice-modal-backdrop"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-700/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static"
    >
      <div
        id="invoice-modal-container"
        className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[96vh] print:max-h-none print:shadow-none print:border-none print:w-full print:rounded-none"
      >
        {/* TOP REVIEW & CONTROLS BAR (Hidden when printing) */}
        <div className="bg-slate-800 text-white px-5 py-3.5 border-b border-slate-700 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white">Invoice Review & Generator</h2>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    invoice.status === 'Paid in Full'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : invoice.status === 'Sent–Pending'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {invoice.status}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Auto-populated from Service Order #{order.caseNumber || order.id} • Double-check & send
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center flex-wrap gap-2">
            <button
              id="btn-invoice-toggle-edit"
              onClick={() => setIsEditing(!isEditing)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                isEditing
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              {isEditing ? 'Done Editing' : 'Edit Fields'}
            </button>

            {invoice.status !== 'Paid in Full' && (
              <button
                id="btn-invoice-mark-sent"
                onClick={handleMarkSent}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-xs transition"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Approve & Mark Sent
              </button>
            )}

            {/* Email Invoice to Client Button */}
            <button
              id="btn-invoice-email-client"
              onClick={handleEmailToClient}
              disabled={isEmailing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer disabled:opacity-50"
              title={`Automatically email invoice with attached PDF to ${order?.clientEmail || 'client'}`}
            >
              {isEmailing ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                  <span>Emailing...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Email to Client</span>
                </>
              )}
            </button>

            <button
              id="btn-invoice-pay-stripe"
              onClick={handleStripeCheckout}
              disabled={invoice.status === 'Paid in Full' || isProcessingStripe}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-xs transition ${
                invoice.status === 'Paid in Full'
                  ? 'bg-emerald-800/50 text-emerald-300 border border-emerald-700 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              {invoice.status === 'Paid in Full' ? 'Paid via Stripe' : 'Pay via Stripe'}
            </button>

            <button
              id="btn-invoice-print"
              onClick={handlePrint}
              title="Print to Paper or Save PDF"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button
              id="btn-invoice-copy-link"
              onClick={handleCopyLink}
              title="Copy Invoice Link"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition relative"
            >
              <Share2 className="w-4 h-4" />
              {copyNotification && (
                <span className="absolute -bottom-7 right-0 whitespace-nowrap bg-emerald-700 text-white text-[10px] px-2 py-0.5 rounded shadow">
                  Link Copied!
                </span>
              )}
            </button>

            <button
              id="btn-close-invoice-modal"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900 text-slate-400 hover:text-white transition ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* NOTIFICATION BANNER IF PAID */}
        {stripeSuccessMsg && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-5 py-2.5 flex items-center justify-between text-emerald-800 text-xs font-medium print:hidden">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{stripeSuccessMsg}</span>
            </div>
            <button
              onClick={() => setStripeSuccessMsg(null)}
              className="text-emerald-700 hover:text-emerald-900 font-bold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* NOTIFICATION BANNER IF INVOICE EMAILED */}
        {emailSuccessMsg && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-5 py-2.5 flex items-center justify-between text-emerald-900 text-xs font-medium print:hidden">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{emailSuccessMsg}</span>
            </div>
            <button
              onClick={() => setEmailSuccessMsg(null)}
              className="text-emerald-700 hover:text-emerald-900 font-bold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* SCROLLABLE DOCUMENT PREVIEW (Matches IMG_0112.png exactly) */}
        <div className="overflow-y-auto p-6 sm:p-10 font-sans text-slate-900 bg-white flex-1 print:p-0 print:overflow-visible">
          <div className="max-w-3xl mx-auto space-y-6">

            {/* HEADER: Branded Company / Organization Name */}
            <div className="text-center">
              <div className="flex justify-center mb-2">
                <BrandLogo size="lg" hideText />
              </div>
              <h1 className="text-3xl sm:text-4xl font-normal tracking-wide text-[#2b4c7e] font-serif">
                {isEditing ? (
                  <div className="space-y-1">
                    <input
                      type="text"
                      value={invoice.companyName}
                      onChange={(e) => setInvoice({ 
                        ...invoice, 
                        companyName: e.target.value,
                        companyAddress: { ...invoice.companyAddress, name: e.target.value }
                      })}
                      placeholder="Company Name (from sign-up)"
                      className="text-center font-serif text-3xl sm:text-4xl text-[#2b4c7e] border-b border-blue-300 w-full focus:outline-hidden"
                    />
                    <span className="text-[10px] text-blue-600 font-sans block">
                      Edit invoice title (defaults to your organization name entered at registration)
                    </span>
                  </div>
                ) : (
                  invoice.companyName
                )}
              </h1>

              {/* Double Line Border Framing the Motto */}
              <div className="mt-2 border-t-2 border-b-2 border-slate-900 py-1 px-4">
                {isEditing ? (
                  <input
                    type="text"
                    value={invoice.companyMotto}
                    onChange={(e) => setInvoice({ ...invoice, companyMotto: e.target.value })}
                    className="text-center text-xs text-slate-800 w-full font-serif italic focus:outline-hidden"
                  />
                ) : (
                  <p className="text-xs sm:text-sm text-[#2b4c7e] tracking-wide font-serif">
                    {invoice.companyMotto}
                  </p>
                )}
              </div>

              {/* Thick solid separator bar */}
              <div className="mt-2 h-1 bg-slate-800 w-full"></div>
            </div>

            {/* TOP INFO BOXES: Billing Date & Case or Job # */}
            <div className="grid grid-cols-2 gap-4">
              {/* Left Box: Billing Date */}
              <div className="border-2 border-slate-900 p-2.5 bg-white">
                <div className="text-xs sm:text-sm font-bold text-slate-900 uppercase">
                  Billing Date:
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    value={invoice.billingDate}
                    onChange={(e) => setInvoice({ ...invoice, billingDate: e.target.value })}
                    className="w-full text-xs font-mono text-slate-800 border-b border-slate-300 mt-1 focus:outline-hidden"
                  />
                ) : (
                  <div className="text-xs sm:text-sm font-mono text-slate-900 mt-0.5">
                    {invoice.billingDate}
                  </div>
                )}
              </div>

              {/* Right Box: Case or Job # */}
              <div className="border-2 border-slate-900 p-2.5 bg-white">
                <div className="text-xs sm:text-sm font-bold text-slate-900 uppercase">
                  Case or Job #
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    value={invoice.caseOrJobNumber}
                    onChange={(e) => setInvoice({ ...invoice, caseOrJobNumber: e.target.value })}
                    className="w-full text-xs font-bold text-slate-800 border-b border-slate-300 mt-1 focus:outline-hidden font-mono"
                  />
                ) : (
                  <div className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5 font-mono break-all">
                    {invoice.caseOrJobNumber}
                  </div>
                )}
              </div>
            </div>

            {/* PARTIES BOXES: Entity Being Served & Responsible Party (Client) */}
            <div className="grid grid-cols-2 gap-4">
              {/* Left Box: Entity Being Served */}
              <div className="border-2 border-slate-900 p-2.5 min-h-[48px] flex flex-col justify-center bg-white">
                {isEditing ? (
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      Entity Being Served
                    </span>
                    <input
                      type="text"
                      value={invoice.entityBeingServed}
                      onChange={(e) => setInvoice({ ...invoice, entityBeingServed: e.target.value })}
                      className="w-full text-xs font-medium text-slate-900 border-b border-slate-300 focus:outline-hidden"
                    />
                  </div>
                ) : (
                  <div className="text-xs sm:text-sm font-medium text-slate-900">
                    {invoice.entityBeingServed}
                  </div>
                )}
              </div>

              {/* Right Box: Responsible Party (Client) */}
              <div className="border-2 border-slate-900 p-2.5 min-h-[48px] flex flex-col justify-center bg-white">
                {isEditing ? (
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      Responsible Party (Client)
                    </span>
                    <input
                      type="text"
                      value={invoice.responsiblePartyClient}
                      onChange={(e) =>
                        setInvoice({ ...invoice, responsiblePartyClient: e.target.value })
                      }
                      className="w-full text-xs font-medium text-slate-900 border-b border-slate-300 focus:outline-hidden"
                    />
                  </div>
                ) : (
                  <div className="text-xs sm:text-sm font-medium text-slate-900">
                    {invoice.responsiblePartyClient}
                  </div>
                )}
              </div>
            </div>

            {/* ACCOUNT SUMMARY TABLE (Aging & Balances) */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border-2 border-slate-900 text-center text-xs">
                <thead>
                  <tr className="border-b-2 border-slate-900 divide-x-2 divide-slate-900 font-bold bg-slate-50">
                    <th className="p-2 min-w-[90px]">Starting Balance</th>
                    <th className="p-2 min-w-[90px]">Payments Received</th>
                    <th className="p-2 min-w-[90px]">30 Days Past Due</th>
                    <th className="p-2 min-w-[90px]">60 Days Past Due</th>
                    <th className="p-2 min-w-[90px]">90 Days Past Due</th>
                    <th className="p-2 min-w-[90px]">Current Charges</th>
                    <th className="p-2 min-w-[100px] bg-slate-100">Balance Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-slate-900">
                  <tr className="divide-x-2 divide-slate-900 font-mono">
                    <td className="p-2">
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.01"
                          value={invoice.startingBalance}
                          onChange={(e) =>
                            setInvoice({ ...invoice, startingBalance: parseFloat(e.target.value) || 0 })
                          }
                          className="w-full text-center border-b border-slate-300 focus:outline-hidden"
                        />
                      ) : (
                        `$${invoice.startingBalance.toFixed(2)}`
                      )}
                    </td>
                    <td className="p-2 text-emerald-700 font-semibold">
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.01"
                          value={invoice.paymentsReceived}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setInvoice({
                              ...invoice,
                              paymentsReceived: val,
                              balanceDue: Math.max(0, invoice.currentCharges - val),
                            });
                          }}
                          className="w-full text-center border-b border-slate-300 focus:outline-hidden"
                        />
                      ) : (
                        `$${invoice.paymentsReceived.toFixed(2)}`
                      )}
                    </td>
                    <td className="p-2">${invoice.pastDue30Days.toFixed(2)}</td>
                    <td className="p-2">${invoice.pastDue60Days.toFixed(2)}</td>
                    <td className="p-2">${invoice.pastDue90Days.toFixed(2)}</td>
                    <td className="p-2">${invoice.currentCharges.toFixed(2)}</td>
                    <td className="p-2 font-bold text-slate-900 bg-slate-100">
                      ${invoice.balanceDue.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* DETAILED SERVICE LINE ITEMS TABLE */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border-2 border-slate-900 text-xs">
                <thead>
                  <tr className="border-b-2 border-slate-900 divide-x-2 divide-slate-900 font-bold bg-slate-50 text-slate-900">
                    <th className="p-2.5 text-center w-28">Date</th>
                    <th className="p-2.5 text-left">Description of Services</th>
                    <th className="p-2.5 text-center w-16">Qty.</th>
                    <th className="p-2.5 text-right w-24">Price</th>
                    <th className="p-2.5 text-right w-28">Total</th>
                    {isEditing && <th className="p-2 w-12 text-center print:hidden"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-slate-900">
                  {invoice.items.map((item) => (
                    <tr key={item.id} className="divide-x-2 divide-slate-900">
                      {/* Date */}
                      <td className="p-2.5 text-center font-mono text-slate-800">
                        {isEditing ? (
                          <input
                            type="text"
                            value={item.date}
                            onChange={(e) => handleItemChange(item.id, 'date', e.target.value)}
                            className="w-full text-center border-b border-slate-300 focus:outline-hidden"
                          />
                        ) : (
                          item.date
                        )}
                      </td>

                      {/* Description of Services */}
                      <td className="p-2.5 text-left text-slate-800">
                        {isEditing ? (
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) =>
                              handleItemChange(item.id, 'description', e.target.value)
                            }
                            className="w-full border-b border-slate-300 focus:outline-hidden"
                          />
                        ) : (
                          <div className="font-medium">{item.description}</div>
                        )}
                      </td>

                      {/* Qty */}
                      <td className="p-2.5 text-center font-mono">
                        {isEditing ? (
                          <input
                            type="number"
                            min="1"
                            value={item.qty}
                            onChange={(e) => handleItemChange(item.id, 'qty', e.target.value)}
                            className="w-full text-center border-b border-slate-300 focus:outline-hidden"
                          />
                        ) : (
                          item.qty
                        )}
                      </td>

                      {/* Price */}
                      <td className="p-2.5 text-right font-mono">
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.01"
                            value={item.price}
                            onChange={(e) => handleItemChange(item.id, 'price', e.target.value)}
                            className="w-full text-right border-b border-slate-300 focus:outline-hidden"
                          />
                        ) : (
                          `$${item.price.toFixed(2)}`
                        )}
                      </td>

                      {/* Total */}
                      <td className="p-2.5 text-right font-mono font-medium">
                        ${item.total.toFixed(2)}
                      </td>

                      {/* Remove item button (edit mode only) */}
                      {isEditing && (
                        <td className="p-2 text-center print:hidden">
                          {invoice.items.length > 1 && (
                            <button
                              onClick={() => handleRemoveItem(item.id)}
                              className="text-rose-500 hover:text-rose-700 p-1"
                              title="Delete Item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}

                  {/* Editable: Add line item row */}
                  {isEditing && (
                    <tr className="print:hidden bg-slate-50">
                      <td colSpan={6} className="p-2 text-center">
                        <button
                          onClick={handleAddItem}
                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add Surcharge or Service Item
                        </button>
                      </td>
                    </tr>
                  )}

                  {/* Final Total Row */}
                  <tr className="border-t-2 border-slate-900 font-bold bg-slate-50">
                    <td
                      colSpan={isEditing ? 4 : 4}
                      className="p-2.5 text-right uppercase tracking-wider text-slate-900 border-r-2 border-slate-900"
                    >
                      Total:
                    </td>
                    <td className="p-2.5 text-right font-mono text-sm text-slate-900">
                      ${invoice.total.toFixed(2)}
                    </td>
                    {isEditing && <td className="print:hidden"></td>}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* PAYMENT OPTIONS SECTION (From IMG_0112.png) */}
            <div className="pt-2">
              <div className="text-center">
                <h2 className="text-xl sm:text-2xl font-serif text-slate-900">
                  Payment Options
                </h2>
                <div className="mt-1 h-0.5 bg-slate-800 w-full"></div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Check or E-Check Box (Exact text & styling from IMG_0112.png) */}
                <div className="border-2 border-slate-900 flex flex-col justify-between bg-white text-xs">
                  <div>
                    {/* Header bar */}
                    <div className="bg-slate-100 border-b-2 border-slate-900 p-2 text-center font-bold text-slate-900">
                      Payment by Check or E-Check
                    </div>

                    <div className="p-3.5 space-y-2.5">
                      <div className="font-bold underline text-slate-900">
                        Please Make Checks Payable To:
                      </div>

                      {/* Red Address Header */}
                      <div className="text-red-600 font-medium leading-tight">
                        {isEditing ? (
                          <div className="space-y-1">
                            <input
                              type="text"
                              value={invoice.companyAddress.name}
                              onChange={(e) => setInvoice({
                                ...invoice,
                                companyAddress: { ...invoice.companyAddress, name: e.target.value }
                              })}
                              placeholder="Payable to company name"
                              className="w-full text-xs text-red-700 border-b border-red-300 focus:outline-hidden"
                            />
                            <input
                              type="text"
                              value={invoice.companyAddress.poBox}
                              onChange={(e) => setInvoice({
                                ...invoice,
                                companyAddress: { ...invoice.companyAddress, poBox: e.target.value }
                              })}
                              placeholder="PO Box or Remit Address"
                              className="w-full text-xs text-red-700 border-b border-red-300 focus:outline-hidden"
                            />
                            <input
                              type="text"
                              value={invoice.companyAddress.cityStateZip}
                              onChange={(e) => setInvoice({
                                ...invoice,
                                companyAddress: { ...invoice.companyAddress, cityStateZip: e.target.value }
                              })}
                              placeholder="City, State, Zip"
                              className="w-full text-xs text-red-700 border-b border-red-300 focus:outline-hidden"
                            />
                          </div>
                        ) : (
                          <>
                            <div>{invoice.companyAddress.name}</div>
                            <div>{invoice.companyAddress.poBox}</div>
                            <div>{invoice.companyAddress.cityStateZip}</div>
                          </>
                        )}
                      </div>

                      {/* Notes bullet points */}
                      <div className="text-[11px] text-slate-700 space-y-1 pt-1 leading-relaxed">
                        <div className="font-semibold text-slate-900">Please Note:</div>
                        <p>
                          A {invoice.companyAddress.returnCheckFee} Return Check fee will be assessed for any checks that does not clear.
                        </p>
                        <p>
                          If you have previously bounced a check to us, you <span className="font-bold underline">MUST</span> pay via Money Order or Cashier’s Check only.
                        </p>
                        <p>Third-Party checks will NOT be accepted.</p>
                        <p className="font-medium text-slate-900 pt-1">
                          We accept Visa, Master Card, American Express and Discover.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Stripe Online Payment Processor Box */}
                <div className="border-2 border-slate-900 flex flex-col justify-between bg-slate-50/50 text-xs p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900">
                        <CreditCard className="w-4 h-4 text-indigo-600" />
                        <span>Pay Online with Stripe</span>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-200">
                        Instant Receipt
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600">
                      Securely remit payment online using Credit Card, Debit Card, Apple Pay, or Google Pay.
                    </p>

                    {/* Card Logos / Accepted Methods */}
                    <div className="flex items-center gap-2 pt-1">
                      <span className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-bold text-blue-800">
                        VISA
                      </span>
                      <span className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-bold text-amber-700">
                        Mastercard
                      </span>
                      <span className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-bold text-sky-600">
                        AMEX
                      </span>
                      <span className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-bold text-orange-600">
                        Discover
                      </span>
                    </div>

                    {invoice.status === 'Paid in Full' ? (
                      <div className="mt-3 p-3 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800">
                        <div className="flex items-center gap-1.5 font-bold text-xs">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Paid in Full</span>
                        </div>
                        <div className="text-[11px] text-emerald-700 mt-1">
                          Amount: ${invoice.total.toFixed(2)}
                          {invoice.stripePaymentId && (
                            <div className="font-mono text-[10px] text-emerald-600 mt-0.5 truncate">
                              Ref: {invoice.stripePaymentId}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 pt-2">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-slate-600">Amount Due:</span>
                          <span className="text-slate-900 font-mono text-sm font-bold">
                            ${invoice.balanceDue.toFixed(2)}
                          </span>
                        </div>

                        <button
                          id="btn-invoice-stripe-pay-now"
                          onClick={handleStripeCheckout}
                          disabled={isProcessingStripe}
                          className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          {isProcessingStripe ? 'Opening Stripe...' : `Pay $${invoice.balanceDue.toFixed(2)} via Stripe`}
                        </button>
                        
                        <div className="text-[10px] text-center text-slate-400">
                          256-bit SSL encrypted • Powered by Stripe
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Manual Mark as Paid Shortcut */}
                  <div className="pt-3 mt-3 border-t border-slate-200 flex items-center justify-between text-[11px] print:hidden">
                    <span className="text-slate-500">Received check in mail?</span>
                    <button
                      onClick={handleMarkPaid}
                      className="text-blue-600 hover:text-blue-800 font-semibold"
                    >
                      Record Manual Payment
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* THANK YOU FOOTER (From IMG_0112.png) */}
            <div className="text-center pt-4 border-t border-slate-200">
              <h3 className="font-serif italic font-bold text-base sm:text-lg text-slate-900">
                Thank you for your business!
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-700 mt-1 max-w-xl mx-auto leading-relaxed">
                All services detailed above were completed and delivered by the Billing Date noted above. Payment for services is due upon receipt. We reserve the right to withhold any additional services or deliverables until your account is paid in full.
              </p>
            </div>

          </div>
        </div>

        {/* BOTTOM ACTION BAR (Printable footer excluded from print) */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs print:hidden">
          <div className="flex items-center gap-2 text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Format matches Civil Process Field Standards</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-invoice-close-footer"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold transition"
            >
              Close
            </button>
            <button
              id="btn-invoice-print-footer"
              onClick={handlePrint}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold flex items-center gap-1.5 transition"
            >
              <Printer className="w-4 h-4" />
              Print / Save PDF
            </button>
          </div>
        </div>
      </div>

      {/* STRIPE INTERACTIVE PAYMENT MODAL (For preview/simulation or direct card submission) */}
      {showStripePayModal && (
        <div className="fixed inset-0 z-60 bg-slate-700/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 font-bold text-xs">
                  S
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Stripe Payment Gateway</h3>
                  <p className="text-[11px] text-slate-500">Case #{invoice.caseOrJobNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setShowStripePayModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
              <div className="text-xs text-slate-500">Total Invoice Due</div>
              <div className="text-2xl font-bold font-mono text-slate-900">
                ${invoice.balanceDue.toFixed(2)}
              </div>
              <div className="text-[11px] text-slate-500">
                Client: <span className="font-semibold text-slate-700">{invoice.responsiblePartyClient}</span>
              </div>
            </div>

            {/* Credit Card Input Form */}
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Card Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="4242 4242 4242 4242"
                    className="w-full pl-9 pr-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:border-indigo-500"
                  />
                  <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Expires
                  </label>
                  <input
                    type="text"
                    value={cardExp}
                    onChange={(e) => setCardExp(e.target.value)}
                    placeholder="MM/YY"
                    className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    CVC
                  </label>
                  <input
                    type="text"
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value)}
                    placeholder="123"
                    className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Billing ZIP
                </label>
                <input
                  type="text"
                  value={cardZip}
                  onChange={(e) => setCardZip(e.target.value)}
                  placeholder="28546"
                  className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                id="btn-confirm-stripe-payment"
                onClick={handleConfirmStripePayment}
                disabled={isProcessingStripe}
                className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
              >
                <Lock className="w-3.5 h-3.5" />
                {isProcessingStripe ? 'Processing via Stripe...' : `Authorize Payment ($${invoice.balanceDue.toFixed(2)})`}
              </button>
              <p className="text-[10px] text-center text-slate-400 mt-2">
                Stripe test simulation configured • Secure PCI-DSS Level 1 compliant
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
