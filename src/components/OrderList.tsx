import React, { useState, useMemo } from 'react';
import {
  Search,
  CheckCircle2,
  Clock,
  Zap,
  Table as TableIcon,
  LayoutGrid,
  PlusCircle,
  FileCheck,
  Eye,
  Building2,
  Calendar,
  DollarSign,
  AlertCircle,
  Receipt,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import {
  ServiceOrder,
  UserRole,
  getOrderEntity,
  getOrderAddress,
  getOrderDateAdded,
  getOrderStatus,
  getOrderDateClosed,
  getOrderClosedStatus,
  getOrderResponsibleParty,
  getOrderInvoiceStatus,
  getOrderDueDate,
  getOrderSpeed,
  getOrderPlaintiff,
  getOrderDefendant,
  getOrderComments,
} from '../types';

export type OrderListSortField =
  | 'entity'
  | 'address'
  | 'dateAdded'
  | 'status'
  | 'dateClosed'
  | 'closedStatus'
  | 'client'
  | 'invoiceStatus'
  | 'dueDate'
  | 'speed'
  | 'plaintiff'
  | 'defendant';

interface OrderListProps {
  orders: ServiceOrder[];
  currentRole: UserRole;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  onSelectOrder: (order: ServiceOrder) => void;
  onLogAttempt: (order: ServiceOrder) => void;
  onViewProof: (order: ServiceOrder) => void;
  onOpenInvoice?: (order: ServiceOrder) => void;
  onOpenNewOrder?: () => void;
}

export const OrderList: React.FC<OrderListProps> = ({
  orders,
  currentRole,
  selectedStatus,
  onStatusChange,
  onSelectOrder,
  onLogAttempt,
  onViewProof,
  onOpenInvoice,
  onOpenNewOrder,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpeed, setSelectedSpeed] = useState<string>('all');
  const [selectedInvoiceStatus, setSelectedInvoiceStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [sortField, setSortField] = useState<OrderListSortField>('dateAdded');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleToggleSort = (field: OrderListSortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      if (field === 'dueDate') {
        setSortDirection('asc');
      } else if (field === 'dateAdded' || field === 'dateClosed') {
        setSortDirection('desc');
      } else {
        setSortDirection('asc');
      }
    }
  };

  const filteredOrders = orders.filter((order) => {
    const statusVal = getOrderStatus(order);
    const speedVal = getOrderSpeed(order);
    const invoiceVal = getOrderInvoiceStatus(order);

    // Status filter
    if (selectedStatus !== 'all') {
      if (selectedStatus === 'served' && statusVal !== 'Served') return false;
      if (selectedStatus === 'in_progress' && statusVal !== 'In Progress') return false;
      if (selectedStatus === 'non_served' && statusVal !== 'Non-Served') return false;
      if (selectedStatus === 'assigned' && statusVal !== 'Open') return false;
      if (!['served', 'in_progress', 'non_served', 'assigned'].includes(selectedStatus)) {
        if (statusVal.toLowerCase() !== selectedStatus.toLowerCase()) return false;
      }
    }

    // Speed filter
    if (selectedSpeed !== 'all' && speedVal !== selectedSpeed) {
      return false;
    }

    // Invoice Status filter
    if (selectedInvoiceStatus !== 'all' && invoiceVal !== selectedInvoiceStatus) {
      return false;
    }

    // Search query matches across all table fields
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const entity = getOrderEntity(order).toLowerCase();
      const address = getOrderAddress(order).toLowerCase();
      const client = getOrderResponsibleParty(order).toLowerCase();
      const plaintiff = getOrderPlaintiff(order).toLowerCase();
      const defendant = getOrderDefendant(order).toLowerCase();
      const comments = getOrderComments(order).toLowerCase();
      const caseNum = (order.caseNumber || '').toLowerCase();

      return (
        entity.includes(q) ||
        address.includes(q) ||
        client.includes(q) ||
        plaintiff.includes(q) ||
        defendant.includes(q) ||
        comments.includes(q) ||
        caseNum.includes(q)
      );
    }

    return true;
  });

  const sortedOrders = useMemo(() => {
    return [...filteredOrders].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'entity':
          comparison = getOrderEntity(a).localeCompare(getOrderEntity(b));
          break;
        case 'address':
          comparison = getOrderAddress(a).localeCompare(getOrderAddress(b));
          break;
        case 'dateAdded': {
          const tA = new Date(getOrderDateAdded(a)).getTime() || 0;
          const tB = new Date(getOrderDateAdded(b)).getTime() || 0;
          comparison = tA - tB;
          break;
        }
        case 'status':
          comparison = getOrderStatus(a).localeCompare(getOrderStatus(b));
          break;
        case 'dateClosed': {
          const tA = new Date(getOrderDateClosed(a)).getTime() || 0;
          const tB = new Date(getOrderDateClosed(b)).getTime() || 0;
          comparison = tA - tB;
          break;
        }
        case 'closedStatus':
          comparison = getOrderClosedStatus(a).localeCompare(getOrderClosedStatus(b));
          break;
        case 'client':
          comparison = getOrderResponsibleParty(a).localeCompare(getOrderResponsibleParty(b));
          break;
        case 'invoiceStatus':
          comparison = getOrderInvoiceStatus(a).localeCompare(getOrderInvoiceStatus(b));
          break;
        case 'dueDate': {
          const dStrA = getOrderDueDate(a);
          const dStrB = getOrderDueDate(b);
          const tA = dStrA ? new Date(dStrA).getTime() : 0;
          const tB = dStrB ? new Date(dStrB).getTime() : 0;
          if (!tA && !tB) comparison = 0;
          else if (!tA) comparison = 1;
          else if (!tB) comparison = -1;
          else comparison = tA - tB;
          break;
        }
        case 'speed':
          comparison = getOrderSpeed(a).localeCompare(getOrderSpeed(b));
          break;
        case 'plaintiff':
          comparison = getOrderPlaintiff(a).localeCompare(getOrderPlaintiff(b));
          break;
        case 'defendant':
          comparison = getOrderDefendant(a).localeCompare(getOrderDefendant(b));
          break;
        default:
          comparison = 0;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredOrders, sortField, sortDirection]);

  const getStatusBadge = (statusStr: string) => {
    switch (statusStr) {
      case 'Served':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Served
          </span>
        );
      case 'In Progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3 h-3 text-amber-600" />
            In Progress
          </span>
        );
      case 'Non-Served':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800 border border-rose-300">
            <AlertCircle className="w-3 h-3 text-rose-600" />
            Non-Served
          </span>
        );
      case 'Closed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-300">
            Closed
          </span>
        );
      case 'Open':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-sky-100 text-sky-800 border border-sky-300">
            Open
          </span>
        );
    }
  };

  const getClosedStatusBadge = (closedStr: string) => {
    if (!closedStr || closedStr === 'N/A') {
      return <span className="text-slate-400 font-mono text-xs">N/A</span>;
    }
    if (closedStr === 'Served') {
      return <span className="font-semibold text-emerald-700 text-xs">Served</span>;
    }
    if (closedStr === 'Non-Served') {
      return <span className="font-semibold text-rose-700 text-xs">Non-Served</span>;
    }
    return <span className="font-medium text-slate-700 text-xs">{closedStr}</span>;
  };

  const getInvoiceBadge = (invoiceStr: string) => {
    switch (invoiceStr) {
      case 'Paid in Full':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <DollarSign className="w-3 h-3 text-emerald-600" />
            Paid in Full
          </span>
        );
      case 'Sent–Pending':
      case 'Invoice Sent–Pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            Sent–Pending
          </span>
        );
      case 'Overdue':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            Overdue
          </span>
        );
      case 'Not Sent–Not Paid':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
            Not Sent–Not Paid
          </span>
        );
    }
  };

  const getSpeedBadge = (speedStr: string) => {
    switch (speedStr) {
      case 'Same Day Urgent':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <Zap className="w-3 h-3 text-rose-600 fill-rose-600" />
            Same Day Urgent
          </span>
        );
      case 'Rush (24–48 Hours)':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            Rush (24–48 Hours)
          </span>
        );
      case 'Standard (3–5 Days)':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
            Standard (3–5 Days)
          </span>
        );
    }
  };

  return (
    <div id="service-order-data-entry-workspace" className="space-y-4">
      {/* Search and Filters Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Search Box */}
          <div className="relative flex-1 max-w-lg">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="input-table-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Entity, Address, Client, Plaintiff, Defendant, Notes..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
            />
          </div>

          {/* Quick Filter Selects & View Toggle */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Order Status */}
            <select
              id="filter-order-status"
              value={selectedStatus}
              onChange={(e) => onStatusChange(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium focus:outline-hidden focus:border-blue-500"
            >
              <option value="all">All Order Statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Served">Served</option>
              <option value="Non-Served">Non-Served</option>
              <option value="Closed">Closed</option>
            </select>

            {/* Service Speed */}
            <select
              id="filter-speed-requested"
              value={selectedSpeed}
              onChange={(e) => setSelectedSpeed(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium focus:outline-hidden focus:border-blue-500"
            >
              <option value="all">All Service Speeds</option>
              <option value="Standard (3–5 Days)">Standard (3–5 Days)</option>
              <option value="Rush (24–48 Hours)">Rush (24–48 Hours)</option>
              <option value="Same Day Urgent">Same Day Urgent</option>
            </select>

            {/* Service Invoice Status */}
            <select
              id="filter-invoice-status"
              value={selectedInvoiceStatus}
              onChange={(e) => setSelectedInvoiceStatus(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium focus:outline-hidden focus:border-blue-500"
            >
              <option value="all">All Invoice Statuses</option>
              <option value="Not Sent–Not Paid">Not Sent–Not Paid</option>
              <option value="Sent–Pending">Sent–Pending</option>
              <option value="Paid in Full">Paid in Full</option>
              <option value="Overdue">Overdue</option>
            </select>

            {/* Layout switch */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                id="btn-view-table-mode"
                onClick={() => setViewMode('table')}
                title="Data Entry Table View"
                className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md transition ${
                  viewMode === 'table'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                Data Entry Table
              </button>
              <button
                id="btn-view-grid-mode"
                onClick={() => setViewMode('grid')}
                title="Cards Grid View"
                className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md transition ${
                  viewMode === 'grid'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                Cards
              </button>
            </div>

            {/* Enter New Service Order Button */}
            {onOpenNewOrder && (
              <button
                id="btn-table-new-order"
                onClick={onOpenNewOrder}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-xs transition"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Enter New Service Order
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Zero State */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No matching service orders found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Try adjusting your search query, status, or speed filters to view data entries.
          </p>
          {onOpenNewOrder && (
            <button
              onClick={onOpenNewOrder}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition"
            >
              <PlusCircle className="w-4 h-4" />
              Enter New Service Order
            </button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        /* DATA ENTRY TABLE VIEW WITH EXACT COLUMN LABELS FROM IMG_0111.png */
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto max-w-full">
            <table
              id="data-entry-table"
              className="w-full text-left border-collapse text-xs min-w-[1780px]"
            >
              <thead>
                <tr className="bg-slate-800 text-white font-semibold text-[11px] uppercase tracking-wider divide-x divide-slate-700">
                  <th
                    onClick={() => handleToggleSort('entity')}
                    className={`py-3 px-4 sticky left-0 z-20 shadow-md min-w-[200px] cursor-pointer select-none transition hover:bg-slate-700 ${
                      sortField === 'entity' ? 'bg-slate-700 text-sky-300' : 'bg-slate-800 text-white'
                    }`}
                    title="Sort by Entity Being Served"
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <span>Entity Being Served</span>
                      <span className={sortField === 'entity' ? 'text-sky-300' : 'text-slate-500 opacity-60'}>
                        {sortField === 'entity' ? (
                          sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3" />
                        )}
                      </span>
                    </div>
                  </th>
                  <th
                    onClick={() => handleToggleSort('address')}
                    className={`py-3 px-4 min-w-[260px] cursor-pointer select-none transition hover:bg-slate-700 ${
                      sortField === 'address' ? 'bg-slate-700 text-sky-300' : ''
                    }`}
                    title="Sort by Service Address"
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <span>Service Address</span>
                      <span className={sortField === 'address' ? 'text-sky-300' : 'text-slate-500 opacity-60'}>
                        {sortField === 'address' ? (
                          sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3" />
                        )}
                      </span>
                    </div>
                  </th>
                  <th
                    onClick={() => handleToggleSort('dateAdded')}
                    className={`py-3 px-3 min-w-[140px] whitespace-nowrap cursor-pointer select-none transition hover:bg-slate-700 ${
                      sortField === 'dateAdded' ? 'bg-slate-700 text-sky-300' : ''
                    }`}
                    title="Sort by Date Added"
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <span>Date Added (MM/DD/YYYY)</span>
                      <span className={sortField === 'dateAdded' ? 'text-sky-300' : 'text-slate-500 opacity-60'}>
                        {sortField === 'dateAdded' ? (
                          sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3" />
                        )}
                      </span>
                    </div>
                  </th>
                  <th
                    onClick={() => handleToggleSort('status')}
                    className={`py-3 px-3 min-w-[125px] cursor-pointer select-none transition hover:bg-slate-700 ${
                      sortField === 'status' ? 'bg-slate-700 text-sky-300' : ''
                    }`}
                    title="Sort by Order Status"
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <span>Order Status</span>
                      <span className={sortField === 'status' ? 'text-sky-300' : 'text-slate-500 opacity-60'}>
                        {sortField === 'status' ? (
                          sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3" />
                        )}
                      </span>
                    </div>
                  </th>
                  <th
                    onClick={() => handleToggleSort('dateClosed')}
                    className={`py-3 px-3 min-w-[140px] whitespace-nowrap cursor-pointer select-none transition hover:bg-slate-700 ${
                      sortField === 'dateClosed' ? 'bg-slate-700 text-sky-300' : ''
                    }`}
                    title="Sort by Date Closed"
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <span>Date Closed</span>
                      <span className={sortField === 'dateClosed' ? 'text-sky-300' : 'text-slate-500 opacity-60'}>
                        {sortField === 'dateClosed' ? (
                          sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3" />
                        )}
                      </span>
                    </div>
                  </th>
                  <th
                    onClick={() => handleToggleSort('closedStatus')}
                    className={`py-3 px-3 min-w-[120px] cursor-pointer select-none transition hover:bg-slate-700 ${
                      sortField === 'closedStatus' ? 'bg-slate-700 text-sky-300' : ''
                    }`}
                    title="Sort by Closed Status"
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <span>Closed Status</span>
                      <span className={sortField === 'closedStatus' ? 'text-sky-300' : 'text-slate-500 opacity-60'}>
                        {sortField === 'closedStatus' ? (
                          sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3" />
                        )}
                      </span>
                    </div>
                  </th>
                  <th
                    onClick={() => handleToggleSort('client')}
                    className={`py-3 px-4 min-w-[180px] cursor-pointer select-none transition hover:bg-slate-700 ${
                      sortField === 'client' ? 'bg-slate-700 text-sky-300' : ''
                    }`}
                    title="Sort by Responsible Party (Client)"
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <span>Responsible Party</span>
                      <span className={sortField === 'client' ? 'text-sky-300' : 'text-slate-500 opacity-60'}>
                        {sortField === 'client' ? (
                          sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3" />
                        )}
                      </span>
                    </div>
                  </th>
                  <th
                    onClick={() => handleToggleSort('invoiceStatus')}
                    className={`py-3 px-3 min-w-[150px] cursor-pointer select-none transition hover:bg-slate-700 ${
                      sortField === 'invoiceStatus' ? 'bg-slate-700 text-sky-300' : ''
                    }`}
                    title="Sort by Invoice Status"
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <span>Invoice Status</span>
                      <span className={sortField === 'invoiceStatus' ? 'text-sky-300' : 'text-slate-500 opacity-60'}>
                        {sortField === 'invoiceStatus' ? (
                          sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3" />
                        )}
                      </span>
                    </div>
                  </th>
                  <th
                    onClick={() => handleToggleSort('dueDate')}
                    className={`py-3 px-3 min-w-[150px] whitespace-nowrap cursor-pointer select-none transition hover:bg-slate-700 ${
                      sortField === 'dueDate' ? 'bg-slate-700 text-sky-300' : ''
                    }`}
                    title="Sort by Due Date / Deadline"
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <span>Due Date Requested</span>
                      <span className={sortField === 'dueDate' ? 'text-sky-300' : 'text-slate-500 opacity-60'}>
                        {sortField === 'dueDate' ? (
                          sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3" />
                        )}
                      </span>
                    </div>
                  </th>
                  <th
                    onClick={() => handleToggleSort('speed')}
                    className={`py-3 px-3 min-w-[150px] cursor-pointer select-none transition hover:bg-slate-700 ${
                      sortField === 'speed' ? 'bg-slate-700 text-sky-300' : ''
                    }`}
                    title="Sort by Service Speed"
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <span>Speed Requested</span>
                      <span className={sortField === 'speed' ? 'text-sky-300' : 'text-slate-500 opacity-60'}>
                        {sortField === 'speed' ? (
                          sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3" />
                        )}
                      </span>
                    </div>
                  </th>
                  <th
                    onClick={() => handleToggleSort('plaintiff')}
                    className={`py-3 px-4 min-w-[170px] cursor-pointer select-none transition hover:bg-slate-700 ${
                      sortField === 'plaintiff' ? 'bg-slate-700 text-sky-300' : ''
                    }`}
                    title="Sort by Plaintiff Name"
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <span>Plaintiff Name</span>
                      <span className={sortField === 'plaintiff' ? 'text-sky-300' : 'text-slate-500 opacity-60'}>
                        {sortField === 'plaintiff' ? (
                          sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3" />
                        )}
                      </span>
                    </div>
                  </th>
                  <th
                    onClick={() => handleToggleSort('defendant')}
                    className={`py-3 px-4 min-w-[170px] cursor-pointer select-none transition hover:bg-slate-700 ${
                      sortField === 'defendant' ? 'bg-slate-700 text-sky-300' : ''
                    }`}
                    title="Sort by Defendant Name"
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <span>Defendant Name</span>
                      <span className={sortField === 'defendant' ? 'text-sky-300' : 'text-slate-500 opacity-60'}>
                        {sortField === 'defendant' ? (
                          sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3" />
                        )}
                      </span>
                    </div>
                  </th>
                  <th className="py-3 px-4 min-w-[240px]">Comments/Notes</th>
                  <th className="py-3 px-4 sticky right-0 z-20 bg-slate-800 shadow-md min-w-[140px] text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedOrders.map((order, idx) => {
                  const entity = getOrderEntity(order);
                  const address = getOrderAddress(order);
                  const dateAdded = getOrderDateAdded(order);
                  const orderStatus = getOrderStatus(order);
                  const dateClosed = getOrderDateClosed(order);
                  const closedStatus = getOrderClosedStatus(order);
                  const client = getOrderResponsibleParty(order);
                  const invoiceStatus = getOrderInvoiceStatus(order);
                  const dueDate = getOrderDueDate(order);
                  const speed = getOrderSpeed(order);
                  const plaintiff = getOrderPlaintiff(order);
                  const defendant = getOrderDefendant(order);
                  const comments = getOrderComments(order);

                  return (
                    <tr
                      key={order.id}
                      id={`table-row-${order.id}`}
                      className={`hover:bg-blue-50/40 transition divide-x divide-slate-100 ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                      }`}
                    >
                      {/* 1. Entity Being Served (Sticky left) */}
                      <td className="py-3 px-4 sticky left-0 z-10 bg-inherit font-bold text-slate-900 shadow-xs">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => onSelectOrder(order)}
                            className="text-left font-semibold text-slate-900 hover:text-blue-600 transition line-clamp-1"
                            title={entity}
                          >
                            {entity}
                          </button>
                        </div>
                        {order.caseNumber && (
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {order.caseNumber}
                          </div>
                        )}
                      </td>

                      {/* 2. Service Address */}
                      <td className="py-3 px-4 text-slate-700">
                        <span className="line-clamp-2" title={address}>
                          {address}
                        </span>
                      </td>

                      {/* 3. Date Added (MM/DD/YYYY) */}
                      <td className="py-3 px-3 font-mono text-slate-600 whitespace-nowrap">
                        {dateAdded}
                      </td>

                      {/* 4. Order Status */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {getStatusBadge(orderStatus)}
                      </td>

                      {/* 5. Date Closed (MM/DD/YYYY) */}
                      <td className="py-3 px-3 font-mono text-slate-500 whitespace-nowrap">
                        {dateClosed}
                      </td>

                      {/* 6. Closed Status */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {getClosedStatusBadge(closedStatus)}
                      </td>

                      {/* 7. Responsible Party (Client) */}
                      <td className="py-3 px-4 font-medium text-slate-800">
                        <span className="line-clamp-1" title={client}>
                          {client}
                        </span>
                      </td>

                      {/* 8. Service Invoice Status */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {getInvoiceBadge(invoiceStatus)}
                      </td>

                      {/* 9. Due Date Requested (MM/DD/YYYY) */}
                      <td className="py-3 px-3 font-mono font-medium text-rose-700 whitespace-nowrap">
                        {dueDate}
                      </td>

                      {/* 10. Service Speed Requested */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {getSpeedBadge(speed)}
                      </td>

                      {/* 11. Plaintiff Name */}
                      <td className="py-3 px-4 text-slate-800">
                        <span className="line-clamp-1" title={plaintiff}>
                          {plaintiff}
                        </span>
                      </td>

                      {/* 12. Defendant Name */}
                      <td className="py-3 px-4 text-slate-800">
                        <span className="line-clamp-1" title={defendant}>
                          {defendant}
                        </span>
                      </td>

                      {/* 13. Comments/Notes */}
                      <td className="py-3 px-4 text-slate-600 max-w-xs">
                        <span className="line-clamp-2" title={comments}>
                          {comments}
                        </span>
                      </td>

                      {/* Actions (Sticky Right) */}
                      <td className="py-3 px-4 sticky right-0 z-10 bg-inherit text-right whitespace-nowrap shadow-xs">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            id={`btn-view-${order.id}`}
                            onClick={() => onSelectOrder(order)}
                            title="View Full File"
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {onOpenInvoice && (
                            <button
                              id={`btn-invoice-${order.id}`}
                              onClick={() => onOpenInvoice(order)}
                              title="Invoice Generator & Stripe Review"
                              className="px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-semibold text-[11px] transition inline-flex items-center gap-1"
                            >
                              <Receipt className="w-3 h-3 text-blue-600" />
                              Invoice
                            </button>
                          )}

                          {orderStatus === 'Served' ? (
                            <button
                              id={`btn-proof-${order.id}`}
                              onClick={() => onViewProof(order)}
                              title="Proof of Service"
                              className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold text-[11px] transition inline-flex items-center gap-1"
                            >
                              <FileCheck className="w-3 h-3" />
                              Proof
                            </button>
                          ) : (
                            <button
                              id={`btn-attempt-${order.id}`}
                              onClick={() => onLogAttempt(order)}
                              title="Log Field Attempt"
                              className="px-2 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-[11px] shadow-xs transition inline-flex items-center gap-1"
                            >
                              <PlusCircle className="w-3 h-3" />
                              Attempt
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table summary bar */}
          <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
            <div>
              Showing <span className="font-bold text-slate-800">{filteredOrders.length}</span> of{' '}
              <span className="font-bold text-slate-800">{orders.length}</span> service orders in
              table
            </div>
            <div className="text-[11px] text-slate-400">
              Columns match standardized Field Workflow schema • Scroll horizontally for full entry
            </div>
          </div>
        </div>
      ) : (
        /* GRID / CARDS VIEW WITH EXACT FIELD LABELS */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map((order) => {
            const entity = getOrderEntity(order);
            const address = getOrderAddress(order);
            const dateAdded = getOrderDateAdded(order);
            const orderStatus = getOrderStatus(order);
            const dateClosed = getOrderDateClosed(order);
            const closedStatus = getOrderClosedStatus(order);
            const client = getOrderResponsibleParty(order);
            const invoiceStatus = getOrderInvoiceStatus(order);
            const dueDate = getOrderDueDate(order);
            const speed = getOrderSpeed(order);
            const plaintiff = getOrderPlaintiff(order);
            const defendant = getOrderDefendant(order);
            const comments = getOrderComments(order);

            return (
              <div
                key={order.id}
                id={`card-${order.id}`}
                className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition overflow-hidden flex flex-col"
              >
                {/* Card Header */}
                <div className="p-4 border-b border-slate-100 bg-slate-50/70">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Entity Being Served
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 mt-0.5">{entity}</h3>
                    </div>
                    {getStatusBadge(orderStatus)}
                  </div>
                </div>

                {/* Card Body with all screenshot fields */}
                <div className="p-4 space-y-2.5 text-xs flex-1">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Service Address
                    </span>
                    <span className="text-slate-800 line-clamp-2">{address}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Date Added (MM/DD/YYYY)
                      </span>
                      <span className="font-mono text-slate-700">{dateAdded}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Date Closed (MM/DD/YYYY)
                      </span>
                      <span className="font-mono text-slate-700">{dateClosed}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Closed Status
                      </span>
                      {getClosedStatusBadge(closedStatus)}
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Service Speed Requested
                      </span>
                      {getSpeedBadge(speed)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Responsible Party (Client)
                      </span>
                      <span className="text-slate-800 font-medium line-clamp-1">{client}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Service Invoice Status
                      </span>
                      {getInvoiceBadge(invoiceStatus)}
                    </div>
                  </div>

                  <div className="pt-1 border-t border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Due Date Requested (MM/DD/YYYY)
                    </span>
                    <span className="font-mono font-bold text-rose-700">{dueDate}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Plaintiff Name
                      </span>
                      <span className="text-slate-800 line-clamp-1">{plaintiff}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Defendant Name
                      </span>
                      <span className="text-slate-800 line-clamp-1">{defendant}</span>
                    </div>
                  </div>

                  {comments && (
                    <div className="pt-1 border-t border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Comments/Notes
                      </span>
                      <span className="text-slate-600 line-clamp-2 italic">{comments}</span>
                    </div>
                  )}
                </div>

                {/* Card Actions Footer */}
                <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onSelectOrder(order)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition"
                  >
                    View File
                  </button>

                  <div className="flex items-center gap-2">
                    {onOpenInvoice && (
                      <button
                        onClick={() => onOpenInvoice(order)}
                        className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition inline-flex items-center gap-1"
                        title="Invoice Generator & Stripe Review"
                      >
                        <Receipt className="w-3 h-3 text-blue-600" />
                        Invoice
                      </button>
                    )}

                    {orderStatus === 'Served' ? (
                      <button
                        onClick={() => onViewProof(order)}
                        className="px-2.5 py-1 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition"
                      >
                        Proof of Service
                      </button>
                    ) : (
                      <button
                        onClick={() => onLogAttempt(order)}
                        className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-500 text-white transition shadow-xs"
                      >
                        <PlusCircle className="w-3 h-3" />
                        Log Attempt
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
