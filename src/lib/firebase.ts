import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocFromServer,
  getDocs,
  onSnapshot, 
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import config from '../../firebase-applet-config.json';
import { ServiceOrder, AppNotification, UserProfile } from '../types';

// Initialize Firebase App
export const app = initializeApp(config);

// Initialize Firestore (with databaseId if specified)
export const db = config.firestoreDatabaseId && config.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, config.firestoreDatabaseId)
  : getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);

// Test connection on boot as mandated by Firebase skill
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('[Firebase] Connected to Firestore database successfully');
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("[Firebase] Check your Firebase configuration - client is offline.");
    } else {
      console.log('[Firebase] Initial connection check:', error);
    }
  }
}
testConnection();

/**
 * Save user SaaS profile and registration data into Firestore
 */
export async function saveUserProfileToDb(profile: UserProfile): Promise<void> {
  try {
    const userRef = doc(db, 'users', profile.userId);
    await setDoc(userRef, {
      ...profile,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.warn('Notice saving user profile to Firestore (using local/Cloud SQL sync):', err);
  }
}

/**
 * Fetch user SaaS profile from Firestore
 */
export async function getUserProfileFromDb(userId: string): Promise<UserProfile | null> {
  try {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch (err) {
    console.warn('Notice fetching user profile from Firestore:', err);
    return null;
  }
}

/**
 * Save or update a Service Order in Firestore
 */
export async function saveServiceOrderToDb(order: ServiceOrder): Promise<void> {
  try {
    const orderRef = doc(db, 'service_orders', order.id);
    await setDoc(orderRef, order, { merge: true });
  } catch (err) {
    console.warn('Notice saving service order to Firestore (synced to Cloud SQL):', err);
  }
}

/**
 * Subscribe to real-time service orders updates
 */
export function subscribeToOrders(
  onUpdate: (orders: ServiceOrder[]) => void,
  onError?: (err: Error) => void
) {
  const ordersCollection = collection(db, 'service_orders');
  return onSnapshot(
    ordersCollection,
    (snapshot) => {
      const orders: ServiceOrder[] = [];
      snapshot.forEach((docSnap) => {
        orders.push(docSnap.data() as ServiceOrder);
      });
      // Sort newest first
      orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onUpdate(orders);
    },
    (error) => {
      console.warn('Firestore real-time orders listener error:', error);
      if (onError) onError(error);
    }
  );
}

/**
 * Seed initial sample orders into Firestore if collection is empty
 */
export async function seedInitialOrdersIfEmpty(initialOrders: ServiceOrder[]) {
  try {
    const ordersCol = collection(db, 'service_orders');
    const snap = await getDocs(ordersCol);
    if (snap.empty) {
      console.log('[Firebase] Seeding initial legal cases into Firestore...');
      for (const order of initialOrders) {
        await setDoc(doc(db, 'service_orders', order.id), order);
      }
    }
  } catch (e) {
    console.warn('[Firebase] Notice seeding orders:', e);
  }
}

/**
 * Save notification alert to user subcollection
 */
export async function saveNotificationToDb(userId: string, notification: AppNotification) {
  try {
    const notifRef = doc(db, 'users', userId, 'notifications', notification.id);
    await setDoc(notifRef, notification);
  } catch (e) {
    console.warn('Notice saving notification to DB:', e);
  }
}
