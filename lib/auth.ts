import { auth, db } from './firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  User,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { UserProfile } from './types/firestore';
import { getErrorMessage } from './utils/errorMessages';
import { cachedFetch, cacheInvalidate } from './cache';

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

const GOOGLE_REDIRECT_PENDING_KEY = 'gymi.googleRedirectPending';

export class GoogleOAuthBootstrapError extends Error {
  readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'GoogleOAuthBootstrapError';
    this.cause = cause;
  }
}

function getErrorCode(error: unknown): string | null {
  if (typeof error === 'object' && error !== null) {
    const code = (error as Record<string, unknown>).code;
    if (typeof code === 'string') return code;
  }

  return null;
}

function getRawErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (typeof error === 'object' && error !== null) {
    const message = (error as Record<string, unknown>).message;
    return typeof message === 'string' ? message : '';
  }

  return '';
}

function isGoogleBootstrapFailure(error: unknown): boolean {
  const code = getErrorCode(error);
  const message = getRawErrorMessage(error).toLowerCase();

  return (
    code === 'auth/internal-error' ||
    code === 'auth/network-request-failed' ||
    code === 'auth/popup-blocked' ||
    message.includes('apis.google.com') ||
    message.includes('err_name_not_resolved') ||
    message.includes('network error')
  );
}

function markGoogleRedirectPending() {
  if (typeof window !== 'undefined') {
    window.sessionStorage.setItem(GOOGLE_REDIRECT_PENDING_KEY, '1');
  }
}

function clearGoogleRedirectPending() {
  if (typeof window !== 'undefined') {
    window.sessionStorage.removeItem(GOOGLE_REDIRECT_PENDING_KEY);
  }
}

export function hasPendingGoogleRedirect(): boolean {
  if (typeof window === 'undefined') return false;
  return window.sessionStorage.getItem(GOOGLE_REDIRECT_PENDING_KEY) === '1';
}

async function buildGoogleSignInResult(user: User): Promise<{ user: User; isNewUser: boolean }> {
  const profileExists = await hasUserProfile(user.uid);
  return { user, isNewUser: !profileExists };
}

/**
 * Auth Service: Handle user authentication
 */

export async function registerUser(
  email: string,
  password: string,
  name: string
): Promise<User> {
  try {
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update display name
    await updateProfile(user, { displayName: name });

    return user;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Registration failed'));
  }
}

export async function loginUser(email: string, password: string): Promise<User> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Login failed'));
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Logout failed'));
  }
}

/**
 * Google Sign-In / Sign-Up
 * Returns the Firebase user and whether they are a new user (needs onboarding).
 */
export async function signInWithGoogle(): Promise<{ user: User; isNewUser: boolean }> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return buildGoogleSignInResult(result.user);
  } catch (error) {
    if (isGoogleBootstrapFailure(error)) {
      throw new GoogleOAuthBootstrapError(
        'Google sign-in could not load in this browser session.',
        error
      );
    }

    throw new Error(getErrorMessage(error, 'Google sign-in failed'));
  }
}

export async function startGoogleRedirectSignIn(): Promise<void> {
  try {
    markGoogleRedirectPending();
    await signInWithRedirect(auth, googleProvider);
  } catch (error) {
    clearGoogleRedirectPending();
    throw new Error(getErrorMessage(error, 'Google sign-in failed'));
  }
}

export async function finishGoogleRedirectSignIn(): Promise<{ user: User; isNewUser: boolean } | null> {
  if (!hasPendingGoogleRedirect()) return null;

  try {
    const result = await getRedirectResult(auth);
    clearGoogleRedirectPending();
    return result ? buildGoogleSignInResult(result.user) : null;
  } catch (error) {
    clearGoogleRedirectPending();

    if (isGoogleBootstrapFailure(error)) {
      throw new Error(
        'Google sign-in could not reach Google services. Check your internet or DNS settings, then try again.'
      );
    }

    throw new Error(getErrorMessage(error, 'Google sign-in failed'));
  }
}

/**
 * User Profile Service: Manage user data in Firestore
 */

export async function createUserProfile(
  uid: string,
  profile: Omit<UserProfile, 'createdAt' | 'updatedAt'>
): Promise<void> {
  try {
    await setDoc(doc(db, 'users', uid), {
      ...profile,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to create profile'));
  }
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  return cachedFetch(
    `profile:${uid}`,
    async () => {
      try {
        const docRef = doc(db, 'users', uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          return docSnap.data() as UserProfile;
        }
        return null;
      } catch (error) {
        throw new Error(getErrorMessage(error, 'Failed to load profile'));
      }
    },
    10 * 60 * 1000 // 10-minute TTL — profile rarely changes
  );
}

export async function updateUserProfile(
  uid: string,
  updates: Partial<UserProfile>
): Promise<void> {
  try {
    const docRef = doc(db, 'users', uid);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date(),
    });
    // Invalidate cached profile and dashboard stats
    cacheInvalidate(`profile:${uid}`, `stats:`, `dashboard:`);
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to update profile'));
  }
}

/**
 * Check if user has completed onboarding
 */
export async function hasUserProfile(uid: string): Promise<boolean> {
  try {
    const profile = await getUserProfile(uid);
    return profile !== null;
  } catch (error) {
    return false;
  }
}
