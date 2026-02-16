import { auth, db } from './firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  User,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { UserProfile } from './types/firestore';
import { getErrorMessage } from './utils/errorMessages';

const googleProvider = new GoogleAuthProvider();

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
    const user = result.user;

    // Check if user profile exists in Firestore
    const profileExists = await hasUserProfile(user.uid);

    return { user, isNewUser: !profileExists };
  } catch (error) {
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
