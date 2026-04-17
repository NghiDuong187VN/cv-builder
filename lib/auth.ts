import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

import { auth, db } from './firebase';
import { User } from './types';
import { ensureUserDocument } from './userDocument';

const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle(): Promise<FirebaseUser | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    await ensureUserDocument(user.uid, {
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
    });

    await setDoc(doc(db, 'users', user.uid), { updatedAt: serverTimestamp() }, { merge: true });

    return user;
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    console.error('Google Sign-In error:', err.code, err.message);

    if (err.code === 'auth/popup-blocked') {
      throw new Error('Popup bị trình duyệt chặn. Vui lòng cho phép popup cho trang này.');
    } else if (err.code === 'auth/popup-closed-by-user') {
      throw new Error('Bạn đã đóng cửa sổ đăng nhập. Vui lòng thử lại.');
    } else if (err.code === 'auth/unauthorized-domain') {
      throw new Error('Domain chưa được phép. Hãy thêm domain vào Firebase Authorized Domains.');
    } else if (err.code === 'auth/cancelled-popup-request') {
      return null;
    }

    throw new Error(err.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
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
