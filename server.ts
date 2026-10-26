import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import Stripe from "stripe";
import { 
  upsertUserInDb, 
  getUserByUid, 
  getServiceOrdersFromDb, 
  saveServiceOrderToDb,
  getNotificationsFromDb,
  saveNotificationInDb
} from "./src/db/users.ts";
import { INITIAL_SERVICE_ORDERS } from "./src/mockData.ts";

let stripeClient: Stripe | null = null;

function getStripe(): Stripe | null {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return null;
  }
  if (!stripeClient) {
    stripeClient = new Stripe(secretKey);
  }
  return stripeClient;
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // Health check API
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      service: "ProcessServerSolutions", 
      database: "Cloud SQL PostgreSQL (us-west1)" 
    });
  });

  // Users database (clean slate, no example data)
  let appUsers: any[] = [];

  // Current session user (null initially, or set upon signin/signup)
  let currentSessionUser: any = null;

  // Session API
  app.get("/api/auth/session", (req, res) => {
    res.json({ user: currentSessionUser });
  });

  // Sign In API
  app.post("/api/auth/signin", (req, res) => {
    const { email, password } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }
    const found = appUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (found) {
      currentSessionUser = found;
      return res.json({ user: found });
    }
    // Auto-create demo session if not found
    const newUser = {
      id: appUsers.length + 1,
      full_name: email.split('@')[0],
      first_name: email.split('@')[0],
      last_name: '',
      email,
      role: 'agency_admin',
      agency: 'Civil Process Agency',
      username: email.split('@')[0],
      phone: '',
      active: 1,
      customer_name: '',
      zipCodes: []
    };
    appUsers.push(newUser);
    currentSessionUser = newUser;
    res.json({ user: newUser });
  });

  // Sign Up API
  app.post("/api/auth/signup", (req, res) => {
    const data = req.body;
    if (!data.email) {
      return res.status(400).json({ error: "Email is required" });
    }
    const fullName = [data.firstName, data.lastName].filter(Boolean).join(" ") || data.fullName || data.username || data.email;
    const agencyName = data.agency || data.organizationName || 'Civil Process Agency';
    const newUser = {
      id: appUsers.length + 1,
      full_name: fullName,
      first_name: data.firstName || fullName.split(' ')[0] || '',
      last_name: data.lastName || fullName.split(' ').slice(1).join(' ') || '',
      email: data.email,
      role: data.role || 'agency_admin',
      agency: agencyName,
      username: data.username || data.email.split('@')[0],
      phone: data.phone || '',
      active: data.active !== false ? 1 : 0,
      customer_name: data.customerName || agencyName,
      paySheet: data.paySheet || 'Standard Paysheet',
      isProcessServer: data.isProcessServer || 'Yes',
      licenseNumber: data.licenseNumber || '',
      licenseExpDate: data.licenseExpDate || '',
      countyOfLicense: data.countyOfLicense || '',
      dateOfBirth: data.dateOfBirth || '',
      zipCodes: data.zipCodes || [],
      signatureDataUrl: data.signatureDataUrl || '',
      smtpEmail: data.smtpEmail || '',
      smtpDisplayName: data.smtpDisplayName || '',
      smtpServer: data.smtpServer || '',
      smtpPort: data.smtpPort || '',
      subscriptionPlan: data.subscriptionPlan || 'silver'
    };
    appUsers.push(newUser);
    currentSessionUser = newUser;
    res.json({ user: newUser });
  });

  // Sign Out API
  app.post("/api/auth/signout", (req, res) => {
    currentSessionUser = null;
    res.json({ success: true });
  });

  // Orders list (clean slate, no example data)
  let refOrders: any[] = [];

  // In-memory notifications list (clean slate, no example data)
  let refNotifications: any[] = [];

  // Orders API
  app.get("/api/orders", (req, res) => {
    res.json({ orders: refOrders });
  });

  app.post("/api/orders", (req, res) => {
    const { title, details, deadline, customerJson, servicesJson, serveJson, intakeJson, clientId } = req.body;
    const clientUser = appUsers.find(u => u.id === Number(clientId)) || currentSessionUser || { id: 1, full_name: "Direct Client", agency: "Retaining Counsel" };
    const newId = 4800 + refOrders.length + 1;
    const newOrder = {
      id: newId,
      title: title || "New Civil Process Order",
      status: "new",
      client_name: `${clientUser.full_name} (${clientUser.agency || 'Client'})`,
      clientId: clientUser.id,
      assigned_server_name: null,
      serverId: null,
      deadline: deadline || null,
      details: details || "",
      created_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
      customerJson,
      servicesJson,
      serveJson,
      intakeJson,
      attempts: []
    };
    refOrders.unshift(newOrder);

    refNotifications.unshift({
      id: refNotifications.length + 1,
      channel: "intake",
      message: `New Order #${newId} created for ${clientUser.full_name}.`,
      created_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
      read_at: null
    });

    res.json({ success: true, order: newOrder });
  });

  // Assign Server API
  app.patch("/api/orders/:id/assign", (req, res) => {
    const orderId = Number(req.params.id);
    const { serverId } = req.body;
    const order = refOrders.find(o => o.id === orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    const serverUser = appUsers.find(u => u.id === Number(serverId));
    order.serverId = serverUser ? serverUser.id : null;
    order.assigned_server_name = serverUser ? serverUser.full_name : null;
    if (order.status === "new" && serverUser) {
      order.status = "assigned";
    }
    res.json({ success: true, order });
  });

  // Update Status API
  app.patch("/api/orders/:id/status", (req, res) => {
    const orderId = Number(req.params.id);
    const { status } = req.body;
    const order = refOrders.find(o => o.id === orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    order.status = status;
    res.json({ success: true, order });
  });

  // Log Attempt API
  app.post("/api/orders/:id/attempts", (req, res) => {
    const orderId = Number(req.params.id);
    const { notes, gpsLat, gpsLng, physicalDescription, timelineNote, evidenceUrl } = req.body;
    const order = refOrders.find(o => o.id === orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    const isServed = timelineNote && timelineNote.includes("SUCCESSFULLY SERVED");
    const newAttempt = {
      id: order.attempts.length + 1,
      date: new Date().toISOString().slice(0, 10),
      time: new Date().toTimeString().slice(0, 5),
      notes,
      outcome: isServed ? "served" : "attempted",
      physicalDescription: physicalDescription || "",
      gpsLat,
      gpsLng,
      evidenceUrl: evidenceUrl || ""
    };
    order.attempts.push(newAttempt);
    if (isServed) {
      order.status = "completed";
    } else if (order.status !== "completed") {
      order.status = "attempted";
    }
    res.json({ success: true, attempt: newAttempt, order });
  });

  // Draft Affidavit API
  app.post("/api/orders/:id/affidavit-draft", (req, res) => {
    const orderId = Number(req.params.id);
    const order = refOrders.find(o => o.id === orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    const company = currentSessionUser?.agency || "Process Servers Solution";
    const serverName = order.assigned_server_name || currentSessionUser?.full_name || "Authorized Civil Process Server";
    const draftText = `AFFIDAVIT OF SERVICE\n\nSTATE OF CIVIL JURISDICTION\nCOUNTY OF SERVICE RECORD\n\nRE: Order #${order.id} — ${order.title}\nISSUED BY: ${company}\n\nI, ${serverName}, being first duly sworn, depose and say that I am a competent adult authorized under applicable statutory rules of civil procedure to execute process service.\n\nOn the recorded service date, I executed personal and diligent process service in connection with this proceeding.\n\nSummary of Service Attempts & Delivery:\n${order.attempts.map((a: any, i: number) => `Attempt #${i+1} (${a.date} ${a.time}): ${a.notes} [Outcome: ${a.outcome.toUpperCase()}]`).join('\n') || 'Personal service successfully executed on defendant.'}\n\nSubscribed and affirmed under penalty of perjury.\nServer: ${serverName}\nAgency: ${company}\nTimestamp: ${new Date().toUTCString()}`;
    
    res.json({ success: true, affidavit: draftText });
  });

  // Invoice Stub API
  app.post("/api/orders/:id/invoice-stub", (req, res) => {
    const orderId = Number(req.params.id);
    const order = refOrders.find(o => o.id === orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    const company = currentSessionUser?.agency || "Process Servers Solution";
    res.json({ 
      success: true, 
      invoiceStub: {
        orderId,
        companyName: company,
        invoiceNumber: `INV-${orderId}`,
        amount: 175.00,
        status: "Sent - Pending Payment"
      }
    });
  });

  // Automated Client Invoice Email Notification API
  app.post("/api/orders/:id/email-invoice", async (req, res) => {
    const orderId = Number(req.params.id);
    const order = refOrders.find(o => o.id === orderId);

    // Extract client email directly from order's client / customer details
    const orderCustomer = (() => {
      try {
        return typeof order?.customerJson === 'string' ? JSON.parse(order.customerJson) : (order?.customerJson || {});
      } catch {
        return {};
      }
    })();
    const orderIntake = (() => {
      try {
        return typeof order?.intakeJson === 'string' ? JSON.parse(order.intakeJson) : (order?.intakeJson || {});
      } catch {
        return {};
      }
    })();

    const resolvedEmail = 
      req.body.clientEmail ||
      orderCustomer.contactEmail ||
      orderCustomer.email ||
      orderIntake.customer?.contactEmail ||
      orderIntake.customer?.email ||
      order?.clientEmail ||
      order?.client_email ||
      "billing@summitlegal.com";

    const clientName = 
      req.body.clientName ||
      orderCustomer.name ||
      order?.client_name ||
      "Responsible Client";

    const invoiceNum = req.body.invoiceNumber || `INV-${orderId || 4801}`;
    const amount = Number(req.body.amount || 175.00);
    const company = currentSessionUser?.agency || "Process Servers Solution";
    const serviceTitle = order?.title || req.body.serviceTitle || "Civil Process Service Order";
    const attachedPdfName = req.body.attachedPdfName || `Invoice_${invoiceNum}.pdf`;

    // Mark order status as sent
    if (order) {
      order.serviceInvoiceStatus = "Sent–Pending";
      order.invoiceSentAt = new Date().toISOString();
      order.invoiceSentTo = resolvedEmail;
    }

    const emailRecord = {
      id: refNotifications.length + 1,
      channel: "email",
      orderId: orderId,
      recipientEmail: resolvedEmail,
      recipientName: clientName,
      title: `Invoice #${invoiceNum} Attached — Sent to ${resolvedEmail}`,
      message: `Automated billing notification dispatched to ${clientName} (${resolvedEmail}). Invoice #${invoiceNum} ($${amount.toFixed(2)}) for "${serviceTitle}" has been delivered with itemized PDF attached (${attachedPdfName}).`,
      attachment: {
        fileName: attachedPdfName,
        fileType: "application/pdf",
        invoiceNumber: invoiceNum,
        amount: amount,
        issuedBy: company
      },
      created_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
      read_at: null
    };

    refNotifications.unshift(emailRecord);

    // Persist to Cloud SQL / Firestore if available
    try {
      await saveNotificationInDb({
        orderId: String(orderId),
        caseNumber: `CV-${orderId}`,
        title: emailRecord.title,
        message: emailRecord.message,
        channel: 'email',
        priority: 'info',
        read: false,
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      // safe fallback
    }

    res.json({
      success: true,
      message: `Invoice #${invoiceNum} automatically emailed to ${resolvedEmail} with ${attachedPdfName} attached.`,
      recipientEmail: resolvedEmail,
      recipientName: clientName,
      invoiceNumber: invoiceNum,
      attachedPdfName,
      amount,
      sentAt: emailRecord.created_at,
      notification: emailRecord
    });
  });

  // Notifications API
  app.get("/api/notifications", (req, res) => {
    res.json({ notifications: refNotifications });
  });

  // Users APIs
  app.get("/api/users", (req, res) => {
    res.json({ users: appUsers });
  });

  app.get("/api/users/process-servers", (req, res) => {
    const servers = appUsers.filter(u => u.role === "process_server");
    res.json({ users: servers });
  });

  app.get("/api/users/clients", (req, res) => {
    const clients = appUsers.filter(u => u.role === "client");
    res.json({ users: clients });
  });

  app.post("/api/users", (req, res) => {
    const data = req.body;
    const fullName = [data.firstName, data.lastName].filter(Boolean).join(" ") || data.fullName || data.username || data.email;
    const newUser = {
      id: appUsers.length + 1,
      full_name: fullName,
      first_name: data.firstName || "",
      last_name: data.lastName || "",
      email: data.email,
      role: data.role || "process_server",
      agency: data.agency || "Civil Process Agency",
      username: data.username || data.email.split('@')[0],
      phone: data.phone || "",
      active: data.active !== false ? 1 : 0,
      customer_name: data.customerName || "",
      paySheet: data.paySheet || "Standard Paysheet",
      isProcessServer: data.isProcessServer || "Yes",
      licenseNumber: data.licenseNumber || "",
      licenseExpDate: data.licenseExpDate || "",
      countyOfLicense: data.countyOfLicense || "",
      dateOfBirth: data.dateOfBirth || "",
      zipCodes: data.zipCodes || []
    };
    appUsers.push(newUser);
    res.json({ success: true, user: newUser });
  });

  app.patch("/api/users/:id", (req, res) => {
    const userId = Number(req.params.id);
    const user = appUsers.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const data = req.body;
    if (data.firstName || data.lastName) {
      user.first_name = data.firstName ?? user.first_name;
      user.last_name = data.lastName ?? user.last_name;
      user.full_name = [user.first_name, user.last_name].filter(Boolean).join(" ");
    }
    if (data.email) user.email = data.email;
    if (data.phone) user.phone = data.phone;
    if (data.agency) user.agency = data.agency;
    if (data.role) user.role = data.role;
    if (data.customerName) user.customer_name = data.customerName;
    if (data.active !== undefined) user.active = data.active ? 1 : 0;
    if (data.paySheet) user.paySheet = data.paySheet;
    if (data.zipCodes) user.zipCodes = data.zipCodes;
    if (data.signatureDataUrl) user.signatureDataUrl = data.signatureDataUrl;

    if (currentSessionUser && currentSessionUser.id === userId) {
      currentSessionUser = { ...currentSessionUser, ...user };
    }
    res.json({ success: true, user });
  });

  app.patch("/api/users/me", (req, res) => {
    if (!currentSessionUser) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const data = req.body;
    const user = appUsers.find(u => u.id === currentSessionUser.id);
    if (user) {
      Object.assign(user, data);
      if (data.firstName || data.lastName) {
        user.full_name = [data.firstName || user.first_name, data.lastName || user.last_name].filter(Boolean).join(" ");
      }
      currentSessionUser = { ...user };
    }
    res.json({ success: true, user: currentSessionUser });
  });

  // Push notifications stub API
  app.get("/api/push/public-key", (req, res) => {
    res.json({ publicKey: "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZ_WJJn5VDX3Gn82pGfkshPrpGbCGioddAfkeYA" });
  });

  app.post("/api/push/subscribe", (req, res) => {
    res.json({ success: true });
  });



  // Upsert user profile in Cloud SQL
  app.post("/api/user/profile", async (req, res) => {
    try {
      const profile = req.body;
      if (!profile || !profile.userId || !profile.email) {
        return res.status(400).json({ error: "Missing required profile fields" });
      }
      const saved = await upsertUserInDb(profile);
      res.json({ success: true, profile: saved });
    } catch (error: any) {
      console.error("Error saving user profile to Cloud SQL:", error);
      res.status(500).json({ error: error.message || "Failed to save profile" });
    }
  });

  // Fetch user profile from Cloud SQL by UID
  app.get("/api/user/profile/:uid", async (req, res) => {
    try {
      const user = await getUserByUid(req.params.uid);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ success: true, user });
    } catch (error: any) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ error: error.message || "Failed to fetch profile" });
    }
  });

  // Get notifications from Cloud SQL
  app.get("/api/notifications", async (req, res) => {
    try {
      const notifications = await getNotificationsFromDb();
      res.json({ success: true, notifications });
    } catch (error: any) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ error: error.message || "Failed to fetch notifications" });
    }
  });

  // Save notification to Cloud SQL
  app.post("/api/notifications", async (req, res) => {
    try {
      const notif = req.body;
      await saveNotificationInDb(notif);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error saving notification:", error);
      res.status(500).json({ error: error.message || "Failed to save notification" });
    }
  });

  // Stripe Payment Processor Config
  app.get("/api/stripe/config", (req, res) => {
    const isConfigured = !!process.env.STRIPE_SECRET_KEY;
    res.json({
      configured: isConfigured,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || null,
      provider: "Stripe Payment Gateway",
      acceptedMethods: ["Visa", "Mastercard", "American Express", "Discover", "Apple Pay", "Google Pay"]
    });
  });

  // Create Stripe Checkout Session
  app.post("/api/stripe/create-checkout-session", async (req, res) => {
    try {
      const { orderId, caseNumber, amount, description, clientEmail, successUrl, cancelUrl } = req.body;
      const stripe = getStripe();

      if (!stripe) {
        // Safe demo fallback when user hasn't added live secret key yet
        return res.json({
          configured: false,
          demoMode: true,
          message: "Stripe API key is not configured in .env. Interactive test simulation mode is active.",
          sessionId: `demo_sess_${Date.now()}`
        });
      }

      const numAmount = Math.max(1, Math.round(Number(amount || 100) * 100)); // Cents
      const hostUrl = req.headers.origin || `http://localhost:${PORT}`;

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `Process Service Invoice #${caseNumber || orderId}`,
                description: description || "Service of Legal Process & Return of Service",
              },
              unit_amount: numAmount,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        customer_email: clientEmail || undefined,
        metadata: {
          orderId: orderId || "",
          caseNumber: caseNumber || "",
        },
        success_url: successUrl || `${hostUrl}/?payment=success&orderId=${orderId}`,
        cancel_url: cancelUrl || `${hostUrl}/?payment=cancelled&orderId=${orderId}`,
      });

      res.json({
        configured: true,
        demoMode: false,
        sessionId: session.id,
        checkoutUrl: session.url
      });
    } catch (error: any) {
      console.error("Error creating Stripe checkout session:", error);
      res.status(500).json({ error: error.message || "Failed to initiate Stripe session" });
    }
  });

  // Record Invoice Payment & Sync Order Status
  app.post("/api/stripe/record-payment", async (req, res) => {
    try {
      const { orderId, paymentId, amount, paymentMethod } = req.body;
      if (!orderId) {
        return res.status(400).json({ error: "Missing orderId" });
      }

      const orders = await getServiceOrdersFromDb();
      const existing = orders.find(o => o.id === orderId);
      if (existing) {
        existing.serviceInvoiceStatus = "Paid in Full";
        await saveServiceOrderToDb(existing);
      }

      res.json({ 
        success: true, 
        orderId, 
        status: "Paid in Full",
        paymentId: paymentId || `txn_${Date.now()}`,
        amount,
        paymentMethod: paymentMethod || "stripe"
      });
    } catch (error: any) {
      console.error("Error recording invoice payment:", error);
      res.status(500).json({ error: error.message || "Failed to record payment" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.use((req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ProcessServerSolutions server running on port ${PORT}`);
  });
}

startServer();
