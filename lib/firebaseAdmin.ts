import { App, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

function readEnv(name: string) {
  const value = process.env[name];
  return typeof value === 'string' ? value.trim() : '';
}

function getPrivateKey() {
  const key = readEnv('FIREBASE_PRIVATE_KEY');
  if (!key) return '';
  const unwrappedKey =
    key.startsWith('"') && key.endsWith('"')
      ? key.slice(1, -1)
      : key;

  return unwrappedKey.replace(/\\n/g, '\n').trim();
}

function getAdminApp(): App {
  if (getApps().length) {
    return getApps()[0]!;
  }

  const projectId = readEnv('FIREBASE_PROJECT_ID') || readEnv('NEXT_PUBLIC_FIREBASE_PROJECT_ID');
  const clientEmail = readEnv('FIREBASE_CLIENT_EMAIL');
  const privateKey = getPrivateKey();
  const missingVars = [
    !projectId && 'FIREBASE_PROJECT_ID',
    !clientEmail && 'FIREBASE_CLIENT_EMAIL',
    !privateKey && 'FIREBASE_PRIVATE_KEY',
  ].filter(Boolean);

  if (missingVars.length) {
    throw new Error(`Firebase Admin env vars are missing: ${missingVars.join(', ')}`);
  }

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

export function getAdminAuth() {
  return getAuth(getAdminApp());
}

export function getAdminDb() {
  return getFirestore(getAdminApp());
}
