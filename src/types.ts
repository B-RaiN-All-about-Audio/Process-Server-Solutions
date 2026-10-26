export type FieldOrderStatus = 'Open' | 'In Progress' | 'Served' | 'Non-Served' | 'Closed';
export type ClosedStatus = 'N/A' | 'Served' | 'Non-Served' | 'Cancelled' | 'Expired';
export type ServiceInvoiceStatus = 'Not Sent–Not Paid' | 'Sent–Pending' | 'Paid in Full' | 'Overdue';
export type ServiceSpeedRequested = 'Standard (3–5 Days)' | 'Rush (24–48 Hours)' | 'Same Day Urgent';

export type OrderStatus = 'draft' | 'assigned' | 'in_progress' | 'served' | 'non_served' | FieldOrderStatus;

export type ServicePriority = 'routine' | 'rush' | 'same_day' | ServiceSpeedRequested;

export type AttemptOutcome = 
  | 'personal_service' 
  | 'substituted_service' 
  | 'no_answer' 
  | 'resident_not_home' 
  | 'address_vacant' 
  | 'refused_service' 
  | 'bad_address';

export interface PhysicalDescription {
  approxAge: string;
  gender: string;
  height: string;
  weight: string;
  hairColor: string;
  wearsGlasses: boolean;
  distinguishingFeatures?: string;
}

export interface ServiceAttempt {
  id: string;
  orderId: string;
  timestamp: string; // ISO string
  outcome: AttemptOutcome;
  serverName: string;
  serverBadgeId: string;
  latitude: number;
  longitude: number;
  locationAddress: string;
  recipientDescription?: PhysicalDescription;
  recipientNameServed?: string;
  relationshipToRecipient?: string;
  notes: string;
  photoUrl?: string;
  signatureUrl?: string;
  verifiedGps: boolean;
}

export interface ServiceOrder {
  id: string;

  // Exact fields from IMG_0111.png:
  entityBeingServed: string; // "Entity Being Served"
  serviceAddress: string; // "Service Address"
  dateAdded: string; // "Date Added (MM/DD/YYYY)"
  orderStatus: FieldOrderStatus | string; // "Order Status"
  dateClosed?: string; // "Date Closed (MM/DD/YYYY)"
  closedStatus: ClosedStatus | string; // "Closed Status"
  responsiblePartyClient: string; // "Responsible Party (Client)"
  responsibleParty?: string; // Optional alias for responsiblePartyClient
  serviceInvoiceStatus: ServiceInvoiceStatus | string; // "Service Invoice Status"
  dueDateRequested: string; // "Due Date Requested (MM/DD/YYYY)"
  serviceSpeedRequested: ServiceSpeedRequested | string; // "Service Speed Requested"
  plaintiffName: string; // "Plaintiff Name"
  defendantName: string; // "Defendant Name"
  commentsNotes?: string; // "Comments/Notes"

  // Legacy & Compatibility fields:
  caseNumber?: string;
  courtName?: string;
  plaintiff?: string;
  defendant?: string;
  hearingDate?: string;
  documentTypes?: string[];
  recipientName?: string;
  recipientPhone?: string;
  alternateAddress?: string;
  priority?: ServicePriority;
  status?: OrderStatus;
  specialInstructions?: string;
  clientName?: string;
  clientFirm?: string;
  clientEmail?: string;
  clientPhone?: string;
  assignedServerName?: string;
  assignedServerPhone?: string;
  attempts: ServiceAttempt[];
  createdAt: string;
  updatedAt: string;
  deadlineDate?: string;
  creatorUid?: string;
  proofOfServiceSignedAt?: string;
  proofOfServiceSigner?: string;
  invoicePaymentDetails?: {
    paidAt: string;
    paidAmount: number;
    paymentMethod: string;
    notes?: string;
  };
}

// Universal normalization helpers ensuring 100% field consistency
export function getOrderEntity(order: ServiceOrder): string {
  return order.entityBeingServed || order.recipientName || 'Unknown Subject / Entity';
}
export function getOrderAddress(order: ServiceOrder): string {
  return order.serviceAddress || 'No address specified';
}
export function getOrderDateAdded(order: ServiceOrder): string {
  if (order.dateAdded) return order.dateAdded;
  if (order.createdAt) {
    return new Date(order.createdAt).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
  }
  return '09/17/2026';
}
export function getOrderStatus(order: ServiceOrder): string {
  if (order.orderStatus) return order.orderStatus;
  if (order.status === 'served') return 'Served';
  if (order.status === 'in_progress') return 'In Progress';
  if (order.status === 'non_served') return 'Non-Served';
  return 'Open';
}
export function getOrderDateClosed(order: ServiceOrder): string {
  if (order.dateClosed) return order.dateClosed;
  if (order.status === 'served' && order.proofOfServiceSignedAt) {
    return new Date(order.proofOfServiceSignedAt).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
  }
  return 'N/A';
}
export function getOrderClosedStatus(order: ServiceOrder): string {
  if (order.closedStatus) return order.closedStatus;
  if (order.status === 'served') return 'Served';
  if (order.status === 'non_served') return 'Non-Served';
  return 'N/A';
}
export function getOrderResponsibleParty(order: ServiceOrder): string {
  return order.responsiblePartyClient || order.clientFirm || order.clientName || 'Summit Legal Group';
}
export function getOrderInvoiceStatus(order: ServiceOrder): string {
  if (order.serviceInvoiceStatus) return order.serviceInvoiceStatus;
  if (order.status === 'served') return 'Paid in Full';
  return 'Not Sent–Not Paid';
}
export function getOrderDueDate(order: ServiceOrder): string {
  if (order.dueDateRequested) return order.dueDateRequested;
  if (order.deadlineDate) {
    return new Date(order.deadlineDate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
  }
  return '09/24/2026';
}
export function getOrderSpeed(order: ServiceOrder): string {
  if (order.serviceSpeedRequested) return order.serviceSpeedRequested;
  if (order.priority === 'same_day') return 'Same Day Urgent';
  if (order.priority === 'rush') return 'Rush (24–48 Hours)';
  return 'Standard (3–5 Days)';
}
export function getOrderPlaintiff(order: ServiceOrder): string {
  return order.plaintiffName || order.plaintiff || 'Plaintiff Party';
}
export function getOrderDefendant(order: ServiceOrder): string {
  return order.defendantName || order.defendant || order.recipientName || 'Defendant Party';
}
export function getOrderComments(order: ServiceOrder): string {
  return order.commentsNotes || order.specialInstructions || 'None';
}

export function extractClientEmail(order: any): string {
  if (order.clientEmail && typeof order.clientEmail === 'string' && order.clientEmail.includes('@')) {
    return order.clientEmail;
  }
  if (order.client_email && typeof order.client_email === 'string' && order.client_email.includes('@')) {
    return order.client_email;
  }
  if (order.customerEmail && typeof order.customerEmail === 'string' && order.customerEmail.includes('@')) {
    return order.customerEmail;
  }
  if (order.customerJson) {
    try {
      const parsed = typeof order.customerJson === 'string' ? JSON.parse(order.customerJson) : order.customerJson;
      if (parsed?.contactEmail && parsed.contactEmail.includes('@')) return parsed.contactEmail;
      if (parsed?.email && parsed.email.includes('@')) return parsed.email;
    } catch {}
  }
  if (order.intakeJson) {
    try {
      const parsed = typeof order.intakeJson === 'string' ? JSON.parse(order.intakeJson) : order.intakeJson;
      if (parsed?.customer?.contactEmail && parsed.customer.contactEmail.includes('@')) return parsed.customer.contactEmail;
      if (parsed?.customer?.email && parsed.customer.email.includes('@')) return parsed.customer.email;
    } catch {}
  }
  if (order.client_name && typeof order.client_name === 'string' && order.client_name.includes('@')) {
    const match = order.client_name.match(/[\w.-]+@[\w.-]+\.\w+/);
    if (match) return match[0];
  }
  const rawClient = order.client_name || order.clientName || order.responsiblePartyClient || 'summitlegal';
  const clean = String(rawClient).toLowerCase().replace(/[^a-z0-9]/g, '');
  return `billing@${clean || 'summitlegal'}.com`;
}


export interface UserProfile {
  userId: string;
  email: string;
  fullName: string;
  role: UserRole;
  organizationName: string;
  phone?: string;
  badgeNumber?: string;
  coverageArea?: string;
  companyMotto?: string;
  billingPoBox?: string;
  billingCityStateZip?: string;
  billingPhone?: string;
  subscriptionPlan: 'starter' | 'professional' | 'enterprise';
  createdAt: string;
  updatedAt?: string;
}

export type NotificationChannel = 'push' | 'email' | 'in_app';

export interface AppNotification {
  id: string;
  orderId: string;
  caseNumber: string;
  title: string;
  message: string;
  channel: NotificationChannel;
  timestamp: string;
  read: boolean;
  priority: 'info' | 'success' | 'warning' | 'urgent';
}

export interface InvoiceLineItem {
  id: string;
  date: string;
  description: string;
  qty: number;
  price: number;
  total: number;
}

export interface ServiceInvoice {
  id: string;
  orderId: string;
  companyName: string; // Dynamically reflects user's organization name from sign-up
  companyMotto: string;
  companyAddress: {
    name: string;
    poBox: string;
    cityStateZip: string;
    returnCheckFee: string;
  };
  billingDate: string; // "MM/DD/YYYY"
  caseOrJobNumber: string;
  entityBeingServed: string;
  responsiblePartyClient: string;

  // Account Aging / Balance Summary
  startingBalance: number;
  paymentsReceived: number;
  pastDue30Days: number;
  pastDue60Days: number;
  pastDue90Days: number;
  currentCharges: number;
  balanceDue: number;

  // Line items
  items: InvoiceLineItem[];
  total: number;

  // Invoice & Payment Status
  status: ServiceInvoiceStatus | string;
  paymentMethod?: 'check' | 'stripe' | 'other';
  stripePaymentId?: string;
  paidAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export function createDefaultInvoiceFromOrder(
  order: ServiceOrder,
  currentUser?: UserProfile | null
): ServiceInvoice {
  const entity = getOrderEntity(order);
  const client = getOrderResponsibleParty(order);
  const plaintiff = getOrderPlaintiff(order);
  const defendant = getOrderDefendant(order);
  const speed = getOrderSpeed(order);
  const caseNum = order.caseNumber || `JOB-${order.id.slice(-6)}`;
  
  // Base price based on speed requested
  let basePrice = 100.00;
  if (speed === 'Same Day Urgent' || order.priority === 'same_day') {
    basePrice = 175.00;
  } else if (speed === 'Rush (24–48 Hours)' || order.priority === 'rush') {
    basePrice = 135.00;
  }

  const now = new Date();
  const todayStr = `${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}/${now.getFullYear()}`;
  const serviceDate = getOrderDateAdded(order) || todayStr;

  const lineItem: InvoiceLineItem = {
    id: `item-${Date.now()}-1`,
    date: serviceDate,
    description: `${plaintiff} vs ${defendant}`,
    qty: 1,
    price: basePrice,
    total: basePrice,
  };

  const invoiceStatus = getOrderInvoiceStatus(order);
  const isPaid = invoiceStatus === 'Paid in Full';
  const paymentsReceived = isPaid ? basePrice : 0.00;
  const balanceDue = isPaid ? 0.00 : basePrice;

  // Determine invoice title/company name:
  // Reflects the company / organization name entered during initial sign-up process
  const invoiceCompanyName = (currentUser as any)?.agency?.trim()
    || currentUser?.organizationName?.trim() 
    || 'Process Servers Solution';

  const invoiceMotto = currentUser?.companyMotto?.trim()
    || 'Professional Civil Process & Diligent Legal Service';

  const invoicePoBox = currentUser?.billingPoBox?.trim()
    || 'PO Box 12301';

  const invoiceCityStateZip = currentUser?.billingCityStateZip?.trim()
    || (currentUser?.coverageArea ? currentUser.coverageArea : 'Jacksonville, NC 28546');

  return {
    id: `INV-${order.id.slice(-6).toUpperCase()}`,
    orderId: order.id,
    companyName: invoiceCompanyName,
    companyMotto: invoiceMotto,
    companyAddress: {
      name: invoiceCompanyName,
      poBox: invoicePoBox,
      cityStateZip: invoiceCityStateZip,
      returnCheckFee: '$35.00',
    },
    billingDate: todayStr,
    caseOrJobNumber: caseNum,
    entityBeingServed: entity,
    responsiblePartyClient: client,
    startingBalance: basePrice,
    paymentsReceived,
    pastDue30Days: 0.00,
    pastDue60Days: 0.00,
    pastDue90Days: 0.00,
    currentCharges: basePrice,
    balanceDue,
    items: [lineItem],
    total: basePrice,
    status: invoiceStatus,
  };
}

export type UserRole = 'client' | 'process_server';

export type PageTab = 'orders' | 'invoices' | 'field' | 'affidavits' | 'analytics' | 'notifications' | 'account';
