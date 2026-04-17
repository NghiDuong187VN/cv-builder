import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

import { db } from '@/lib/firebase';
import { buildUserDocumentBase, UserDocumentProfile } from '@/lib/userDocumentShared';

function hasValue(value: unknown) {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }

  return value !== undefined && value !== null;
}

export async function ensureUserDocument(uid: string, profile: UserDocumentProfile) {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  const defaults = buildUserDocumentBase(uid, profile);

  if (!userSnap.exists()) {
    await setDoc(userRef, {
      ...defaults,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return { created: true, repaired: false };
  }

  const currentData = userSnap.data() as Record<string, unknown>;
  const patch: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(defaults)) {
    if (!hasValue(currentData[key])) {
      patch[key] = value;
    }
  }

  if (Object.keys(patch).length > 0) {
    patch.updatedAt = serverTimestamp();
    await setDoc(userRef, patch, { merge: true });
    return { created: false, repaired: true };
  }

  return { created: false, repaired: false };
}
