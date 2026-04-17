import { NextRequest, NextResponse } from 'next/server';

import {
  AiPlan,
  getAllowedAiActions,
  getRemainingFreeAiRequests,
  getUpgradeRequiredActions,
} from '@/lib/ai';
import { getAdminAuth, getAdminDb } from '@/lib/firebaseAdmin';
import { ensureUserDocumentWithAdmin } from '@/lib/userDocumentAdmin';

export const runtime = 'nodejs';

function getBearerToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.slice(7);
}

export async function GET(request: NextRequest) {
  const token = getBearerToken(request);
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const adminAuth = getAdminAuth();
  const adminDb = getAdminDb();
  const decodedToken = await adminAuth.verifyIdToken(token);
  const userRef = adminDb.collection('users').doc(decodedToken.uid);
  let userSnap = await userRef.get();

  if (!userSnap.exists) {
    try {
      await ensureUserDocumentWithAdmin(adminDb, decodedToken.uid, {
        email: decodedToken.email,
        displayName: decodedToken.name,
        photoURL: decodedToken.picture,
      });
      userSnap = await userRef.get();
    } catch {
      return NextResponse.json(
        {
          error: 'USER_DOC_MISSING',
          message: 'Thiếu hồ sơ người dùng trong Firestore.',
        },
        { status: 500 }
      );
    }
  }

  if (!userSnap.exists) {
    return NextResponse.json(
      {
        error: 'USER_DOC_MISSING',
        message: 'Thiếu hồ sơ người dùng trong Firestore.',
      },
      { status: 500 }
    );
  }

  const user = userSnap.data() as { plan?: AiPlan };
  const plan: AiPlan = user.plan === 'premium' ? 'premium' : 'free';
  const usageKey = new Date().toISOString().slice(0, 10);
  const usageSnap = await userRef.collection('aiUsage').doc(usageKey).get();
  const usedToday = (usageSnap.data()?.totalRequests as number | undefined) || 0;
  const remainingToday = plan === 'free' ? getRemainingFreeAiRequests(usedToday) : null;
  const allowedActions = getAllowedAiActions(plan);
  const upgradeRequiredActions = getUpgradeRequiredActions(plan);

  return NextResponse.json({
    plan,
    remainingToday,
    allowedActions,
    ...(upgradeRequiredActions.length > 0 ? { upgradeRequiredActions } : {}),
  });
}
