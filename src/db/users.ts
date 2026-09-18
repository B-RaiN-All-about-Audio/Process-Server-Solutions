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
        caseNumber: o.caseNumber,
        courtName: o.courtName,
        plaintiff: o.plaintiff,
        defendant: o.defendant,
        recipientName: o.recipientName,
        serviceAddress: o.serviceAddress,
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
    await db.insert(serviceOrders)
      .values({
        id: order.id,
        creatorUid: order.creatorUid || null,
        caseNumber: order.caseNumber,
        courtName: order.courtName,
        plaintiff: order.plaintiff,
        defendant: order.defendant,
        recipientName: order.recipientName,
        serviceAddress: order.serviceAddress,
        priority: order.priority,
        status: order.status,
        clientName: order.clientName,
        clientFirm: order.clientFirm,
        clientEmail: order.clientEmail,
        assignedServerName: order.assignedServerName || null,
        documentsToServe: JSON.stringify(order.documentTypes || []),
        specialInstructions: order.specialInstructions || null,
        deadlineDate: order.deadlineDate,
        proofOfServiceSignedAt: order.proofOfServiceSignedAt || null,
        proofOfServiceSigner: order.proofOfServiceSigner || null,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
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
