import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  confirmPasswordReset,
  verifyPasswordResetCode,
  applyActionCode,
  signInWithPopup,
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
  continueUrl?: string,
): Promise<string> {
  const credential = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
  if (displayName) {
    await updateProfile(credential.user, { displayName });
  }
  // handleCodeInApp: true → le lien pointe directement vers notre propre page
  // /verify-email (avec oobCode en query param), sans jamais passer par la
  // page hébergée par défaut de Firebase (*.firebaseapp.com/__/auth/action).
  // Cette dernière refuse de s'exécuter si elle est chargée dans un iframe —
  // ce que font de nombreuses passerelles email d'entreprise (scan de liens
  // avant affichage), d'où des inscriptions bloquées avec des adresses pro.
  const settings = continueUrl ? { url: continueUrl, handleCodeInApp: true } : undefined;
  await sendEmailVerification(credential.user, settings);
  return credential.user.getIdToken();
}

export async function sendPasswordReset(email: string, continueUrl?: string): Promise<void> {
  const settings = continueUrl ? { url: continueUrl, handleCodeInApp: true } : undefined;
  await sendPasswordResetEmail(getFirebaseAuth(), email, settings);
}

export async function verifyResetCode(oobCode: string): Promise<string> {
  return verifyPasswordResetCode(getFirebaseAuth(), oobCode);
}

export async function confirmPasswordResetWithCode(oobCode: string, newPassword: string): Promise<void> {
  await confirmPasswordReset(getFirebaseAuth(), oobCode, newPassword);
}

export async function applyEmailVerificationCode(oobCode: string): Promise<void> {
  await applyActionCode(getFirebaseAuth(), oobCode);
}

export async function resendVerificationEmail(email: string, password: string, continueUrl?: string): Promise<void> {
  const credential = await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
  const settings = continueUrl ? { url: continueUrl, handleCodeInApp: true } : undefined;
  await sendEmailVerification(credential.user, settings);
}

// Opens a Google popup and returns the Firebase ID token
export async function signInWithGoogle(): Promise<string> {
  const result = await signInWithPopup(getFirebaseAuth(), googleProvider);
  return result.user.getIdToken();
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
