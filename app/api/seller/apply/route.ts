/**
 * POST /api/seller/apply
 * Creates or updates a seller profile (status: pending if new)
 */
import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminAuth, getAdminDb } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';

function getBearerToken(req: NextRequest) {
  const h = req.headers.get('authorization');
  return h?.startsWith('Bearer ') ? h.slice(7) : null;
}

export async function POST(req: NextRequest) {
  try {
    const token = getBearerToken(req);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();

    let uid: string;
    try {
      const decoded = await adminAuth.verifyIdToken(token);
      uid = decoded.uid;
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await req.json();
    const { displayName, bio, website, portfolio } = body as {
      displayName?: string;
      bio?: string;
      website?: string;
      portfolio?: string;
    };

    if (!displayName || !bio) {
      return NextResponse.json({ error: 'displayName and bio are required' }, { status: 400 });
    }

    const sellerRef = adminDb.collection('seller_profiles').doc(uid);
    const existing = await sellerRef.get();

    if (existing.exists) {
      const data = existing.data() as { status?: string };
      if (data.status === 'approved') {
        return NextResponse.json({ error: 'You are already an approved seller' }, { status: 409 });
      }
      // Re-apply after rejection
      await sellerRef.update({
        displayName,
        bio,
        website: website ?? '',
        portfolio: portfolio ?? '',
        status: 'pending',
        rejectionReason: null,
        updatedAt: FieldValue.serverTimestamp(),
      });
    } else {
      // Load user info for avatar
      const userSnap = await adminDb.collection('users').doc(uid).get();
      const userData = userSnap.data() as { photoURL?: string; displayName?: string } | undefined;

      await sellerRef.set({
        uid,
        displayName,
        avatarUrl: userData?.photoURL ?? '',
        bio,
        website: website ?? '',
        portfolio: portfolio ?? '',
        status: 'pending',
        totalSalesCount: 0,
        totalEarningsCredits: 0,
        pendingEarningsCredits: 0,
        availableEarningsCredits: 0,
        paidOutEarningsCredits: 0,
        averageRating: 0,
        reviewCount: 0,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        approvedAt: null,
      });
    }

    return NextResponse.json({ success: true, message: 'Application submitted!' });
  } catch (err) {
    console.error('[seller/apply] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
