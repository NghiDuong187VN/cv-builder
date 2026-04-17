import { NextResponse } from 'next/server';

import { EnvValidationError, getGeminiApiKey } from '@/lib/env/server';
import { getAdminApp, getAdminDb } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';

type HealthChecks = {
  geminiKey: boolean;
  firebaseAdmin: boolean;
  firestore: boolean;
};

function buildFailureMessage(messages: string[]) {
  if (messages.length === 0) {
    return undefined;
  }

  if (process.env.NODE_ENV === 'production') {
    return 'AI backend health check failed.';
  }

  return messages.join(' | ');
}

export async function GET() {
  const checks: HealthChecks = {
    geminiKey: false,
    firebaseAdmin: false,
    firestore: false,
  };
  const failures: string[] = [];

  try {
    getGeminiApiKey();
    checks.geminiKey = true;
  } catch (error) {
    if (error instanceof EnvValidationError) {
      failures.push(error.message);
    } else {
      failures.push('Gemini API key check failed.');
    }
  }

  try {
    getAdminApp();
    checks.firebaseAdmin = true;
  } catch (error) {
    if (error instanceof EnvValidationError) {
      failures.push(error.message);
    } else {
      failures.push('Firebase Admin initialization failed.');
    }
  }

  if (checks.firebaseAdmin) {
    try {
      await getAdminDb().collection('_health').limit(1).get();
      checks.firestore = true;
    } catch {
      failures.push('Firestore read check failed.');
    }
  }

  const ok = Object.values(checks).every(Boolean);
  const message = buildFailureMessage(failures);

  return NextResponse.json(
    {
      ok,
      checks,
      ...(message ? { message } : {}),
    },
    { status: ok ? 200 : 503 }
  );
}
