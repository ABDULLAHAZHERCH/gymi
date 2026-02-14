/**
 * Error Message Sanitizer
 * 
 * Maps internal backend error codes to user-friendly messages.
 * Prevents leaking implementation details (e.g., which database,
 * auth provider, or infrastructure is being used).
 */

// Auth error code mappings
const AUTH_ERROR_MAP: Record<string, string> = {
  'auth/email-already-in-use': 'An account with this email already exists',
  'auth/invalid-email': 'Please enter a valid email address',
  'auth/operation-not-allowed': 'This sign-in method is not enabled',
  'auth/weak-password': 'Password is too weak. Use at least 6 characters',
  'auth/user-disabled': 'This account has been disabled. Contact support',
  'auth/user-not-found': 'Invalid email or password',
  'auth/wrong-password': 'Invalid email or password',
  'auth/invalid-credential': 'Invalid email or password',
  'auth/too-many-requests': 'Too many attempts. Please try again later',
  'auth/network-request-failed': 'Network error. Check your connection and try again',
  'auth/popup-closed-by-user': 'Sign-in was cancelled',
  'auth/requires-recent-login': 'Please log in again to complete this action',
  'auth/credential-already-in-use': 'This credential is already linked to another account',
  'auth/invalid-action-code': 'This link has expired or already been used',
  'auth/expired-action-code': 'This link has expired. Please request a new one',
};

// Firestore / general error code mappings
const GENERAL_ERROR_MAP: Record<string, string> = {
  'permission-denied': 'You don\'t have permission to perform this action',
  'not-found': 'The requested data was not found',
  'already-exists': 'This data already exists',
  'resource-exhausted': 'Too many requests. Please try again later',
  'failed-precondition': 'Operation cannot be performed in the current state',
  'aborted': 'Operation was cancelled. Please try again',
  'out-of-range': 'Invalid value provided',
  'unimplemented': 'This feature is not available yet',
  'internal': 'Something went wrong. Please try again',
  'unavailable': 'Service temporarily unavailable. Please try again later',
  'data-loss': 'Data error occurred. Please try again',
  'unauthenticated': 'Please log in to continue',
  'deadline-exceeded': 'Request timed out. Please try again',
  'cancelled': 'Operation was cancelled',
};

/**
 * Extract error code from various error message formats.
 * Handles patterns like:
 * - "Firebase: Error (auth/invalid-credential)."
 * - "FirebaseError: [code]: message"
 * - Direct error codes like "permission-denied"
 */
function extractErrorCode(message: string): string | null {
  // Pattern: "Firebase: Error (auth/some-code)."
  const firebaseAuthMatch = message.match(/\(auth\/([^)]+)\)/);
  if (firebaseAuthMatch) return `auth/${firebaseAuthMatch[1]}`;

  // Pattern: "FirebaseError: [code/something]"
  const firebaseErrorMatch = message.match(/FirebaseError:\s*\[?([^\]:\s]+)/);
  if (firebaseErrorMatch) return firebaseErrorMatch[1];

  // Pattern: direct Firestore error codes
  for (const code of Object.keys(GENERAL_ERROR_MAP)) {
    if (message.toLowerCase().includes(code)) return code;
  }

  return null;
}

/**
 * Sanitize any error into a user-friendly message.
 * 
 * @param error - The caught error (any type)
 * @param fallback - Default message if no mapping is found
 * @returns A clean, user-friendly error message
 */
export function getErrorMessage(error: unknown, fallback: string = 'Something went wrong. Please try again'): string {
  if (!error) return fallback;

  let rawMessage = '';

  if (error instanceof Error) {
    rawMessage = error.message;
  } else if (typeof error === 'string') {
    rawMessage = error;
  } else if (typeof error === 'object' && error !== null) {
    const err = error as Record<string, unknown>;
    // Firebase errors often have a 'code' property
    if (typeof err.code === 'string') {
      const mapped = AUTH_ERROR_MAP[err.code] || GENERAL_ERROR_MAP[err.code];
      if (mapped) return mapped;
    }
    rawMessage = (err.message as string) || '';
  }

  if (!rawMessage) return fallback;

  // Try to extract and map the error code
  const code = extractErrorCode(rawMessage);
  if (code) {
    const mapped = AUTH_ERROR_MAP[code] || GENERAL_ERROR_MAP[code];
    if (mapped) return mapped;
  }

  // If the message doesn't contain any backend identifiers, it might be
  // a custom message we wrote (like "Email and password are required")
  const backendKeywords = ['firebase', 'firestore', 'grpc', 'googleapis', 'gcloud', 'auth/'];
  const isBackendLeak = backendKeywords.some(keyword => 
    rawMessage.toLowerCase().includes(keyword)
  );

  if (isBackendLeak) {
    // Don't expose this to the user
    console.error('[Error]', rawMessage);
    return fallback;
  }

  // Return the message as-is if it appears safe (custom validation messages, etc.)
  return rawMessage;
}
