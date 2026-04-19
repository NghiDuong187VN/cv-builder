/**
 * POST /api/marketplace/review
 *
 * BUG-2 FIX: Review submission moved server-side with ownership check.
 * Only users who have purchased the template can submit a review.
 * Prevents duplicate reviews from same user.
 */
import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminAuth, getAdminDb } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';

function getBearerToken(req: NextRequest): string | null {
  const h = req.headers.get('authorization');
  return h?.startsWith('Bearer ') ? h.slice(7) : null;
}

export async function POST(req: NextRequest) {
  try {
    // ── 1. Auth ──────────────────────────────────────────────────────────────
    const token = getBearerToken(req);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();

    let uid: string;
    let userName: string;
    let userAvatarUrl: string;

    try {
      const decoded = await adminAuth.verifyIdToken(token);
      uid = decoded.uid;
      userName = decoded.name ?? 'Anonymous';
      userAvatarUrl = decoded.picture ?? '';
    } catch {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    // ── 2. Parse & validate body ─────────────────────────────────────────────
    const body = await req.json();
    const { templateId, rating, comment } = body as {
      templateId?: string;
      rating?: number;
      comment?: string;
    };

    if (!templateId || typeof templateId !== 'string') {
      return NextResponse.json({ error: 'templateId is required' }, { status: 400 });
    }
    if (!rating || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'rating must be an integer between 1 and 5' }, { status: 400 });
    }
    if (!comment || typeof comment !== 'string' || comment.trim().length < 5) {
      return NextResponse.json({ error: 'comment must be at least 5 characters' }, { status: 400 });
    }
    if (comment.length > 1000) {
      return NextResponse.json({ error: 'comment must be under 1000 characters' }, { status: 400 });
    }

    // ── 3. Check template exists ─────────────────────────────────────────────
    const templateSnap = await adminDb.collection('marketplace_templates').doc(templateId).get();
    if (!templateSnap.exists) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // ── 4. Check ownership — BUG-2 FIX ──────────────────────────────────────
    const ownershipSnap = await adminDb
      .collection('template_ownerships')
      .where('userId', '==', uid)
      .where('templateId', '==', templateId)
      .limit(1)
      .get();

    if (ownershipSnap.empty) {
      return NextResponse.json(
        { error: 'Bạn phải mua template trước khi đánh giá' },
        { status: 403 }
      );
    }

    // ── 5. Check duplicate review ────────────────────────────────────────────
    const existingReview = await adminDb
      .collection('template_reviews')
      .where('userId', '==', uid)
      .where('templateId', '==', templateId)
      .limit(1)
      .get();

    if (!existingReview.empty) {
      return NextResponse.json(
        { error: 'Bạn đã đánh giá template này rồi' },
        { status: 409 }
      );
    }

    // ── 6. Create review + update rolling average (in transaction) ───────────
    const templateRef = adminDb.collection('marketplace_templates').doc(templateId);

    await adminDb.runTransaction(async (tx) => {
      // Re-read template inside tx for accurate count
      const tSnap = await tx.get(templateRef);
      const t = tSnap.data() as { reviewCount?: number; averageRating?: number };
      const oldCount = t.reviewCount ?? 0;
      const oldAvg = t.averageRating ?? 0;
      const newCount = oldCount + 1;
      const newAvg = parseFloat(((oldAvg * oldCount + rating) / newCount).toFixed(2));

      const reviewRef = adminDb.collection('template_reviews').doc();
      tx.set(reviewRef, {
        id: reviewRef.id,
        templateId,
        userId: uid,
        userName,
        userAvatarUrl,
        rating,
        comment: comment.trim(),
        createdAt: FieldValue.serverTimestamp(),
      });

      tx.update(templateRef, {
        reviewCount: newCount,
        averageRating: newAvg,
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[marketplace/review] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
