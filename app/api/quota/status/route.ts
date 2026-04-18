import { NextRequest, NextResponse } from 'next/server';

import {
  FREE_AI_DAILY_LIMIT,
  type AiAction,
  getAllowedAiActions,
  getRemainingFreeAiRequests,
  getUpgradeRequiredActions,
} from '@/lib/ai';
import { getAdminAuth, getAdminDb } from '@/lib/firebaseAdmin';
import { ensureUserDocumentWithAdmin } from '@/lib/userDocumentAdmin';
import { FREE_CV_LIMIT, getRemainingFreeCvSlots } from '@/lib/quota';

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

  const user = userSnap.data() as import('@/lib/types').User;
  
  const { FEATURE_COSTS, hasEnoughCredits, isPremium } = await import('@/lib/billing');
  const premiumActive = isPremium(user);
  const plan = premiumActive ? 'premium' : 'free';
  const usageKey = new Date().toISOString().slice(0, 10);
  const [usageSnap, cvsSnap] = await Promise.all([
    userRef.collection('aiUsage').doc(usageKey).get(),
    adminDb.collection('cvs').where('uid', '==', decodedToken.uid).get(),
  ]);

  const usedToday = (usageSnap.data()?.totalRequests as number | undefined) || 0;
  const remainingToday = plan === 'free' ? getRemainingFreeAiRequests(usedToday) : null;
  const aiLimit = plan === 'free' ? FREE_AI_DAILY_LIMIT : null;
  const cvCount = cvsSnap.size;
  const cvLimit = plan === 'free' ? FREE_CV_LIMIT : null;
  const cvRemaining = plan === 'free' ? getRemainingFreeCvSlots(cvCount) : null;
  const baseAllowedActions = new Set<AiAction>(getAllowedAiActions(plan));
  const creditUnlockedActions: AiAction[] = [];

  if (!premiumActive) {
    const canSpendForSummary = hasEnoughCredits(user, FEATURE_COSTS.aiSummary);
    if (remainingToday === 0 && canSpendForSummary) {
      baseAllowedActions.add('generateSummary');
      baseAllowedActions.add('fresherSummary');
      creditUnlockedActions.push('generateSummary', 'fresherSummary');
    }

    if (hasEnoughCredits(user, FEATURE_COSTS.aiRewrite)) {
      baseAllowedActions.add('rewriteExperience');
      baseAllowedActions.add('generateProjectBullets');
      baseAllowedActions.add('convertActivitiesToCvBullets');
      creditUnlockedActions.push('rewriteExperience', 'generateProjectBullets', 'convertActivitiesToCvBullets');
    }

    if (hasEnoughCredits(user, FEATURE_COSTS.atsReview)) {
      baseAllowedActions.add('atsReview');
      baseAllowedActions.add('tailorCvForJob');
      creditUnlockedActions.push('atsReview', 'tailorCvForJob');
    }

    if (hasEnoughCredits(user, FEATURE_COSTS.coverLetter)) {
      baseAllowedActions.add('generateCoverLetter');
      creditUnlockedActions.push('generateCoverLetter');
    }
  }

  const allowedActions = Array.from(baseAllowedActions);
  const upgradeRequiredActions = getUpgradeRequiredActions(plan).filter(
    (action) => !baseAllowedActions.has(action)
  );

  return NextResponse.json({
    plan,
    isPremium: premiumActive,
    credits: user.credits || 0,
    remainingToday,
    usedToday,
    aiLimit,
    allowedActions,
    creditUnlockedActions,
    ...(upgradeRequiredActions.length > 0 ? { upgradeRequiredActions } : {}),
    cvCount,
    cvLimit,
    cvRemaining,
  });
}
