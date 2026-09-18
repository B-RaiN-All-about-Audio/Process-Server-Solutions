import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// Users table (maps to Firebase Auth UID)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  fullName: text('full_name').notNull(),
  role: text('role').notNull(), // 'client' | 'process_server'
  organizationName: text('organization_name').notNull(),
  phone: text('phone'),
  badgeNumber: text('badge_number'),
  coverageArea: text('coverage_area'),
  subscriptionPlan: text('subscription_plan').default('professional'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Service Orders table
export const serviceOrders = pgTable('service_orders', {
  id: text('id').primaryKey(),
  creatorUid: text('creator_uid'),
  caseNumber: text('case_number').notNull(),
  courtName: text('court_name').notNull(),
  plaintiff: text('plaintiff').notNull(),
  defendant: text('defendant').notNull(),
  recipientName: text('recipient_name').notNull(),
  serviceAddress: text('service_address').notNull(),
  priority: text('priority').notNull(),
  status: text('status').notNull(),
  clientName: text('client_name').notNull(),
  clientFirm: text('client_firm').notNull(),
  clientEmail: text('client_email').notNull(),
  assignedServerName: text('assigned_server_name'),
  documentsToServe: text('documents_to_serve'), // JSON stringified array
  specialInstructions: text('special_instructions'),
  deadlineDate: text('deadline_date').notNull(),
  proofOfServiceSignedAt: text('proof_of_service_signed_at'),
  proofOfServiceSigner: text('proof_of_service_signer'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Service Attempts table
export const serviceAttempts = pgTable('service_attempts', {
  id: text('id').primaryKey(),
  orderId: text('order_id').notNull(),
  timestamp: text('timestamp').notNull(),
  outcome: text('outcome').notNull(),
  serverName: text('server_name').notNull(),
  serverBadgeId: text('server_badge_id').notNull(),
  locationAddress: text('location_address').notNull(),
  latitude: text('latitude'),
  longitude: text('longitude'),
  notes: text('notes').notNull(),
  photoUrl: text('photo_url'),
  signatureUrl: text('signature_url'),
  recipientNameServed: text('recipient_name_served'),
  relationshipToRecipient: text('relationship_to_recipient'),
  verifiedGps: text('verified_gps'),
  recipientDescription: text('recipient_description'), // JSON stringified
});

// App Notifications table
export const appNotifications = pgTable('app_notifications', {
  id: text('id').primaryKey(),
  orderId: text('order_id').notNull(),
  caseNumber: text('case_number').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  channel: text('channel').notNull(),
  priority: text('priority').notNull(),
  read: text('read').default('false'),
  timestamp: text('timestamp').notNull(),
});
