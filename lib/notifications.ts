import { db } from './firebase';
import {
  collection,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  limit,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { Notification, NotificationType } from './types/firestore';
import { getErrorMessage } from './utils/errorMessages';
import { cachedFetch, cacheInvalidate } from './cache';

/**
 * Notifications Service Layer
 * Handles CRUD operations for in-app notifications
 */

// ============================================================
// HELPERS
// ============================================================

/** Convert Firestore doc to Notification */
const docToNotification = (id: string, data: any): Notification => {
  const parseDate = (v: any): Date => {
    if (!v) return new Date();
    if (typeof v.toDate === 'function') return v.toDate();
    if (v instanceof Date) return v;
    return new Date(v);
  };

  return {
    id,
    type: data.type as NotificationType,
    title: data.title ?? '',
    message: data.message ?? '',
    icon: data.icon ?? '🔔',
    read: data.read ?? false,
    linkTo: data.linkTo ?? undefined,
    createdAt: parseDate(data.createdAt),
    readAt: data.readAt ? parseDate(data.readAt) : undefined,
  };
};

// ============================================================
// CRUD
// ============================================================

/**
 * Create a new notification
 */
export async function createNotification(
  uid: string,
  data: Omit<Notification, 'id' | 'createdAt' | 'readAt'>
): Promise<string> {
  try {
    const ref = collection(db, 'users', uid, 'notifications');
    const docRef = await addDoc(ref, {
      ...data,
      read: false,
      createdAt: Timestamp.now(),
    });
    cacheInvalidate(`notifications:${uid}`, `unread:${uid}`);
    return docRef.id;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to create notification'));
  }
}

/**
 * Get notifications (newest first, limited)
 */
export async function getNotifications(
  uid: string,
  count: number = 20
): Promise<Notification[]> {
  return cachedFetch(`notifications:${uid}:${count}`, async () => {
    try {
      const ref = collection(db, 'users', uid, 'notifications');
      const q = query(ref, orderBy('createdAt', 'desc'), limit(count));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => docToNotification(d.id, d.data()));
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to fetch notifications'));
    }
  });
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(uid: string): Promise<number> {
  return cachedFetch(`unread:${uid}`, async () => {
    try {
      const ref = collection(db, 'users', uid, 'notifications');
      const q = query(ref, where('read', '==', false));
      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }, 60 * 1000);
}

/**
 * Mark a single notification as read
 */
export async function markAsRead(
  uid: string,
  notificationId: string
): Promise<void> {
  try {
    const docRef = doc(db, 'users', uid, 'notifications', notificationId);
    await updateDoc(docRef, {
      read: true,
      readAt: Timestamp.now(),
    });
    cacheInvalidate(`notifications:${uid}`, `unread:${uid}`);
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to mark notification as read'));
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(uid: string): Promise<void> {
  try {
    const ref = collection(db, 'users', uid, 'notifications');
    const q = query(ref, where('read', '==', false));
    const snapshot = await getDocs(q);

    if (snapshot.empty) return;

    const batch = writeBatch(db);
    const now = Timestamp.now();
    snapshot.docs.forEach((d) => {
      batch.update(d.ref, { read: true, readAt: now });
    });
    await batch.commit();
    cacheInvalidate(`notifications:${uid}`, `unread:${uid}`);
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to mark all as read'));
  }
}

/**
 * Delete a single notification
 */
export async function deleteNotification(
  uid: string,
  notificationId: string
): Promise<void> {
  try {
    const docRef = doc(db, 'users', uid, 'notifications', notificationId);
    await deleteDoc(docRef);
    cacheInvalidate(`notifications:${uid}`, `unread:${uid}`);
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to delete notification'));
  }
}

/**
 * Delete notifications older than N days
 */
export async function deleteOldNotifications(
  uid: string,
  daysOld: number = 30
): Promise<number> {
  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysOld);

    const ref = collection(db, 'users', uid, 'notifications');
    const q = query(ref, where('createdAt', '<', Timestamp.fromDate(cutoff)));
    const snapshot = await getDocs(q);

    if (snapshot.empty) return 0;

    const batch = writeBatch(db);
    snapshot.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    cacheInvalidate(`notifications:${uid}`, `unread:${uid}`);
    return snapshot.size;
  } catch (error) {
    console.error('Error cleaning old notifications:', error);
    return 0;
  }
}
