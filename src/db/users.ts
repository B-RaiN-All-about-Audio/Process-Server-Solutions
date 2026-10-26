import { db } from './index.ts';
import { users, serviceOrders, serviceAttempts, appNotifications } from './schema.ts';
import { eq } from 'drizzle-orm';
import { UserProfile, ServiceOrder, ServiceAttempt, AppNotification } from '../types.ts';

export async function upsertUserInDb(profile: UserProfile) {
  try {
    const result = await db.insert(users)
      .values({
        uid: profile.userId,
        email: profile.email,
        fullName: profile.fullName,
        role: profile.role,
        organizationName: profile.organizationName,
        phone: profile.phone || null,
        badgeNumber: profile.badgeNumber || null,
        coverageArea: profile.coverageArea || null,
        subscriptionPlan: profile.subscriptionPlan || 'professional',
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email: profile.email,
          fullName: profile.fullName,
          role: profile.role,
          organizationName: profile.organizationName,
          phone: profile.phone || null,
          badgeNumber: profile.badgeNumber || null,
          coverageArea: profile.coverageArea || null,
          subscriptionPlan: profile.subscriptionPlan || 'professional',
          updatedAt: new Date(),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Failed to upsert user in Cloud SQL:', error);
    throw new Error('Database operation failed. Please try again later.');
  }
}

export async function getUserByUid(uid: string) {
  try {
    const result = await db.select().from(users).where(eq(users.uid, uid));
    return result[0] || null;
  } catch (error) {
    console.error('Failed to fetch user from Cloud SQL:', error);
    throw new Error('Database query failed. Please try again later.');
  }
}

export async function getServiceOrdersFromDb(): Promise<ServiceOrder[]> {
  try {
    const orders = await db.select().from(serviceOrders);
    const attempts = await db.select().from(serviceAttempts);

    // Group attempts by orderId
    const attemptsByOrderId: Record<string, ServiceAttempt[]> = {};
    for (const att of attempts) {
      if (!attemptsByOrderId[att.orderId]) {
        attemptsByOrderId[att.orderId] = [];
      }
      let descParsed = undefined;
      if (att.recipientDescription) {
        try {
          descParsed = JSON.parse(att.recipientDescription);
        } catch (e) {}
      }

      attemptsByOrderId[att.orderId].push({
        id: att.id,
        orderId: att.orderId,
        timestamp: att.timestamp,
        outcome: att.outcome as ServiceAttempt['outcome'],
        serverName: att.serverName,
        serverBadgeId: att.serverBadgeId,
        locationAddress: att.locationAddress,
        latitude: att.latitude ? parseFloat(att.latitude) : 34.0522,
        longitude: att.longitude ? parseFloat(att.longitude) : -118.2437,
        notes: att.notes,
        photoUrl: att.photoUrl || undefined,
        signatureUrl: att.signatureUrl || undefined,
        recipientNameServed: att.recipientNameServed || undefined,
        relationshipToRecipient: att.relationshipToRecipient || undefined,
        verifiedGps: att.verifiedGps === 'true' || att.verifiedGps === '1',
        recipientDescription: descParsed,
      });
    }

    return orders.map((o): ServiceOrder => {
      let docs: string[] = [];
      if (o.documentsToServe) {
        try {
          docs = JSON.parse(o.documentsToServe);
        } catch (e) {
          docs = [o.documentsToServe];
        }
      }

      return {
        id: o.id,
        creatorUid: o.creatorUid || undefined,
        // Fields from screenshot
        entityBeingServed: o.recipientName,
        serviceAddress: o.serviceAddress,
        dateAdded: new Date(o.createdAt).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }),
        orderStatus: o.status === 'served' ? 'Served' : o.status === 'non_served' ? 'Non-Served' : o.status === 'in_progress' ? 'In Progress' : 'Open',
        dateClosed: o.status === 'served' && o.proofOfServiceSignedAt ? new Date(o.proofOfServiceSignedAt).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) : 'N/A',
        closedStatus: o.status === 'served' ? 'Served' : o.status === 'non_served' ? 'Non-Served' : 'N/A',
        responsiblePartyClient: `${o.clientName} (${o.clientFirm})`,
        responsibleParty: `${o.clientName} (${o.clientFirm})`,
        serviceInvoiceStatus: o.status === 'served' ? 'Paid in Full' : 'Sent–Pending',
        dueDateRequested: new Date(o.deadlineDate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }),
        serviceSpeedRequested: o.priority === 'same_day' ? 'Same Day Urgent' : o.priority === 'rush' ? 'Rush (24–48 Hours)' : 'Standard (3–5 Days)',
        plaintiffName: o.plaintiff,
        defendantName: o.defendant,
        commentsNotes: o.specialInstructions || '',
        // Core/legacy fields
        caseNumber: o.caseNumber,
        courtName: o.courtName,
        plaintiff: o.plaintiff,
        defendant: o.defendant,
        recipientName: o.recipientName,
        priority: o.priority as ServiceOrder['priority'],
        status: o.status as ServiceOrder['status'],
        clientName: o.clientName,
        clientFirm: o.clientFirm,
        clientEmail: o.clientEmail,
        clientPhone: '(555) 019-2834',
        assignedServerName: o.assignedServerName || undefined,
        documentTypes: docs.length > 0 ? docs : ['Summons & Complaint'],
        specialInstructions: o.specialInstructions || undefined,
        deadlineDate: o.deadlineDate,
        createdAt: o.createdAt,
        updatedAt: o.updatedAt,
        proofOfServiceSignedAt: o.proofOfServiceSignedAt || undefined,
        proofOfServiceSigner: o.proofOfServiceSigner || undefined,
        attempts: attemptsByOrderId[o.id] || [],
      };
    });
  } catch (error) {
    console.error('Failed to fetch service orders from Cloud SQL:', error);
    throw new Error('Database query failed. Please try again later.');
  }
}

export async function saveServiceOrderToDb(order: ServiceOrder) {
  try {
    const safeCase = order.caseNumber || `CV-${order.id.slice(-4)}`;
    const safeCourt = order.courtName || 'Superior Court of California';
    const safePlaintiff = order.plaintiffName || order.plaintiff || 'Plaintiff';
    const safeDefendant = order.defendantName || order.defendant || 'Defendant';
    const safeRecipient = order.entityBeingServed || order.recipientName || 'Recipient';
    const safePriority = order.priority || (order.serviceSpeedRequested === 'Same Day Urgent' ? 'same_day' : order.serviceSpeedRequested === 'Rush (24–48 Hours)' ? 'rush' : 'standard');
    const safeStatus = order.status || (order.orderStatus === 'Served' ? 'served' : order.orderStatus === 'Non-Served' ? 'non_served' : 'in_progress');
    const safeClient = order.clientName || order.responsibleParty || 'Client';
    const safeFirm = order.clientFirm || 'Legal Counsel';
    const safeEmail = order.clientEmail || 'attorney@lawfirm.example';
    const safeDeadline = order.dueDateRequested || order.deadlineDate || new Date().toISOString();
    const safeCreated = order.createdAt || new Date().toISOString();
    const safeUpdated = order.updatedAt || new Date().toISOString();

    await db.insert(serviceOrders)
      .values({
        id: order.id,
        creatorUid: order.creatorUid || null,
        caseNumber: safeCase,
        courtName: safeCourt,
        plaintiff: safePlaintiff,
        defendant: safeDefendant,
        recipientName: safeRecipient,
        serviceAddress: order.serviceAddress,
        priority: safePriority,
        status: safeStatus,
        clientName: safeClient,
        clientFirm: safeFirm,
        clientEmail: safeEmail,
        assignedServerName: order.assignedServerName || null,
        documentsToServe: JSON.stringify(order.documentTypes || []),
        specialInstructions: order.commentsNotes || order.specialInstructions || null,
        deadlineDate: safeDeadline,
        proofOfServiceSignedAt: order.proofOfServiceSignedAt || null,
        proofOfServiceSigner: order.proofOfServiceSigner || null,
        createdAt: safeCreated,
        updatedAt: safeUpdated,
      })
      .onConflictDoUpdate({
        target: serviceOrders.id,
        set: {
          status: order.status,
          assignedServerName: order.assignedServerName || null,
          proofOfServiceSignedAt: order.proofOfServiceSignedAt || null,
          proofOfServiceSigner: order.proofOfServiceSigner || null,
          updatedAt: order.updatedAt,
        },
      });

    // Save attempts
    for (const att of order.attempts || []) {
      await db.insert(serviceAttempts)
        .values({
          id: att.id,
          orderId: order.id,
          timestamp: att.timestamp,
          outcome: att.outcome,
          serverName: att.serverName,
          serverBadgeId: att.serverBadgeId,
          locationAddress: att.locationAddress,
          latitude: att.latitude ? att.latitude.toString() : null,
          longitude: att.longitude ? att.longitude.toString() : null,
          notes: att.notes,
          photoUrl: att.photoUrl || null,
          signatureUrl: att.signatureUrl || null,
          recipientNameServed: att.recipientNameServed || null,
          relationshipToRecipient: att.relationshipToRecipient || null,
          verifiedGps: att.verifiedGps ? 'true' : 'false',
          recipientDescription: att.recipientDescription ? JSON.stringify(att.recipientDescription) : null,
        })
        .onConflictDoNothing();
    }
  } catch (error) {
    console.error('Failed to save service order to Cloud SQL:', error);
    throw new Error('Database operation failed. Please try again later.');
  }
}

export async function getNotificationsFromDb(): Promise<AppNotification[]> {
  try {
    const list = await db.select().from(appNotifications);
    return list.map((n): AppNotification => ({
      id: n.id,
      orderId: n.orderId,
      caseNumber: n.caseNumber,
      title: n.title,
      message: n.message,
      channel: n.channel as AppNotification['channel'],
      priority: n.priority as AppNotification['priority'],
      read: n.read === 'true',
      timestamp: n.timestamp,
    }));
  } catch (error) {
    console.error('Failed to fetch notifications from Cloud SQL:', error);
    return [];
  }
}

export async function saveNotificationInDb(notif: AppNotification) {
  try {
    await db.insert(appNotifications)
      .values({
        id: notif.id,
        orderId: notif.orderId,
        caseNumber: notif.caseNumber,
        title: notif.title,
        message: notif.message,
        channel: notif.channel,
        priority: notif.priority,
        read: notif.read ? 'true' : 'false',
        timestamp: notif.timestamp,
      })
      .onConflictDoNothing();
  } catch (error) {
    console.error('Failed to save notification to Cloud SQL:', error);
  }
}
