import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { 
  upsertUserInDb, 
  getUserByUid, 
  getServiceOrdersFromDb, 
  saveServiceOrderToDb,
  getNotificationsFromDb,
  saveNotificationInDb
} from "./src/db/users.ts";
import { INITIAL_SERVICE_ORDERS } from "./src/mockData.ts";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check API
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      service: "ProcessServerSolutions", 
      database: "Cloud SQL PostgreSQL (us-west1)" 
    });
  });

  // Get all Service Orders from Cloud SQL
  app.get("/api/orders", async (req, res) => {
    try {
      let orders = await getServiceOrdersFromDb();
      // If DB is empty, seed initial orders
      if (!orders || orders.length === 0) {
        for (const ord of INITIAL_SERVICE_ORDERS) {
          await saveServiceOrderToDb(ord);
        }
        orders = await getServiceOrdersFromDb();
      }
      res.json({ success: true, orders });
    } catch (error: any) {
      console.error("Error fetching orders from Cloud SQL:", error);
      res.status(500).json({ error: error.message || "Failed to fetch orders" });
    }
  });

  // Save or update a Service Order in Cloud SQL
  app.post("/api/orders", async (req, res) => {
    try {
      const order = req.body;
      if (!order || !order.id) {
        return res.status(400).json({ error: "Invalid order data" });
      }
      await saveServiceOrderToDb(order);
      res.json({ success: true, order });
    } catch (error: any) {
      console.error("Error saving order to Cloud SQL:", error);
      res.status(500).json({ error: error.message || "Failed to save order" });
    }
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
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ProcessServerSolutions server running on port ${PORT}`);
  });
}

startServer();
