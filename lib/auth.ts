import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import { User } from './types';

const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle(): Promise<FirebaseUser | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Create or update user doc in Firestore
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      // New user — create document
      const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').split(',').map(e => e.trim());
      const isAdmin = adminEmails.includes(user.email || '');

      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        username: generateUsername(user.displayName || user.email || ''),
        plan: 'free',
        planExpiry: null,
        isAdmin,
        isActive: true,
        settings: { language: 'vi', theme: 'light' },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      // Update last login
      await setDoc(userRef, { updatedAt: serverTimestamp() }, { merge: true });
    }

    return user;
  } catch (error) {
    console.error('Google Sign-In error:', error);
    return null;
  }
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

export async function getUserData(uid: string): Promise<User | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return snap.data() as User;
}

export function onAuthChange(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}

function generateUsername(name: string): string {
  const base = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 15);
  const suffix = Math.floor(Math.random() * 9999);
  return `${base}${suffix}`;
}
