import {
  signInWithPhoneNumber,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
  RecaptchaVerifier,
  ConfirmationResult,
  User as FirebaseUser,
} from 'firebase/auth';
import { firebaseAuth } from './client';

/**
 * Initialize Recaptcha Verifier for Phone OTP
 */
export function setupRecaptcha(containerId: string): RecaptchaVerifier {
  return new RecaptchaVerifier(firebaseAuth, containerId, {
    size: 'invisible',
    callback: () => {
      // reCAPTCHA solved - allow signInWithPhoneNumber
    },
    'expired-callback': () => {
      // Response expired. Ask user to solve reCAPTCHA again.
    },
  });
}

/**
 * Sign In with Phone number (sends OTP)
 */
export async function sendPhoneOtp(
  phoneNumber: string,
  verifier: RecaptchaVerifier
): Promise<ConfirmationResult> {
  // Format Indian numbers if missing country code
  const formattedPhone = phoneNumber.startsWith('+')
    ? phoneNumber
    : `+91${phoneNumber.replace(/\D/g, '')}`;
  return await signInWithPhoneNumber(firebaseAuth, formattedPhone, verifier);
}

/**
 * Sign in with Email and Password
 */
export async function loginWithEmail(email: string, password: string): Promise<FirebaseUser> {
  const cred = await signInWithEmailAndPassword(firebaseAuth, email.trim(), password);
  return cred.user;
}

/**
 * Register new user with Email and Password
 */
export async function registerWithEmail(
  email: string,
  password: string,
  fullName: string
): Promise<FirebaseUser> {
  const cred = await createUserWithEmailAndPassword(firebaseAuth, email.trim(), password);
  if (fullName && cred.user) {
    await updateProfile(cred.user, { displayName: fullName.trim() });
  }
  return cred.user;
}

/**
 * Send password reset email
 */
export async function sendPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(firebaseAuth, email.trim());
}

/**
 * Sign out current Firebase user
 */
export async function logoutFirebaseUser(): Promise<void> {
  await signOut(firebaseAuth);
}

/**
 * Get current verified Firebase ID Token (JWT)
 */
export async function getIdToken(forceRefresh: boolean = false): Promise<string | null> {
  const user = firebaseAuth.currentUser;
  if (!user) return null;
  return await user.getIdToken(forceRefresh);
}
