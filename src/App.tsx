import React, { useState, useEffect, useMemo } from 'react';
import { MarketingPage } from './components/MarketingPage';
import { AuthOverlay } from './components/AuthOverlay';
import { OrderIntakeModal } from './components/OrderIntakeModal';
import { AffidavitModal } from './components/AffidavitModal';
import { InvoiceModal } from './components/InvoiceModal';
import { AccountSetupForm, UserAccountValues, createDefaultAccountValues } from './components/AccountSetupForm';
import { BrandLogo } from './components/BrandLogo';
import { ServiceOrder, extractClientEmail } from './types';

// Clean initial user (no example records)
const CLEAN_WORKSPACE_USER: UserAccountValues = {
  id: 1,
  full_name: 'Agency Admin',
  firstName: 'Agency',
  first_name: 'Agency',
  lastName: 'Admin',
  email: 'admin@processservers.demo',
  role: 'agency_admin',
  agency: 'Process Servers Solution',
  username: 'admin',
  phone: '',
  active: true,
  customerName: '',
  paySheet: 'Standard Paysheet',
  isProcessServer: 'Yes',
  licenseNumber: '',
  licenseExpDate: '',
  countyOfLicense: '',
  dateOfBirth: '',
  emailCcList: '',
  zipCodes: []
};

interface AttemptSlotState {
  date: string;
  time: string;
  notes: string;
  physicalDescription: string;
  gpsLat: string;
  gpsLng: string;
  evidenceUrl: string;
  outcome: 'pending' | 'attempted' | 'served';
}

function emptyAttempt(): AttemptSlotState {
  return {
    date: new Date().toISOString().slice(0, 10),
    time: new Date().toTimeString().slice(0, 5),
    notes: '',
    physicalDescription: '',
    gpsLat: '',
    gpsLng: '',
    evidenceUrl: '',
    outcome: 'pending'
  };
}

function getInitials(name: string): string {
  if (!name) return 'PS';
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');
}

function getRoleLabel(role: string): string {
  switch (role) {
    case 'agency_admin':
      return 'PS Company';
    case 'process_server':
      return 'Process Server';
    case 'client':
      return 'Customer User';
    default:
      return role || 'User';
  }
}

function getNavItemsForRole(role: string) {
  const allNav = [
    { id: 'home', label: 'Home', roles: ['agency_admin', 'process_server', 'client'] },
    { id: 'dashboard', label: 'Dashboard', roles: ['agency_admin', 'process_server', 'client'] },
    { id: 'orders', label: 'Orders', roles: ['agency_admin', 'client'] },
    { id: 'field', label: 'Field', roles: ['agency_admin', 'process_server'] },
    { id: 'clients', label: 'Clients', roles: ['agency_admin', 'client'] },
    { id: 'users', label: 'Users', roles: ['agency_admin'] },
    { id: 'affidavits', label: 'Affidavits', roles: ['agency_admin', 'process_server', 'client'] },
    { id: 'billing', label: 'Billing', roles: ['agency_admin'] },
    { id: 'settings', label: 'Settings', roles: ['agency_admin', 'process_server', 'client'] }
  ];
  return allNav.filter((n) => n.roles.includes(role));
}

export const App: React.FC = () => {
  // Session User
  const [currentUser, setCurrentUser] = useState<any>(() => {
    const saved = localStorage.getItem('pss_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return CLEAN_WORKSPACE_USER;
  });

  const [loadingSession, setLoadingSession] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('home');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // App Data
  const [orders, setOrders] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [serversList, setServersList] = useState<any[]>([]);
  const [clientsList, setClientsList] = useState<any[]>([]);

  // Modals & Overlays
  const [authOverlayMode, setAuthOverlayMode] = useState<'signin' | 'signup' | 'recover' | null>(null);
  const [authPackageId, setAuthPackageId] = useState<string>('silver');
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedAffidavitOrder, setSelectedAffidavitOrder] = useState<any | null>(null);
  const [affidavitDraftText, setAffidavitDraftText] = useState<string>('');
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<any | null>(null);
  const [emailingInvoiceOrderId, setEmailingInvoiceOrderId] = useState<number | string | null>(null);
  const [emailInvoiceSuccessModal, setEmailInvoiceSuccessModal] = useState<{
    orderId: string | number;
    recipientEmail: string;
    recipientName: string;
    invoiceNumber: string;
    attachedPdfName: string;
    amount: number;
    sentAt: string;
    caseTitle: string;
  } | null>(null);

  // Toast / Flash Message
  const [flash, setFlash] = useState<{ message: string; isError: boolean } | null>(null);

  // Assign Server & Status state in Orders view
  const [assignState, setAssignState] = useState({ orderId: '', serverId: '' });
  const [orderStatusState, setOrderStatusState] = useState({ orderId: '', status: 'in_progress' });

  // Orders View Sorting & Workload Filter State
  type OrderSortField = 'id' | 'title' | 'date_added' | 'status' | 'client' | 'server' | 'deadline';
  type SortDirection = 'asc' | 'desc';

  const [orderSortField, setOrderSortField] = useState<OrderSortField>('deadline');
  const [orderSortDirection, setOrderSortDirection] = useState<SortDirection>('asc');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');

  // Field Attempts State
  const [selectedFieldOrderId, setSelectedFieldOrderId] = useState<string>('');
  const [fieldAttempts, setFieldAttempts] = useState<AttemptSlotState[]>([
    emptyAttempt(),
    emptyAttempt(),
    emptyAttempt()
  ]);

  // Users View Subtab and Search State
  const [userSearch, setUserSearch] = useState({ firstName: '', lastName: '' });
  const [activeUserFilter, setActiveUserFilter] = useState({ firstName: '', lastName: '' });
  const [usersSubtab, setUsersSubtab] = useState<'current' | 'edit' | 'add'>('current');
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [editingUserValues, setEditingUserValues] = useState<UserAccountValues>(() => createDefaultAccountValues());
  const [newUserValues, setNewUserValues] = useState<UserAccountValues>(() =>
    createDefaultAccountValues({ role: 'process_server', isProcessServer: 'Yes' })
  );

  // Settings State
  const [settingsValues, setSettingsValues] = useState<UserAccountValues>(() =>
    currentUser ? { ...currentUser } : createDefaultAccountValues()
  );

  const showFlash = (message: string, isError = false) => {
    setFlash({ message, isError });
    setTimeout(() => {
      setFlash((f) => (f?.message === message ? null : f));
    }, 4500);
  };

  // Sync session and initial data
  const fetchData = async () => {
    try {
      const sessRes = await fetch('/api/auth/session');
      if (sessRes.ok) {
        const sessData = await sessRes.json();
        if (sessData.user) {
          setCurrentUser(sessData.user);
          localStorage.setItem('pss_user', JSON.stringify(sessData.user));
          setSettingsValues({ ...sessData.user });
        }
      }

      const [ordRes, notifRes, usersRes, serversRes, clientsRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/notifications'),
        fetch('/api/users'),
        fetch('/api/users/process-servers'),
        fetch('/api/users/clients')
      ]);

      if (ordRes.ok) {
        const d = await ordRes.json();
        if (d.orders) setOrders(d.orders);
      }
      if (notifRes.ok) {
        const d = await notifRes.json();
        if (d.notifications) setNotifications(d.notifications);
      }
      if (usersRes.ok) {
        const d = await usersRes.json();
        if (d.users) setUsersList(d.users);
      }
      if (serversRes.ok) {
        const d = await serversRes.json();
        if (d.users) setServersList(d.users);
      }
      if (clientsRes.ok) {
        const d = await clientsRes.json();
        if (d.users) setClientsList(d.users);
      }
    } catch (e) {
      console.warn('API sync warning:', e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update field attempts when selected field order changes
  useEffect(() => {
    if (!selectedFieldOrderId) return;
    const ord = orders.find((o) => String(o.id) === String(selectedFieldOrderId));
    if (ord && ord.attempts && ord.attempts.length > 0) {
      setFieldAttempts([
        ord.attempts[0] ? { ...ord.attempts[0], outcome: ord.attempts[0].outcome || 'attempted' } : emptyAttempt(),
        ord.attempts[1] ? { ...ord.attempts[1], outcome: ord.attempts[1].outcome || 'attempted' } : emptyAttempt(),
        ord.attempts[2] ? { ...ord.attempts[2], outcome: ord.attempts[2].outcome || 'attempted' } : emptyAttempt()
      ]);
    } else {
      setFieldAttempts([emptyAttempt(), emptyAttempt(), emptyAttempt()]);
    }
  }, [selectedFieldOrderId, orders]);

  // Statistics calculation
  const stats = useMemo(() => {
    const all = orders.length;
    const inProgress = orders.filter((o) => o.status === 'in_progress' || o.status === 'assigned').length;
    const completed = orders.filter((o) => o.status === 'completed' || o.status === 'served').length;
    const deadlineWatch = orders.filter((o) => o.deadline).length;
    const unreadAlerts = notifications.filter((n) => !n.read_at).length;
    return { all, inProgress, completed, deadlineWatch, unreadAlerts };
  }, [orders, notifications]);

  // Deadlines list sorted ascending
  const upcomingDeadlines = useMemo(() => {
    return orders
      .filter((o) => o.deadline)
      .slice()
      .sort((a, b) => String(a.deadline).localeCompare(String(b.deadline)))
      .slice(0, 6);
  }, [orders]);

  // View titles and subtitles
  const viewInfo = useMemo(() => {
    const map: Record<string, { title: string; subtitle: string }> = {
      home: { title: 'Home', subtitle: 'Company overview — Process Servers Solution platform' },
      dashboard: { title: 'Dashboard', subtitle: 'Operational pulse across intake, dispatch, and field' },
      orders: { title: 'Orders', subtitle: 'Jobs & intake — create, assign, and track service orders' },
      field: { title: 'Field', subtitle: 'Field attempts & evidence logging' },
      clients: { title: 'Clients', subtitle: 'Client CRM / client portal visibility' },
      users: { title: 'Users', subtitle: 'Search, view, and manage user accounts' },
      affidavits: { title: 'Affidavits / Proof', subtitle: 'Compliance & proof of service drafts' },
      billing: { title: 'Billing', subtitle: 'Agency billing & invoice stubs' },
      settings: { title: 'Settings', subtitle: 'Workspace, account, and notifications' }
    };
    return map[activeTab] || map.home;
  }, [activeTab]);

  // Handlers for Orders operations
  const handleCreateOrder = async (orderData: any) => {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
    const d = await res.json();
    if (!res.ok) throw new Error(d.error || 'Failed to create order');
    showFlash('Order created.');
    fetchData();
  };

  const handleAssignServer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignState.orderId || !assignState.serverId) {
      showFlash('Select both an order and a process server.', true);
      return;
    }
    try {
      const res = await fetch(`/api/orders/${assignState.orderId}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverId: Number(assignState.serverId) })
      });
      if (!res.ok) throw new Error('Failed to assign server');
      showFlash('Server assigned.');
      fetchData();
    } catch (err: any) {
      showFlash(err.message, true);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderStatusState.orderId) {
      showFlash('Select an order to update.', true);
      return;
    }
    try {
      const res = await fetch(`/api/orders/${orderStatusState.orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: orderStatusState.status })
      });
      if (!res.ok) throw new Error('Failed to update status');
      showFlash('Status updated.');
      fetchData();
    } catch (err: any) {
      showFlash(err.message, true);
    }
  };

  // Field Attempt logging
  const handleLogAttempt = async (slotIdx: number) => {
    const slot = fieldAttempts[slotIdx];
    if (!selectedFieldOrderId) {
      showFlash('Select an order before logging an attempt.', true);
      return;
    }
    if (!slot.notes.trim()) {
      showFlash(`Attempt ${slotIdx + 1}: notes are required.`, true);
      return;
    }
    if (slot.outcome === 'served' && !slot.physicalDescription.trim()) {
      showFlash(`Attempt ${slotIdx + 1}: physical description is required when marking successfully served.`, true);
      return;
    }

    const noteTimeline = [
      `${slotIdx + 1}${slotIdx === 0 ? 'st' : slotIdx === 1 ? 'nd' : 'rd'} attempt`,
      slot.date,
      slot.time,
      slot.outcome === 'served' ? 'SUCCESSFULLY SERVED' : undefined
    ]
      .filter(Boolean)
      .join(' · ');

    try {
      const res = await fetch(`/api/orders/${selectedFieldOrderId}/attempts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: slot.notes,
          gpsLat: slot.gpsLat ? Number(slot.gpsLat) : null,
          gpsLng: slot.gpsLng ? Number(slot.gpsLng) : null,
          physicalDescription: slot.physicalDescription,
          timelineNote: noteTimeline,
          evidenceUrl: slot.evidenceUrl
        })
      });
      if (!res.ok) throw new Error('Failed to log attempt');
      showFlash(`${slotIdx + 1}${slotIdx === 0 ? 'st' : slotIdx === 1 ? 'nd' : 'rd'} attempt logged.`);
      fetchData();
    } catch (err: any) {
      showFlash(err.message, true);
    }
  };

  // Draft Affidavit
  const handleDraftAffidavit = async (orderId: number) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/affidavit-draft`, { method: 'POST' });
      const d = await res.json();
      const ord = orders.find((o) => o.id === orderId);
      setSelectedAffidavitOrder(ord || { id: orderId, title: `Order #${orderId}` });
      setAffidavitDraftText(d.affidavit || '');
      showFlash(`Affidavit draft ready for order #${orderId}.`);
    } catch (err: any) {
      showFlash(err.message, true);
    }
  };

  // Invoice Stub & Full Invoice
  const handleInvoiceStub = async (orderId: number) => {
    try {
      await fetch(`/api/orders/${orderId}/invoice-stub`, { method: 'POST' });
      showFlash(`Invoice stub generated for order #${orderId} with header '${currentUser?.agency || 'Process Servers Solution'}'.`);
      fetchData();
    } catch (err: any) {
      showFlash(err.message, true);
    }
  };

  const handleOpenFullInvoice = (order: any) => {
    // Map order to ServiceOrder compatibility
    const compatibleOrder: ServiceOrder = {
      id: String(order.id),
      entityBeingServed: order.entityBeingServed || order.title,
      serviceAddress: order.serviceAddress || '1420 Ocean Avenue, Santa Monica, CA 90401',
      dateAdded: order.created_at ? order.created_at.slice(0, 10) : '09/17/2026',
      orderStatus: order.status === 'completed' ? 'Served' : 'In Progress',
      closedStatus: order.status === 'completed' ? 'Served' : 'N/A',
      responsiblePartyClient: order.client_name || 'Summit Legal Group',
      clientEmail: extractClientEmail(order),
      clientName: order.client_name || 'Summit Legal Group',
      serviceInvoiceStatus: order.status === 'completed' ? 'Paid in Full' : 'Sent–Pending',
      dueDateRequested: order.deadline || '10/24/2026',
      serviceSpeedRequested: 'Standard (3–5 Days)',
      plaintiffName: order.title ? order.title.split(' v. ')[0] || 'Plaintiff' : 'Plaintiff',
      defendantName: order.title ? order.title.split(' v. ')[1] || 'Defendant' : 'Defendant',
      caseNumber: `CV-${order.id}`,
      attempts: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setSelectedInvoiceOrder(compatibleOrder);
  };

  // Automatically trigger email notification to client with invoice attached
  const handleEmailInvoiceToClient = async (order: any) => {
    const clientEmail = extractClientEmail(order);
    const orderId = order.id;
    const invNum = `INV-${orderId}`;
    const amount = 175.00;
    const clientName = order.client_name || order.clientName || 'Valued Client';
    const caseTitle = order.title || `Civil Action #${orderId}`;
    const attachedPdfName = `Invoice_${invNum}.pdf`;

    setEmailingInvoiceOrderId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/email-invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientEmail,
          clientName,
          invoiceNumber: invNum,
          amount,
          serviceTitle: caseTitle,
          attachedPdfName
        })
      });

      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Failed to email invoice to client');

      // Update local order invoice status to 'Sent–Pending'
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, serviceInvoiceStatus: 'Sent–Pending', invoiceSentAt: d.sentAt, invoiceSentTo: clientEmail }
            : o
        )
      );

      // Add dispatch notification
      if (d.notification) {
        setNotifications((prev) => [d.notification, ...prev]);
      }

      setEmailInvoiceSuccessModal({
        orderId,
        recipientEmail: d.recipientEmail || clientEmail,
        recipientName: d.recipientName || clientName,
        invoiceNumber: invNum,
        attachedPdfName: d.attachedPdfName || attachedPdfName,
        amount: d.amount || amount,
        sentAt: d.sentAt || new Date().toLocaleString(),
        caseTitle
      });

      showFlash(`Invoice #${invNum} automatically emailed to ${clientEmail} with attached PDF!`);
      fetchData();
    } catch (err: any) {
      showFlash(err.message || 'Error emailing invoice', true);
    } finally {
      setEmailingInvoiceOrderId(null);
    }
  };

  // Sign out
  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
    } catch (e) {}
    setCurrentUser(null);
    localStorage.removeItem('pss_user');
    showFlash('Signed out.');
  };

  // Update Settings / User Profile
  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsValues)
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Failed to update profile');
      setCurrentUser(d.user);
      localStorage.setItem('pss_user', JSON.stringify(d.user));
      showFlash(`Account updated. Company name set to: ${d.user.agency}`);
      fetchData();
    } catch (err: any) {
      showFlash(err.message, true);
    }
  };

  // Sorting & Filtering Handlers for Service Orders
  const handleToggleSort = (field: OrderSortField) => {
    if (orderSortField === field) {
      setOrderSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setOrderSortField(field);
      // Sensible defaults: Deadline is urgent first (asc), Date/ID is newest/highest first (desc)
      if (field === 'deadline') {
        setOrderSortDirection('asc');
      } else if (field === 'date_added' || field === 'id') {
        setOrderSortDirection('desc');
      } else {
        setOrderSortDirection('asc');
      }
    }
  };

  const formatDateDisplay = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const formatDeadlineDisplay = (deadlineStr?: string | null) => {
    if (!deadlineStr) return { text: '—', badge: null };
    try {
      const d = new Date(deadlineStr);
      if (isNaN(d.getTime())) return { text: deadlineStr, badge: null };

      const formatted = d.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
      });

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const target = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const diffDays = Math.round((target - today) / (1000 * 60 * 60 * 24));

      let badge: { label: string; color: string } | null = null;
      if (diffDays < 0) {
        badge = { label: `${Math.abs(diffDays)}d overdue`, color: 'bg-rose-100 text-rose-700 border-rose-200 font-semibold' };
      } else if (diffDays === 0) {
        badge = { label: 'Due today', color: 'bg-amber-100 text-amber-800 border-amber-300 font-bold' };
      } else if (diffDays <= 2) {
        badge = { label: `${diffDays}d left`, color: 'bg-amber-50 text-amber-700 border-amber-200 font-medium' };
      }

      return { text: formatted, badge };
    } catch {
      return { text: deadlineStr, badge: null };
    }
  };

  // Filtered and Sorted Orders memo
  const sortedAndFilteredOrders = useMemo(() => {
    // 1. Filter
    let list = orders.filter((o) => {
      if (orderStatusFilter !== 'all') {
        const s = String(o.status || '').toLowerCase();
        if (orderStatusFilter === 'active') {
          if (s === 'completed' || s === 'served') return false;
        } else if (orderStatusFilter === 'urgent') {
          if (!o.deadline) return false;
          const diffDays = Math.round((new Date(o.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          if (diffDays > 3) return false;
        } else if (orderStatusFilter === 'unassigned') {
          if (o.assigned_server_name) return false;
        } else if (s !== orderStatusFilter.toLowerCase()) {
          return false;
        }
      }

      if (orderSearchQuery.trim()) {
        const q = orderSearchQuery.toLowerCase().trim();
        const idMatch = String(o.id || '').toLowerCase().includes(q);
        const titleMatch = String(o.title || '').toLowerCase().includes(q);
        const clientMatch = String(o.client_name || '').toLowerCase().includes(q);
        const serverMatch = String(o.assigned_server_name || '').toLowerCase().includes(q);
        const caseMatch = String(o.caseNumber || o.intakeJson?.caseNumber || '').toLowerCase().includes(q);
        const statusMatch = String(o.status || '').toLowerCase().includes(q);
        if (!idMatch && !titleMatch && !clientMatch && !serverMatch && !caseMatch && !statusMatch) {
          return false;
        }
      }

      return true;
    });

    // 2. Sort
    list = [...list].sort((a, b) => {
      let comparison = 0;
      switch (orderSortField) {
        case 'id': {
          const numA = Number(a.id) || 0;
          const numB = Number(b.id) || 0;
          comparison = numA - numB;
          break;
        }
        case 'title': {
          const strA = (a.title || '').toLowerCase();
          const strB = (b.title || '').toLowerCase();
          comparison = strA.localeCompare(strB);
          break;
        }
        case 'date_added': {
          const rawA = a.created_at || a.dateAdded || a.date_added || a.createdAt;
          const rawB = b.created_at || b.dateAdded || b.date_added || b.createdAt;
          const timeA = rawA ? new Date(rawA).getTime() : 0;
          const timeB = rawB ? new Date(rawB).getTime() : 0;
          comparison = (isNaN(timeA) ? 0 : timeA) - (isNaN(timeB) ? 0 : timeB);
          break;
        }
        case 'status': {
          const statusPriority: Record<string, number> = {
            new: 1,
            assigned: 2,
            in_progress: 3,
            attempted: 4,
            affidavit_ready: 5,
            completed: 6,
            served: 7
          };
          const pA = statusPriority[String(a.status).toLowerCase()] || 99;
          const pB = statusPriority[String(b.status).toLowerCase()] || 99;
          if (pA !== pB) {
            comparison = pA - pB;
          } else {
            comparison = String(a.status || '').localeCompare(String(b.status || ''));
          }
          break;
        }
        case 'client': {
          const strA = (a.client_name || '').toLowerCase();
          const strB = (b.client_name || '').toLowerCase();
          comparison = strA.localeCompare(strB);
          break;
        }
        case 'server': {
          const strA = (a.assigned_server_name || 'zzz').toLowerCase();
          const strB = (b.assigned_server_name || 'zzz').toLowerCase();
          comparison = strA.localeCompare(strB);
          break;
        }
        case 'deadline': {
          const timeA = a.deadline ? new Date(a.deadline).getTime() : null;
          const timeB = b.deadline ? new Date(b.deadline).getTime() : null;
          if (timeA === null && timeB === null) {
            comparison = 0;
          } else if (timeA === null) {
            comparison = 1;
          } else if (timeB === null) {
            comparison = -1;
          } else {
            comparison = timeA - timeB;
          }
          break;
        }
        default:
          comparison = 0;
      }

      return orderSortDirection === 'asc' ? comparison : -comparison;
    });

    return list;
  }, [orders, orderSortField, orderSortDirection, orderSearchQuery, orderStatusFilter]);

  // Render Sortable Orders Table
  const renderOrdersTable = (
    showActions = false,
    showAffidavit = false,
    showInvoice = false,
    customOrders?: any[]
  ) => {
    const listToRender = customOrders !== undefined ? customOrders : sortedAndFilteredOrders;
    const hasActions = showActions || showAffidavit || showInvoice;

    const renderSortHeader = (label: string, field: OrderSortField, minWidthClass = '') => {
      const isActive = orderSortField === field;
      const isAsc = orderSortDirection === 'asc';

      return (
        <th
          key={field}
          className={`sortable-th ${isActive ? 'sortable-th--active' : ''} ${minWidthClass}`}
          onClick={() => handleToggleSort(field)}
          role="columnheader"
          aria-sort={isActive ? (isAsc ? 'ascending' : 'descending') : 'none'}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleToggleSort(field);
            }
          }}
          title={`Click to sort by ${label} (${
            isActive
              ? isAsc
                ? 'Ascending — click to sort Descending'
                : 'Descending — click to sort Ascending'
              : 'Click to sort'
          })`}
        >
          <div className="sort-header-cell">
            <span>{label}</span>
            <span
              className={`sort-icon-wrap ${
                isActive ? 'text-blue-600 font-extrabold' : 'text-slate-400 opacity-60'
              }`}
            >
              {isActive ? (
                isAsc ? (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                )
              ) : (
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
              )}
            </span>
          </div>
        </th>
      );
    };

    return (
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {renderSortHeader('ID', 'id', 'w-16')}
              {renderSortHeader('Order', 'title', 'min-w-[170px]')}
              {renderSortHeader('Date Added', 'date_added', 'min-w-[125px]')}
              {renderSortHeader('Status', 'status', 'min-w-[120px]')}
              {renderSortHeader('Client', 'client', 'min-w-[160px]')}
              {renderSortHeader('Server', 'server', 'min-w-[140px]')}
              {renderSortHeader('Deadline', 'deadline', 'min-w-[150px]')}
              {hasActions && <th className="text-right min-w-[140px]">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {listToRender.length === 0 ? (
              <tr>
                <td colSpan={hasActions ? 8 : 7} className="empty-cell">
                  <div className="empty-state">
                    <strong>
                      {orders.length === 0
                        ? 'No service orders yet'
                        : 'No orders match current filter'}
                    </strong>
                    <span className="empty-copy">
                      {orders.length === 0
                        ? 'Intake a job to start dispatch and field tracking.'
                        : 'Try adjusting your search query or status filter.'}
                    </span>
                    {orders.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setOrderSearchQuery('');
                          setOrderStatusFilter('all');
                        }}
                        className="mt-2 text-xs font-semibold text-blue-600 hover:underline"
                      >
                        Reset filters
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              listToRender.map((o) => {
                const deadlineInfo = formatDeadlineDisplay(o.deadline);
                const dateAddedStr = formatDateDisplay(
                  o.created_at || o.dateAdded || o.date_added || o.createdAt
                );

                return (
                  <tr key={o.id}>
                    <td className="font-mono text-xs font-semibold text-slate-700">#{o.id}</td>
                    <td className="font-medium text-slate-900">{o.title}</td>
                    <td className="text-slate-600 whitespace-nowrap text-xs">{dateAddedStr}</td>
                    <td>
                      <span className={`status-pill status-${o.status}`}>
                        {String(o.status).replace('_', ' ')}
                      </span>
                    </td>
                    <td className="text-slate-700 text-xs">{o.client_name}</td>
                    <td className="text-slate-700 text-xs">
                      {o.assigned_server_name || <span className="text-slate-400 italic">Unassigned</span>}
                    </td>
                    <td className="whitespace-nowrap text-xs">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-slate-700">{deadlineInfo.text}</span>
                        {deadlineInfo.badge && (
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded border ${deadlineInfo.badge.color}`}
                          >
                            {deadlineInfo.badge.label}
                          </span>
                        )}
                      </div>
                    </td>
                    {hasActions && (
                      <td className="row-actions flex flex-wrap gap-1.5 items-center justify-end">
                        {showAffidavit && (
                          <button type="button" onClick={() => handleDraftAffidavit(o.id)}>
                            Draft affidavit
                          </button>
                        )}
                        {showInvoice && (
                          <>
                            <button type="button" onClick={() => handleInvoiceStub(o.id)}>
                              Invoice stub
                            </button>
                            <button
                              type="button"
                              className="bg-sky-600 hover:bg-sky-500 text-white font-medium"
                              onClick={() => handleOpenFullInvoice(o)}
                            >
                              View Invoice
                            </button>
                            <button
                              type="button"
                              id={`btn-email-invoice-${o.id}`}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition cursor-pointer shadow-2xs"
                              onClick={() => handleEmailInvoiceToClient(o)}
                              disabled={emailingInvoiceOrderId === o.id}
                              title={`Automatically email invoice with PDF attached to ${extractClientEmail(o)}`}
                            >
                              {emailingInvoiceOrderId === o.id ? (
                                <>
                                  <svg className="animate-spin w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                                  </svg>
                                  <span>Sending...</span>
                                </>
                              ) : (
                                <>
                                  <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                    <polyline points="22,6 12,13 2,6"></polyline>
                                  </svg>
                                  <span>Email to Client</span>
                                </>
                              )}
                            </button>
                          </>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    );
  };

  // 1. Home View (kt)
  const renderHomeView = () => {
    return (
      <div className="home-overview">
        {/* Hero Panel */}
        <section className="panel glow-panel home-hero-panel">
          <div className="home-hero-panel__copy">
            <p className="eyebrow">Process Servers Solution</p>
            <h2>Online process server software to streamline your business</h2>
            <p>
              Track orders in real time, push field updates with photo and document uploads, generate affidavits with eSignature, and auto-invoice when jobs close — all from one web portal.
            </p>
            <div className="proof-row">
              <span>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M9.2 16.6 4.8 12.2l1.4-1.4 3 3 8-8 1.4 1.4z" />
                </svg>
                Order tracking &amp; notifications
              </span>
              <span>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M9.2 16.6 4.8 12.2l1.4-1.4 3 3 8-8 1.4 1.4z" />
                </svg>
                Mobile field updates
              </span>
              <span>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M9.2 16.6 4.8 12.2l1.4-1.4 3 3 8-8 1.4 1.4z" />
                </svg>
                Affidavits · Billing · CRM
              </span>
            </div>
          </div>
          <div className="home-hero-panel__stats">
            <div>
              <b>{stats.all}</b>
              <small>Active orders</small>
            </div>
            <div>
              <b>{stats.inProgress}</b>
              <small>In progress</small>
            </div>
            <div>
              <b>{stats.completed}</b>
              <small>Completed</small>
            </div>
            <div>
              <b>{stats.unreadAlerts}</b>
              <small>Unread alerts</small>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="feature-grid home-feature-grid">
          {[
            {
              title: 'Real-time server updates',
              body: 'Field agents update status and attach photos or documents from mobile.'
            },
            {
              title: 'Affidavit templates',
              body: 'Affidavit of Service, Service Attempts, Affidavit in Support — Word/PDF + eSignature.'
            },
            {
              title: 'Online billing',
              body: 'Auto-invoice on close, PDF statements, CSV/Excel for accounting import.'
            },
            {
              title: 'Configuration panel',
              body: 'Roles, custom fields, one-click status updates, and email templates.'
            },
            {
              title: 'Multi-department orders',
              body: 'Centralize process service, courier, research, and retrieval in one portal.'
            },
            {
              title: 'Order history',
              body: 'Full timeline of attempts, notices, and documents for every job.'
            }
          ].map((f) => (
            <article key={f.title} className="feature-card">
              <span className="feature-card__icon">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </span>
              <h3>{f.title}</h3>
              <p>{f.body}</p>
            </article>
          ))}
        </section>

        {/* Jump Into Operations */}
        <section className="panel">
          <div className="section-head">
            <h2>Jump into operations</h2>
            <p className="muted">Open Dashboard for KPIs, or jump straight to orders and field work.</p>
          </div>
          <div className="action-row">
            <button type="button" className="primary" onClick={() => setActiveTab('dashboard')}>
              Open Dashboard →
            </button>
            <button type="button" onClick={() => setActiveTab('orders')}>
              Orders
            </button>
            <button type="button" onClick={() => setActiveTab('field')}>
              Field
            </button>
            <button type="button" onClick={() => setActiveTab('affidavits')}>
              Affidavits
            </button>
            <button type="button" onClick={() => setActiveTab('billing')}>
              Billing
            </button>
          </div>
        </section>
      </div>
    );
  };

  // 2. Dashboard View (bt)
  const renderDashboardView = () => {
    return (
      <div className="tab-panel">
        <header className="panel-header">
          <div>
            <h2>Dashboard</h2>
            <p className="muted">Operational pulse for {currentUser?.agency || 'Civil Process Agency'}</p>
          </div>
        </header>

        {/* KPI Stats */}
        <section className="grid stats">
          <article className="card stat-card">
            <h4>All Orders</h4>
            <p>{stats.all}</p>
            <span className="stat-sub">Intake registered</span>
          </article>
          <article className="card stat-card">
            <h4>In Progress</h4>
            <p>{stats.inProgress}</p>
            <span className="stat-sub">Dispatch &amp; field</span>
          </article>
          <article className="card stat-card">
            <h4>Completed</h4>
            <p>{stats.completed}</p>
            <span className="stat-sub">Ready for proof</span>
          </article>
          <article className="card stat-card">
            <h4>Deadline Watch</h4>
            <p>{stats.deadlineWatch}</p>
            <span className="stat-sub">Service deadlines</span>
          </article>
        </section>

        {/* Dash Grid */}
        <section className="dash-grid">
          <article className="card">
            <h3>Deadline watch</h3>
            {upcomingDeadlines.length === 0 ? (
              <div className="empty-state">
                <strong>No deadlines queued</strong>
                <span>Deadlines appear here as soon as orders carry a service date.</span>
              </div>
            ) : (
              <ul className="deadline-list">
                {upcomingDeadlines.map((o) => (
                  <li key={o.id}>
                    <span>
                      #{o.id} · {o.title}
                    </span>
                    <time>{o.deadline}</time>
                  </li>
                ))}
              </ul>
            )}
          </article>

          <article className="card">
            <h3>Recent activity</h3>
            <ul className="activity-feed">
              {notifications.slice(0, 8).map((n) => (
                <li key={n.id}>
                  <strong>{n.channel}</strong>
                  <span>{n.message}</span>
                  <small>{n.created_at}</small>
                </li>
              ))}
              {notifications.length === 0 && (
                <li className="muted">
                  No notifications yet — client updates and field notes will land here.
                </li>
              )}
            </ul>
          </article>
        </section>
      </div>
    );
  };

  // 3. Orders View (xt)
  const renderOrdersView = () => {
    return (
      <div className="tab-panel">
        <header className="panel-header">
          <div>
            <h2>Orders</h2>
            <p className="muted">Jobs &amp; intake — create, assign, and track service orders</p>
          </div>
          {(currentUser?.role === 'agency_admin' || currentUser?.role === 'client') && (
            <button
              type="button"
              className="primary"
              onClick={() => setIsOrderModalOpen(true)}
            >
              + New Order
            </button>
          )}
        </header>

        <section className="card">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-200">
            {/* Quick status filter pills */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="font-semibold text-slate-500 uppercase tracking-wider text-[11px] mr-1">
                Filter:
              </span>
              {[
                { id: 'all', label: 'All Orders' },
                { id: 'active', label: 'Active Workload' },
                { id: 'urgent', label: 'Urgent Deadlines' },
                { id: 'new', label: 'New Intake' },
                { id: 'in_progress', label: 'In Progress' },
                { id: 'affidavit_ready', label: 'Affidavit Ready' },
                { id: 'completed', label: 'Completed' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setOrderStatusFilter(tab.id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    orderStatusFilter === tab.id
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Quick Search */}
            <div className="relative min-w-[200px] max-w-xs">
              <input
                type="text"
                placeholder="Search orders, client, server..."
                value={orderSearchQuery}
                onChange={(e) => setOrderSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <svg
                className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              {orderSearchQuery && (
                <button
                  type="button"
                  onClick={() => setOrderSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Active Sort & Workload Priority bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 py-1.5 px-3 mb-3 bg-blue-50/70 border border-blue-200/80 rounded-lg text-xs text-slate-700">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-blue-950">Sorted By:</span>
              <span className="bg-white px-2 py-0.5 rounded border border-blue-200 text-blue-900 font-semibold inline-flex items-center gap-1.5 shadow-2xs">
                {orderSortField === 'date_added' && 'Date Added'}
                {orderSortField === 'deadline' && 'Deadline'}
                {orderSortField === 'status' && 'Status'}
                {orderSortField === 'id' && 'Order ID'}
                {orderSortField === 'title' && 'Order Title'}
                {orderSortField === 'client' && 'Client'}
                {orderSortField === 'server' && 'Process Server'}
                <span className="text-[11px] text-blue-600 font-bold uppercase">
                  ({orderSortDirection === 'asc' ? 'Ascending ▲' : 'Descending ▼'})
                </span>
              </span>
              <span className="text-slate-400 text-xs hidden sm:inline">•</span>
              <span className="text-slate-500 text-[11px] hidden sm:inline">
                Click any table column header to reverse or switch sorting
              </span>
            </div>

            {/* Quick Workload presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-slate-500 font-semibold uppercase">Quick Sort:</span>
              <button
                type="button"
                onClick={() => {
                  setOrderSortField('deadline');
                  setOrderSortDirection('asc');
                }}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition cursor-pointer ${
                  orderSortField === 'deadline' && orderSortDirection === 'asc'
                    ? 'bg-blue-600 text-white border-blue-700'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
                title="Sort by nearest deadline first"
              >
                ⏰ Urgent Deadline
              </button>
              <button
                type="button"
                onClick={() => {
                  setOrderSortField('date_added');
                  setOrderSortDirection('desc');
                }}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition cursor-pointer ${
                  orderSortField === 'date_added' && orderSortDirection === 'desc'
                    ? 'bg-blue-600 text-white border-blue-700'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
                title="Sort by newest added orders first"
              >
                🕒 Date Added (Newest)
              </button>
              <button
                type="button"
                onClick={() => {
                  setOrderSortField('status');
                  setOrderSortDirection('asc');
                }}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition cursor-pointer ${
                  orderSortField === 'status'
                    ? 'bg-blue-600 text-white border-blue-700'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
                title="Sort by status workflow priority"
              >
                ⚡ By Status
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between mb-2">
            <h3>Service orders</h3>
            <span className="text-xs text-slate-500 font-medium">
              Showing {sortedAndFilteredOrders.length} of {orders.length} order{orders.length === 1 ? '' : 's'}
            </span>
          </div>
          {renderOrdersTable(true, true, true)}
        </section>

        {currentUser?.role === 'agency_admin' && (
          <section className="grid split" style={{ marginTop: 16 }}>
            {/* Assign Server */}
            <article className="card">
              <h3>Assign process server</h3>
              <form onSubmit={handleAssignServer} className="stacked">
                <label>
                  Order
                  <select
                    value={assignState.orderId}
                    onChange={(e) => setAssignState((s) => ({ ...s, orderId: e.target.value }))}
                    required
                  >
                    <option value="">Select order</option>
                    {orders.map((o) => (
                      <option key={o.id} value={o.id}>
                        #{o.id} — {o.title}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Process server
                  <select
                    value={assignState.serverId}
                    onChange={(e) => setAssignState((s) => ({ ...s, serverId: e.target.value }))}
                    required
                  >
                    <option value="">Select process server</option>
                    {serversList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.full_name} ({s.agency || 'Server'})
                      </option>
                    ))}
                  </select>
                </label>
                <button className="primary" type="submit">
                  Assign server
                </button>
              </form>
            </article>

            {/* Update Status */}
            <article className="card">
              <h3>Update order status</h3>
              <form onSubmit={handleUpdateStatus} className="stacked">
                <label>
                  Order
                  <select
                    value={orderStatusState.orderId}
                    onChange={(e) => setOrderStatusState((s) => ({ ...s, orderId: e.target.value }))}
                    required
                  >
                    <option value="">Select order</option>
                    {orders.map((o) => (
                      <option key={o.id} value={o.id}>
                        #{o.id} — {o.title}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Status
                  <select
                    value={orderStatusState.status}
                    onChange={(e) => setOrderStatusState((s) => ({ ...s, status: e.target.value }))}
                  >
                    {['new', 'assigned', 'in_progress', 'completed', 'affidavit_ready', 'attempted'].map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </label>
                <button className="primary" type="submit">
                  Update status
                </button>
              </form>
            </article>
          </section>
        )}
      </div>
    );
  };

  // 4. Field View (St)
  const renderFieldView = () => {
    const attemptLabels = ['1st attempt', '2nd attempt', '3rd attempt'];
    return (
      <div className="tab-panel">
        <header className="panel-header">
          <div>
            <h2>Field</h2>
            <p className="muted">Field attempts &amp; evidence — date, time, notes, physical description</p>
          </div>
        </header>

        <section className="card">
          <label>
            Select service order
            <select
              value={selectedFieldOrderId}
              onChange={(e) => setSelectedFieldOrderId(e.target.value)}
              required
            >
              <option value="">Select order</option>
              {orders.map((o) => (
                <option key={o.id} value={o.id}>
                  #{o.id} — {o.title} ({o.status})
                </option>
              ))}
            </select>
          </label>
        </section>

        <section className="grid attempt-slots">
          {[0, 1, 2].map((slotIdx) => {
            const slot = fieldAttempts[slotIdx];
            return (
              <article key={slotIdx} className="card attempt-slot">
                <div className="attempt-slot-head">
                  <h3>{attemptLabels[slotIdx]}</h3>
                  <span
                    className={`status-pill status-${
                      slot.outcome === 'served' ? 'completed' : slot.outcome === 'attempted' ? 'attempted' : 'pending'
                    }`}
                  >
                    {slot.outcome}
                  </span>
                </div>

                <div className="grid two-up">
                  <label>
                    Date
                    <input
                      type="date"
                      value={slot.date}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFieldAttempts((prev) => {
                          const c = [...prev];
                          c[slotIdx] = { ...c[slotIdx], date: val };
                          return c;
                        });
                      }}
                    />
                  </label>
                  <label>
                    Time
                    <input
                      type="time"
                      value={slot.time}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFieldAttempts((prev) => {
                          const c = [...prev];
                          c[slotIdx] = { ...c[slotIdx], time: val };
                          return c;
                        });
                      }}
                    />
                  </label>
                </div>

                <label>
                  Notes
                  <textarea
                    placeholder="What happened on this attempt?"
                    value={slot.notes}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFieldAttempts((prev) => {
                        const c = [...prev];
                        c[slotIdx] = { ...c[slotIdx], notes: val };
                        return c;
                      });
                    }}
                  />
                </label>

                <label>
                  Outcome
                  <select
                    value={slot.outcome === 'pending' ? 'attempted' : slot.outcome}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      setFieldAttempts((prev) => {
                        const c = [...prev];
                        c[slotIdx] = { ...c[slotIdx], outcome: val };
                        return c;
                      });
                    }}
                  >
                    <option value="attempted">Attempted / not served</option>
                    <option value="served">Successfully served</option>
                  </select>
                </label>

                <label>
                  Physical description (required if served)
                  <input
                    placeholder="Person served / description"
                    value={slot.physicalDescription}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFieldAttempts((prev) => {
                        const c = [...prev];
                        c[slotIdx] = { ...c[slotIdx], physicalDescription: val };
                        return c;
                      });
                    }}
                  />
                </label>

                <div className="grid two-up">
                  <label>
                    GPS lat
                    <input
                      placeholder="Latitude"
                      value={slot.gpsLat}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFieldAttempts((prev) => {
                          const c = [...prev];
                          c[slotIdx] = { ...c[slotIdx], gpsLat: val };
                          return c;
                        });
                      }}
                    />
                  </label>
                  <label>
                    GPS lng
                    <input
                      placeholder="Longitude"
                      value={slot.gpsLng}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFieldAttempts((prev) => {
                          const c = [...prev];
                          c[slotIdx] = { ...c[slotIdx], gpsLng: val };
                          return c;
                        });
                      }}
                    />
                  </label>
                </div>

                <label>
                  Evidence URL
                  <input
                    placeholder="Photo or document link"
                    value={slot.evidenceUrl}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFieldAttempts((prev) => {
                        const c = [...prev];
                        c[slotIdx] = { ...c[slotIdx], evidenceUrl: val };
                        return c;
                      });
                    }}
                  />
                </label>

                <button
                  className="primary"
                  type="button"
                  onClick={() => handleLogAttempt(slotIdx)}
                >
                  Log {attemptLabels[slotIdx]}
                </button>
              </article>
            );
          })}
        </section>
      </div>
    );
  };

  // 5. Clients View (Ct)
  const renderClientsView = () => {
    if (currentUser?.role === 'client') {
      return (
        <div className="tab-panel">
          <header className="panel-header">
            <div>
              <h2>Client portal</h2>
              <p className="muted">Your service orders and live status</p>
            </div>
          </header>
          <section className="card">{renderOrdersTable()}</section>
        </div>
      );
    }
    return (
      <div className="tab-panel">
        <header className="panel-header">
          <div>
            <h2>Clients</h2>
            <p className="muted">Client CRM — law firms and accounts</p>
          </div>
        </header>
        <section className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Agency</th>
                  <th>Email</th>
                </tr>
              </thead>
              <tbody>
                {clientsList.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="empty-cell">
                      <div className="empty-state">
                        <strong>No clients found</strong>
                        <span>Client accounts appear here after signup or invite.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  clientsList.map((c) => (
                    <tr key={c.id}>
                      <td>#{c.id}</td>
                      <td>{c.full_name}</td>
                      <td>{c.agency}</td>
                      <td>{c.email}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    );
  };

  // 6. Users View (Dt - admin only)
  const renderUsersView = () => {
    const fFirst = activeUserFilter.firstName.trim().toLowerCase();
    const fLast = activeUserFilter.lastName.trim().toLowerCase();

    const filteredUsers = usersList.filter((u) => {
      const uFirst = (u.first_name || u.full_name?.split(/\s+/)[0] || '').toLowerCase();
      const uLast = (u.last_name || u.full_name?.split(/\s+/).slice(1).join(' ') || '').toLowerCase();
      if (fFirst && !uFirst.includes(fFirst)) return false;
      if (fLast && !uLast.includes(fLast)) return false;
      return true;
    });

    const handleSelectUserForEdit = (user: any) => {
      setEditingUserId(user.id);
      setEditingUserValues({
        ...createDefaultAccountValues(),
        ...user,
        role: user.role || 'process_server',
        agency: user.agency || '',
        active: user.active !== 0
      });
      setUsersSubtab('edit');
    };

    const handleUpdateUserSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingUserId) return;
      try {
        const res = await fetch(`/api/users/${editingUserId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editingUserValues)
        });
        if (!res.ok) throw new Error('Failed to update user');
        showFlash('User updated.');
        setUsersSubtab('current');
        fetchData();
      } catch (err: any) {
        showFlash(err.message, true);
      }
    };

    const handleCreateUserSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newUserValues)
        });
        if (!res.ok) throw new Error('Failed to create user');
        showFlash('User created.');
        setUsersSubtab('current');
        setNewUserValues(createDefaultAccountValues({ role: 'process_server', isProcessServer: 'Yes' }));
        fetchData();
      } catch (err: any) {
        showFlash(err.message, true);
      }
    };

    return (
      <div className="tab-panel">
        <header className="panel-header">
          <div>
            <h2>Users</h2>
            <p className="muted">Search, view, and manage user accounts</p>
          </div>
        </header>

        {/* Search Users Card */}
        <section className="card users-search-card">
          <h3>Search Users</h3>
          <div className="users-search-row">
            <label>
              First Name
              <input
                value={userSearch.firstName}
                onChange={(e) => setUserSearch((s) => ({ ...s, firstName: e.target.value }))}
              />
            </label>
            <label>
              Last Name
              <input
                value={userSearch.lastName}
                onChange={(e) => setUserSearch((s) => ({ ...s, lastName: e.target.value }))}
              />
            </label>
            <div className="users-search-actions">
              <button
                type="button"
                className="primary"
                onClick={() => setActiveUserFilter({ ...userSearch })}
              >
                Search
              </button>
              <button
                type="button"
                onClick={() => {
                  setUserSearch({ firstName: '', lastName: '' });
                  setActiveUserFilter({ firstName: '', lastName: '' });
                }}
              >
                Clear Search
              </button>
            </div>
          </div>
        </section>

        {/* Subtabs */}
        <div className="users-subtabs" role="tablist">
          <button
            type="button"
            className={usersSubtab === 'current' ? 'active' : ''}
            onClick={() => setUsersSubtab('current')}
          >
            Current Users
          </button>
          <button
            type="button"
            className={usersSubtab === 'edit' ? 'active' : ''}
            onClick={() => setUsersSubtab('edit')}
          >
            Edit User
          </button>
          <button
            type="button"
            className={usersSubtab === 'add' ? 'active' : ''}
            onClick={() => {
              setNewUserValues(createDefaultAccountValues({ role: 'process_server', isProcessServer: 'Yes' }));
              setUsersSubtab('add');
            }}
          >
            Add New User
          </button>
        </div>

        {usersSubtab === 'current' && (
          <section className="card">
            <div className="table-wrap">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>View</th>
                    <th>User Name</th>
                    <th>First Name</th>
                    <th>Last Name</th>
                    <th>Phone Number</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Customer Name</th>
                    <th>Active</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="empty-cell">
                        <div className="empty-state">
                          <strong>No users found</strong>
                          <span>Try clearing search or add a new user.</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const f = u.first_name || u.full_name?.split(/\s+/)[0] || '—';
                      const l = u.last_name || u.full_name?.split(/\s+/).slice(1).join(' ') || '—';
                      return (
                        <tr key={u.id}>
                          <td>
                            <button
                              type="button"
                              className="view-btn"
                              onClick={() => handleSelectUserForEdit(u)}
                            >
                              View
                            </button>
                          </td>
                          <td>{u.username || '—'}</td>
                          <td>{f}</td>
                          <td>{l}</td>
                          <td>{u.phone || '—'}</td>
                          <td>{u.email}</td>
                          <td>{getRoleLabel(u.role)}</td>
                          <td>{u.customer_name || (u.role === 'client' ? u.agency : '') || '—'}</td>
                          <td>{u.active === 0 || u.active === false ? 'False' : 'True'}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {usersSubtab === 'edit' && (
          <section className="card account-card">
            {editingUserId == null ? (
              <div className="empty-state">
                <strong>No user selected</strong>
                <span>Click View on a user in Current Users to edit their account.</span>
              </div>
            ) : (
              <AccountSetupForm
                value={editingUserValues}
                onChange={setEditingUserValues}
                mode="edit"
                submitLabel="Update User"
                onSubmit={handleUpdateUserSubmit}
                onCancel={() => setUsersSubtab('current')}
                showActive={true}
                showCustomerName={true}
              />
            )}
          </section>
        )}

        {usersSubtab === 'add' && (
          <section className="card account-card">
            <AccountSetupForm
              value={newUserValues}
              onChange={setNewUserValues}
              mode="create"
              submitLabel="Create Account"
              onSubmit={handleCreateUserSubmit}
              onCancel={() => setUsersSubtab('current')}
              showPassword={true}
              showActive={true}
              showCustomerName={true}
            />
          </section>
        )}
      </div>
    );
  };

  // 7. Affidavits View (wt)
  const renderAffidavitsView = () => {
    return (
      <div className="tab-panel">
        <header className="panel-header">
          <div>
            <h2>Affidavits / Proof</h2>
            <p className="muted">Compliance &amp; proof — draft from logged attempts</p>
          </div>
        </header>
        <section className="card">{renderOrdersTable(false, true, false)}</section>
      </div>
    );
  };

  // 8. Billing View (Tt)
  const renderBillingView = () => {
    return (
      <div className="tab-panel">
        <header className="panel-header">
          <div>
            <h2>Billing</h2>
            <p className="muted">Agency billing — invoice stubs &amp; full Stripe invoices for completed work</p>
          </div>
        </header>

        {/* User Request #2 Notice */}
        <div className="p-3 bg-sky-50 border border-sky-200 rounded-lg text-xs text-sky-900 mb-4 flex items-center justify-between shadow-xs">
          <span>
            <strong>Dynamic Invoice Title:</strong> Each user's invoices feature their company name:{' '}
            <code className="px-1.5 py-0.5 bg-white border border-sky-300 rounded font-bold text-sky-900">
              {currentUser?.agency || 'Civil Process Agency'}
            </code>
          </span>
          <button
            type="button"
            className="text-sky-700 hover:text-sky-900 font-semibold underline text-xs"
            onClick={() => setActiveTab('settings')}
          >
            Change in Settings →
          </button>
        </div>

        {/* Automated Email Notifications Feature Banner */}
        <div className="p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl text-xs text-emerald-950 mb-4 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
            </div>
            <div>
              <div className="font-bold text-emerald-900">
                Automated Client Invoice Emailing
              </div>
              <p className="text-[11px] text-emerald-700">
                Click <strong>Email to Client</strong> on any order below to automatically trigger an email notification to clients with their invoice attached, pulling their contact email directly from the order intake details.
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider border border-emerald-300 shrink-0">
            Auto-Pull Email Active
          </span>
        </div>

        <section className="card">{renderOrdersTable(false, false, true)}</section>
      </div>
    );
  };

  // 9. Settings View (Et)
  const renderSettingsView = () => {
    return (
      <div className="tab-panel">
        <header className="panel-header">
          <div>
            <h2>Settings</h2>
            <p className="muted">Account and notification preferences</p>
          </div>
        </header>
        <section className="card account-card">
          <AccountSetupForm
            value={settingsValues}
            onChange={setSettingsValues}
            mode="edit"
            submitLabel="Update User"
            onSubmit={handleUpdateSettings}
            showActive={true}
            showCustomerName={true}
          />
          <div className="action-row" style={{ marginTop: 16 }}>
            <button
              type="button"
              className="primary"
              onClick={() => showFlash('Push notifications enabled for this session.')}
            >
              Enable push notifications
            </button>
            <button type="button" onClick={handleSignOut}>
              Sign out
            </button>
          </div>
        </section>
      </div>
    );
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case 'home':
        return renderHomeView();
      case 'dashboard':
        return renderDashboardView();
      case 'orders':
        return renderOrdersView();
      case 'field':
        return renderFieldView();
      case 'clients':
        return renderClientsView();
      case 'users':
        return renderUsersView();
      case 'affidavits':
        return renderAffidavitsView();
      case 'billing':
        return renderBillingView();
      case 'settings':
        return renderSettingsView();
      default:
        return renderHomeView();
    }
  };

  const navItems = currentUser ? getNavItemsForRole(currentUser.role) : [];

  return (
    <>
      {/* If not logged in, render the exact marketing website! */}
      {!currentUser ? (
        <MarketingPage
          onOpenAuth={(mode) => setAuthOverlayMode(mode)}
          onSelectPackage={(pkgId) => setAuthPackageId(pkgId)}
        />
      ) : (
        /* Authenticated Workspace App Shell */
        <div className="app-shell">
          {/* Mobile sidebar backdrop */}
          <div
            className={`sidebar-backdrop ${mobileSidebarOpen ? 'open' : ''}`}
            onClick={() => setMobileSidebarOpen(false)}
          />

          {/* Sidebar */}
          <aside className={`sidebar ${mobileSidebarOpen ? 'open' : ''}`}>
            <div className="sidebar__top">
              <BrandLogo onClick={() => setActiveTab('home')} />
              <button
                type="button"
                className="sidebar-close"
                aria-label="Close menu"
                onClick={() => setMobileSidebarOpen(false)}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </div>

            <nav aria-label="Primary navigation">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={activeTab === item.id ? 'active' : ''}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileSidebarOpen(false);
                  }}
                >
                  <span className="w-4 h-4 flex items-center justify-center font-bold text-xs">
                    {item.label[0]}
                  </span>
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>

            <div className="availability">
              <div>
                <span className="live-dot" /> Workspace status
              </div>
              <strong>Online · Accepting jobs</strong>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('settings');
                  setMobileSidebarOpen(false);
                }}
              >
                Configure workspace
              </button>
            </div>

            <div className="sidebar__identity">
              <div className="avatar">{getInitials(currentUser.full_name)}</div>
              <span>
                <b>{currentUser.full_name}</b>
                <small>{currentUser.agency}</small>
              </span>
            </div>
          </aside>

          {/* Main Column */}
          <div className="app-column">
            <header className="topbar">
              <div className="topbar__left">
                <button
                  type="button"
                  className="mobile-menu"
                  aria-label="Open menu"
                  onClick={() => setMobileSidebarOpen(true)}
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 12h18M3 6h18M3 18h18" />
                  </svg>
                </button>
                <div className="page-title-block">
                  <h1>{viewInfo.title}</h1>
                  <p>{viewInfo.subtitle}</p>
                </div>
              </div>

              <div className="topbar__right">
                <button
                  type="button"
                  className="ghost-btn text-xs text-sky-700 border border-slate-300 hover:border-sky-600 bg-white hover:bg-sky-50 font-semibold"
                  onClick={() => {
                    setCurrentUser(null);
                    localStorage.removeItem('pss_user');
                  }}
                  title="View public website"
                >
                  Public Site
                </button>
                <span className="role-badge">{getRoleLabel(currentUser.role)}</span>
                <button type="button" className="ghost-btn" onClick={handleSignOut}>
                  Sign out
                </button>
              </div>
            </header>

            <main className="main-view">{renderActiveView()}</main>
          </div>
        </div>
      )}

      {/* Authentication Modal / Overlay */}
      {authOverlayMode && (
        <AuthOverlay
          initialMode={authOverlayMode}
          initialPackageId={authPackageId}
          onClose={() => setAuthOverlayMode(null)}
          onSignInSuccess={(user) => {
            setCurrentUser(user);
            localStorage.setItem('pss_user', JSON.stringify(user));
            setSettingsValues({ ...user });
            setAuthOverlayMode(null);
            setActiveTab('home');
          }}
          onSignUpSuccess={(user) => {
            setCurrentUser(user);
            localStorage.setItem('pss_user', JSON.stringify(user));
            setSettingsValues({ ...user });
            setAuthOverlayMode(null);
            setActiveTab('home');
          }}
          onFlash={showFlash}
        />
      )}

      {/* New Order Modal */}
      {isOrderModalOpen && currentUser && (
        <OrderIntakeModal
          open={isOrderModalOpen}
          role={currentUser.role}
          clients={clientsList}
          servers={serversList}
          users={usersList}
          orders={orders}
          onClose={() => setIsOrderModalOpen(false)}
          onSubmit={handleCreateOrder}
          onFlash={showFlash}
        />
      )}

      {/* Affidavit Draft Modal */}
      {selectedAffidavitOrder && (
        <AffidavitModal
          order={selectedAffidavitOrder}
          user={currentUser}
          affidavitText={affidavitDraftText}
          onClose={() => {
            setSelectedAffidavitOrder(null);
            setAffidavitDraftText('');
          }}
          onFlash={showFlash}
        />
      )}

      {/* Full Invoice Modal (Dynamic Company Name from user sign up) */}
      {selectedInvoiceOrder && (
        <InvoiceModal
          order={selectedInvoiceOrder}
          currentUser={currentUser}
          isOpen={true}
          onClose={() => setSelectedInvoiceOrder(null)}
          onUpdateOrderStatus={(ordId, status) => {
            setOrders((prev) =>
              prev.map((o) => (String(o.id) === ordId ? { ...o, serviceInvoiceStatus: status } : o))
            );
            showFlash(`Invoice status updated to ${status}.`);
          }}
        />
      )}

      {/* Client Invoice Email Sent Success Modal */}
      {emailInvoiceSuccessModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
          aria-label="Invoice Email Notification Sent"
        >
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/30 shadow-inner">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-white leading-tight">
                  Invoice Email Dispatched to Client
                </h3>
                <p className="text-xs text-emerald-100 mt-0.5">
                  Automated notification sent with official invoice attached
                </p>
              </div>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-700">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Recipient Client:</span>
                  <span className="font-bold text-slate-900">{emailInvoiceSuccessModal.recipientName}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Contact Email:</span>
                  <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {emailInvoiceSuccessModal.recipientEmail}
                  </span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Invoice Number:</span>
                  <span className="font-mono font-bold text-slate-900">#{emailInvoiceSuccessModal.invoiceNumber}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Total Amount:</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">${emailInvoiceSuccessModal.amount.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Attached File:</span>
                  <span className="font-mono text-[11px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 flex items-center gap-1 font-semibold">
                    <svg className="w-3.5 h-3.5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                    </svg>
                    {emailInvoiceSuccessModal.attachedPdfName}
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 leading-relaxed bg-emerald-50/60 p-3 rounded-xl border border-emerald-100 flex items-start gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span>
                  The invoice status for this order has been updated to <strong>Sent–Pending</strong>, and the legal dispatch alert has been recorded in your Dispatch Alerts log.
                </span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-800 transition cursor-pointer"
                onClick={() => setEmailInvoiceSuccessModal(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition cursor-pointer"
                onClick={() => {
                  const targetOrd = orders.find(o => String(o.id) === String(emailInvoiceSuccessModal.orderId));
                  setEmailInvoiceSuccessModal(null);
                  if (targetOrd) handleOpenFullInvoice(targetOrd);
                }}
              >
                View Full Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {flash && (
        <div className={`toast ${flash.isError ? 'error' : ''}`}>
          <span>{flash.message}</span>
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => setFlash(null)}
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
      )}
    </>
  );
};

export default App;

