import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile,
  type Auth,
  type User,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
};

const GOOGLE_REDIRECT_KEY = 'nexusblog_google_redirect';

// Lazy init — only called in the browser, avoids SSR issues
function getFirebaseAuth(): Auth {
  if (typeof window === 'undefined') throw new Error('Firebase auth is browser-only');
  if (getApps().length === 0) initializeApp(firebaseConfig);
  return getAuth(getApps()[0]);
}

// Keep a cached reference for external consumers (e.g. onAuthStateChanged)
export const auth: Auth = typeof window !== 'undefined' ? getFirebaseAuth() : (null as unknown as Auth);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export async function signInWithEmail(email: string, password: string): Promise<string> {
  const credential = await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
  return credential.user.getIdToken();
}

export async function registerWithEmail(
  email: string,
  password: string,
  displayName?: string,
): Promise<string> {
  const credential = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
  if (displayName) {
    await updateProfile(credential.user, { displayName });
  }
  await sendEmailVerification(credential.user);
  return credential.user.getIdToken();
}

export async function sendPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(getFirebaseAuth(), email);
}

// Marks a redirect as pending, then navigates to Google
export async function signInWithGoogle(): Promise<void> {
  sessionStorage.setItem(GOOGLE_REDIRECT_KEY, '1');
  await signInWithRedirect(getFirebaseAuth(), googleProvider);
}

// Only calls getRedirectResult when we know a Google redirect was triggered —
// avoids the unnecessary network call that caused auth/network-request-failed on every page load
export async function getGoogleRedirectResult(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  const isPending = sessionStorage.getItem(GOOGLE_REDIRECT_KEY);
  if (!isPending) return null;

  sessionStorage.removeItem(GOOGLE_REDIRECT_KEY);
  try {
    const result = await getRedirectResult(getFirebaseAuth());
    if (!result) return null;
    return result.user.getIdToken();
  } catch (err) {
    console.warn('[Firebase] getRedirectResult failed:', err);
    return null;
  }
}

export async function firebaseSignOut(): Promise<void> {
  await signOut(getFirebaseAuth());
}

export function onFirebaseAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(getFirebaseAuth(), callback);
}

export async function getFirebaseToken(): Promise<string | null> {
  const user = getFirebaseAuth().currentUser;
  if (!user) return null;
  return user.getIdToken();
}
