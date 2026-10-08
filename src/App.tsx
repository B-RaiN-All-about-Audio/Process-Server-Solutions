import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { StatsOverview } from './components/StatsOverview';
import { OrderList } from './components/OrderList';
import { OrderDetailModal } from './components/OrderDetailModal';
import { LogAttemptModal } from './components/LogAttemptModal';
import { ProofOfServiceModal } from './components/ProofOfServiceModal';
import { NewOrderModal } from './components/NewOrderModal';
import { NotificationDrawer } from './components/NotificationDrawer';
import { LiveToast } from './components/LiveToast';
import { AuthModal } from './components/AuthModal';
import { INITIAL_SERVICE_ORDERS, INITIAL_NOTIFICATIONS } from './mockData';
import { ServiceOrder, AppNotification, UserRole, ServiceAttempt, UserProfile, PageTab } from './types';
import { Sidebar } from './components/Sidebar';
import { FieldCommandView } from './components/FieldCommandView';
import { AffidavitsView } from './components/AffidavitsView';
import { AnalyticsView } from './components/AnalyticsView';
import { NotificationsView } from './components/NotificationsView';
import { AccountView } from './components/AccountView';
import { 
  auth, 
  subscribeToOrders, 
  saveServiceOrderToDb, 
  seedInitialOrdersIfEmpty, 
  getUserProfileFromDb,
  saveNotificationToDb 
} from './lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { ShieldCheck, RefreshCw, Radio, Sparkles, Database } from 'lucide-react';

export const App: React.FC = () => {
  // SaaS Authenticated User Profile
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('pss_current_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return null;
  });

  const [firestoreConnected, setFirestoreConnected] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // Orders State with LocalStorage fallback & Firestore sync
  const [orders, setOrders] = useState<ServiceOrder[]>(() => {
    const saved = localStorage.getItem('pss_orders');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed parsing saved orders', e);
      }
    }
    return INITIAL_SERVICE_ORDERS;
  });

  // Notifications State
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem('pss_notifications');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed parsing saved notifications', e);
      }
    }
    return INITIAL_NOTIFICATIONS;
  });

  const [currentRole, setCurrentRole] = useState<UserRole>('client');
  const [activeTab, setActiveTab] = useState<PageTab>('orders');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [pushEnabled, setPushEnabled] = useState<boolean>(true);

  // Modals state
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<ServiceOrder | null>(null);
  const [selectedOrderForAttempt, setSelectedOrderForAttempt] = useState<ServiceOrder | null>(null);
  const [selectedOrderForProof, setSelectedOrderForProof] = useState<ServiceOrder | null>(null);
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);
  const [liveToast, setLiveToast] = useState<AppNotification | null>(null);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const profile = await getUserProfileFromDb(user.uid);
          if (profile) {
            setCurrentUser(profile);
            setCurrentRole(profile.role);
            localStorage.setItem('pss_current_user', JSON.stringify(profile));
          }
        } catch (e) {
          console.warn('Notice fetching user profile from DB:', e);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Listen to Firestore real-time updates for Service Orders
  useEffect(() => {
    // Seed initial cases if Firestore is fresh
    seedInitialOrdersIfEmpty(INITIAL_SERVICE_ORDERS).catch(() => {});

    // Subscribe to live Firestore changes
    const unsubscribe = subscribeToOrders(
      (remoteOrders) => {
        if (remoteOrders && remoteOrders.length > 0) {
          setOrders(remoteOrders);
          setFirestoreConnected(true);
        }
      },
      (err) => {
        console.log('[Firestore] Live listener fallback to local cache:', err);
      }
    );

    return () => unsubscribe();
  }, []);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('pss_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('pss_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Gentle audio chime for push notifications
  const playNotificationChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.36);
    } catch (err) {
      // Audio context may be restricted before user gesture
    }
  };

  // Add Notification helper
  const addNotification = (notifData: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotif: AppNotification = {
      ...notifData,
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      timestamp: new Date().toISOString(),
      read: false,
    };

    setNotifications((prev) => [newNotif, ...prev]);
    setLiveToast(newNotif);

    if (currentUser) {
      saveNotificationToDb(currentUser.userId, newNotif).catch(() => {});
    }

    fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newNotif),
    }).catch(() => {});

    if (pushEnabled) {
      playNotificationChime();
    }
  };

  // Handler: Submitting an Attempt
  const handleLogAttemptSubmit = (orderId: string, attemptData: Omit<ServiceAttempt, 'id' | 'orderId'>) => {
    const newAttempt: ServiceAttempt = {
      ...attemptData,
      id: `att-${Date.now()}`,
      orderId,
    };

    const isServed = attemptData.outcome === 'personal_service' || attemptData.outcome === 'substituted_service';
    const isNonServed = attemptData.outcome === 'address_vacant' || attemptData.outcome === 'bad_address';

    let updatedTargetOrder: ServiceOrder | null = null;

    setOrders((prevOrders) =>
      prevOrders.map((ord) => {
        if (ord.id === orderId) {
          const updated: ServiceOrder = {
            ...ord,
            attempts: [...ord.attempts, newAttempt],
            status: isServed ? 'served' : isNonServed ? 'non_served' : 'in_progress',
            updatedAt: new Date().toISOString(),
            proofOfServiceSignedAt: isServed ? new Date().toISOString() : ord.proofOfServiceSignedAt,
            proofOfServiceSigner: isServed
              ? `${attemptData.serverName}, Reg #${attemptData.serverBadgeId}`
              : ord.proofOfServiceSigner,
          };
          updatedTargetOrder = updated;
          return updated;
        }
        return ord;
      })
    );

    // Save to Cloud SQL and Firestore
    if (updatedTargetOrder) {
      // 1. Cloud SQL Backend
      fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTargetOrder),
      }).catch((e) => console.warn('Cloud SQL order sync fallback:', e));

      // 2. Firestore Cloud Database
      saveServiceOrderToDb(updatedTargetOrder).catch((e) =>
        console.warn('Error syncing attempt to Firestore:', e)
      );
    }

    // Keep detail modal updated if open
    if (selectedOrderForDetail && selectedOrderForDetail.id === orderId) {
      setSelectedOrderForDetail((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          attempts: [...prev.attempts, newAttempt],
          status: isServed ? 'served' : isNonServed ? 'non_served' : 'in_progress',
          updatedAt: new Date().toISOString(),
        };
      });
    }

    // Trigger Real-time Push & Email alerts
    const targetOrder = orders.find((o) => o.id === orderId);
    const caseNum = targetOrder ? targetOrder.caseNumber : 'Legal Matter';
    const recipient = targetOrder ? targetOrder.recipientName : 'Party';

    if (isServed) {
      addNotification({
        orderId,
        caseNumber: caseNum,
        title: `Service Successfully Executed! 🎯`,
        message: `${recipient} was ${
          attemptData.outcome === 'personal_service' ? 'personally served' : 'served via substituted service'
        } at ${attemptData.locationAddress}. Official Affidavit of Service prepared and persisted to Firestore.`,
        channel: 'push',
        priority: 'success',
      });

      // Also trigger email alert to requesting attorney
      setTimeout(() => {
        addNotification({
          orderId,
          caseNumber: caseNum,
          title: `Proof of Service Dispatched to ${targetOrder?.clientEmail || 'Client'}`,
          message: `Certified Proof of Service for ${recipient} has been timestamped and emailed to ${targetOrder?.clientFirm || 'Requesting Firm'}.`,
          channel: 'email',
          priority: 'info',
        });
      }, 1000);
    } else {
      addNotification({
        orderId,
        caseNumber: caseNum,
        title: `Field Attempt Logged: ${attemptData.outcome.replace('_', ' ').toUpperCase()}`,
        message: `Server ${attemptData.serverName} logged attempt at ${attemptData.locationAddress}. Notes: "${attemptData.notes}"`,
        channel: 'push',
        priority: 'warning',
      });
    }
  };

  // Handler: Create New Service Order
  const handleCreateOrder = (newOrder: ServiceOrder) => {
    const orderWithCreator: ServiceOrder = {
      ...newOrder,
      creatorUid: currentUser?.userId,
    };

    setOrders((prev) => [orderWithCreator, ...prev]);

    // Save to Cloud SQL and Firestore
    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderWithCreator),
    }).catch((e) => console.warn('Cloud SQL order sync fallback:', e));

    saveServiceOrderToDb(orderWithCreator).catch((e) =>
      console.warn('Error saving new service order to Firestore:', e)
    );

    addNotification({
      orderId: newOrder.id,
      caseNumber: newOrder.caseNumber,
      title: `Service Order #${newOrder.caseNumber} Registered & Saved to DB`,
      message: `Order for ${newOrder.recipientName} received and assigned to Server ${newOrder.assignedServerName}. Priority: ${newOrder.priority.toUpperCase()}`,
      channel: 'in_app',
      priority: 'info',
    });
  };

  // Handler: User authenticated callback
  const handleUserAuthenticated = (profile: UserProfile) => {
    setCurrentUser(profile);
    setCurrentRole(profile.role);
    localStorage.setItem('pss_current_user', JSON.stringify(profile));

    // Sync profile to Cloud SQL
    fetch('/api/user/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    }).catch((e) => console.warn('Cloud SQL user profile sync fallback:', e));

    addNotification({
      orderId: orders[0]?.id || 'auth',
      caseNumber: 'SaaS Account',
      title: `Welcome, ${profile.fullName}!`,
      message: `Your SaaS profile for ${profile.organizationName} (${profile.subscriptionPlan.toUpperCase()} tier) is active and synced to Firestore.`,
      channel: 'in_app',
      priority: 'info',
    });
  };

  // Handler: Sign out
  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (e) {}
    setCurrentUser(null);
    localStorage.removeItem('pss_current_user');
    addNotification({
      orderId: 'auth',
      caseNumber: 'Account',
      title: 'Signed Out',
      message: 'You have signed out of your SaaS profile.',
      channel: 'in_app',
      priority: 'info',
    });
  };

  // Handler: Simulation of live field event
  const handleSimulateFieldAction = () => {
    const candidate = orders.find((o) => o.status === 'in_progress' || o.status === 'assigned') || orders[0];
    if (!candidate) return;

    const outcomes: Array<{ outcome: ServiceAttempt['outcome']; notes: string }> = [
      {
        outcome: 'no_answer',
        notes: 'Arrived on scene; vehicle in driveway with warm hood. Knocked and announced legal process server 3 times. No answer at entry. Left contact card.',
      },
      {
        outcome: 'personal_service',
        notes: 'Subject intercepted at property front gate while checking mailbox. Stated legal process delivery and handed documents. Identity confirmed.',
      },
      {
        outcome: 'resident_not_home',
        notes: 'Neighbor at adjacent residence stated subject usually returns home from work after 6:30 PM. Returning during evening window.',
      }
    ];

    const pick = outcomes[Math.floor(Math.random() * outcomes.length)];
    const isServed = pick.outcome === 'personal_service';

    const simulatedAttempt: Omit<ServiceAttempt, 'id' | 'orderId'> = {
      timestamp: new Date().toISOString(),
      outcome: pick.outcome,
      serverName: candidate.assignedServerName || (currentUser?.role === 'process_server' ? currentUser.fullName : 'Elena Chen'),
      serverBadgeId: currentUser?.badgeNumber || 'LA-5102',
      latitude: 34.0522 + (Math.random() - 0.5) * 0.02,
      longitude: -118.2437 + (Math.random() - 0.5) * 0.02,
      locationAddress: candidate.serviceAddress,
      notes: pick.notes,
      photoUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80',
      signatureUrl: isServed ? 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="40"><path d="M10 25 C 30 10, 50 35, 70 15 S 110 30, 140 18" stroke="%231e293b" stroke-width="2" fill="none"/></svg>' : undefined,
      verifiedGps: true,
      recipientNameServed: isServed ? candidate.recipientName : undefined,
      relationshipToRecipient: isServed ? 'Direct Subject / Self' : undefined,
      recipientDescription: isServed ? {
        approxAge: '48',
        gender: 'Female',
        height: '5ft 7in',
        weight: '150 lbs',
        hairColor: 'Brown',
        wearsGlasses: true,
        distinguishingFeatures: 'Carrying car keys and leather purse'
      } : undefined
    };

    handleLogAttemptSubmit(candidate.id, simulatedAttempt);
  };

  const handleResetData = () => {
    if (confirm('Reset to standard sample service orders and notifications?')) {
      setOrders(INITIAL_SERVICE_ORDERS);
      setNotifications(INITIAL_NOTIFICATIONS);
      localStorage.removeItem('pss_orders');
      localStorage.removeItem('pss_notifications');
      // Re-seed to Firestore
      for (const ord of INITIAL_SERVICE_ORDERS) {
        saveServiceOrderToDb(ord).catch(() => {});
      }
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const attemptsCount = orders.reduce((acc, o) => acc + o.attempts.length, 0);
  const servedCount = orders.filter((o) => o.status === 'served').length;

  return (
    <div className="min-h-screen bg-slate-100 selection:bg-teal-600 selection:text-white flex flex-col">
      {/* Left Navigation Sidebar with Page Tabs */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
        ordersCount={orders.length}
        attemptsCount={attemptsCount}
        servedCount={servedCount}
        unreadCount={unreadCount}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onSignOut={handleSignOut}
        onOpenNewOrder={() => setIsNewOrderOpen(true)}
        onSimulateFieldAction={handleSimulateFieldAction}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        firestoreConnected={firestoreConnected}
      />

      {/* Main Page Content Wrapper (Offset on desktop by lg:pl-72) */}
      <div className="lg:pl-72 flex flex-col flex-1 min-h-screen">
        {/* Clean, Non-Overlapping Top Header */}
        <Header
          activeTab={activeTab}
          currentRole={currentRole}
          onRoleChange={setCurrentRole}
          unreadCount={unreadCount}
          onOpenNotifications={() => setIsNotificationDrawerOpen(true)}
          onOpenNewOrder={() => setIsNewOrderOpen(true)}
          pushEnabled={pushEnabled}
          onTogglePush={() => setPushEnabled(!pushEnabled)}
          onSimulateFieldAction={handleSimulateFieldAction}
          currentUser={currentUser}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onSignOut={handleSignOut}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
          firestoreConnected={firestoreConnected}
        />

        {/* Dynamic Page Views */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <StatsOverview
                orders={orders}
                currentRole={currentRole}
                activeStatusFilter={statusFilter}
                onFilterByStatus={setStatusFilter}
                currentUser={currentUser}
                onOpenAuth={() => setIsAuthModalOpen(true)}
              />

              <OrderList
                orders={orders}
                currentRole={currentRole}
                selectedStatus={statusFilter}
                onStatusChange={setStatusFilter}
                onSelectOrder={(order) => setSelectedOrderForDetail(order)}
                onLogAttempt={(order) => setSelectedOrderForAttempt(order)}
                onViewProof={(order) => setSelectedOrderForProof(order)}
              />
            </div>
          )}

          {activeTab === 'field' && (
            <FieldCommandView
              orders={orders}
              currentRole={currentRole}
              onLogAttempt={(order) => setSelectedOrderForAttempt(order)}
              onSelectOrder={(order) => setSelectedOrderForDetail(order)}
              onViewProof={(order) => setSelectedOrderForProof(order)}
            />
          )}

          {activeTab === 'affidavits' && (
            <AffidavitsView
              orders={orders}
              currentRole={currentRole}
              onViewProof={(order) => setSelectedOrderForProof(order)}
              onSelectOrder={(order) => setSelectedOrderForDetail(order)}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsView
              orders={orders}
              currentRole={currentRole}
            />
          )}

          {activeTab === 'notifications' && (
            <NotificationsView
              notifications={notifications}
              onMarkAllAsRead={() => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))}
              onClearAll={() => setNotifications([])}
              onSelectNotification={(orderId) => {
                const ord = orders.find((o) => o.id === orderId);
                if (ord) setSelectedOrderForDetail(ord);
              }}
              onTriggerSimulatedNotification={handleSimulateFieldAction}
              pushEnabled={pushEnabled}
              onTogglePush={() => setPushEnabled(!pushEnabled)}
            />
          )}

          {activeTab === 'account' && (
            <AccountView
              currentUser={currentUser}
              currentRole={currentRole}
              onOpenAuth={() => setIsAuthModalOpen(true)}
              onSignOut={handleSignOut}
              onRoleChange={setCurrentRole}
              firestoreConnected={firestoreConnected}
            />
          )}
        </main>

        {/* Clean, Non-Intrusive Footer */}
        <footer className="bg-white border-t border-slate-200 text-slate-500 py-4 text-xs mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span className="font-bold text-slate-800">ProcessServerSolutions</span>
              <span className="hidden sm:inline">— Cloud SaaS database management platform with real-time dispatch</span>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <button
                onClick={handleSimulateFieldAction}
                className="hover:text-teal-600 transition flex items-center gap-1 font-medium"
              >
                <Radio className="w-3.5 h-3.5 text-teal-500 animate-pulse" />
                Simulate Event
              </button>
              <span>•</span>
              <button
                onClick={handleResetData}
                className="hover:text-slate-800 transition flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                Reset Sample Cases
              </button>
            </div>
          </div>
        </footer>
      </div>

      {/* Modals & Drawers */}
      {selectedOrderForDetail && (
        <OrderDetailModal
          order={selectedOrderForDetail}
          onClose={() => setSelectedOrderForDetail(null)}
          currentRole={currentRole}
          onLogAttempt={(order) => {
            setSelectedOrderForDetail(null);
            setSelectedOrderForAttempt(order);
          }}
          onViewProof={(order) => {
            setSelectedOrderForDetail(null);
            setSelectedOrderForProof(order);
          }}
        />
      )}

      {selectedOrderForAttempt && (
        <LogAttemptModal
          order={selectedOrderForAttempt}
          onClose={() => setSelectedOrderForAttempt(null)}
          onSubmitAttempt={handleLogAttemptSubmit}
        />
      )}

      {selectedOrderForProof && (
        <ProofOfServiceModal
          order={selectedOrderForProof}
          onClose={() => setSelectedOrderForProof(null)}
        />
      )}

      <NewOrderModal
        isOpen={isNewOrderOpen}
        onClose={() => setIsNewOrderOpen(false)}
        onCreateOrder={handleCreateOrder}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onUserAuthenticated={handleUserAuthenticated}
      />

      <NotificationDrawer
        isOpen={isNotificationDrawerOpen}
        onClose={() => setIsNotificationDrawerOpen(false)}
        notifications={notifications}
        onMarkAllAsRead={() => {
          setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        }}
        onClearAll={() => setNotifications([])}
        onSelectNotification={(orderId) => {
          const ord = orders.find((o) => o.id === orderId);
          if (ord) {
            setSelectedOrderForDetail(ord);
          }
        }}
        onTriggerSimulatedNotification={handleSimulateFieldAction}
      />

      {/* Real-time live toast alert */}
      <LiveToast
        notification={liveToast}
        onClose={() => setLiveToast(null)}
        onClick={(orderId) => {
          const ord = orders.find((o) => o.id === orderId);
          if (ord) {
            setSelectedOrderForDetail(ord);
          }
        }}
      />
    </div>
  );
};

export default App;

