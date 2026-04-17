import 'server-only';

import { FieldValue, Firestore } from 'firebase-admin/firestore';

import { buildUserDocumentBase, UserDocumentProfile } from '@/lib/userDocumentShared';

function hasValue(value: unknown) {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }

  return value !== undefined && value !== null;
}

export async function ensureUserDocumentWithAdmin(
  adminDb: Firestore,
  uid: string,
  profile: UserDocumentProfile
) {
  const userRef = adminDb.collection('users').doc(uid);
  const userSnap = await userRef.get();
  const defaults = buildUserDocumentBase(uid, profile);

  if (!userSnap.exists) {
    await userRef.set({
      ...defaults,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
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
    patch.updatedAt = FieldValue.serverTimestamp();
    await userRef.set(patch, { merge: true });
    return { created: false, repaired: true };
  }

  return { created: false, repaired: false };
}
