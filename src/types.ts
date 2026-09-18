export type OrderStatus = 'draft' | 'assigned' | 'in_progress' | 'served' | 'non_served';

export type ServicePriority = 'routine' | 'rush' | 'same_day';

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
  caseNumber: string;
  courtName: string;
  plaintiff: string;
  defendant: string;
  hearingDate?: string;
  documentTypes: string[];
  recipientName: string;
  recipientPhone?: string;
  serviceAddress: string;
  alternateAddress?: string;
  priority: ServicePriority;
  status: OrderStatus;
  specialInstructions?: string;
  clientName: string;
  clientFirm: string;
  clientEmail: string;
  clientPhone: string;
  assignedServerName?: string;
  assignedServerPhone?: string;
  attempts: ServiceAttempt[];
  createdAt: string;
  updatedAt: string;
  deadlineDate: string;
  creatorUid?: string;
  proofOfServiceSignedAt?: string;
  proofOfServiceSigner?: string;
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

export type UserRole = 'client' | 'process_server';

export type PageTab = 'orders' | 'field' | 'affidavits' | 'analytics' | 'notifications' | 'account';
