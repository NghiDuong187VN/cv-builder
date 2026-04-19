/**
 * POST /api/marketplace/purchase
 *
 * BUG-1 FIX: Toàn bộ purchase flow chạy trong adminDb.runTransaction()
 * để đảm bảo read-check-write là atomic — không có race condition credits âm.
 *
 * Flow:
 * 1. Verify Firebase ID token
 * 2. Validate input
 * 3. runTransaction():
 *    a. Load & validate template (approved, not own)
 *    b. Load & check ownership (không mua lại)
 *    c. Load user, check & deduct credits (atomic)
 *    d. Write: order, ownership, credit_tx, earning_tx
 *    e. Increment: seller totals, template salesCount
 */
import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminAuth, getAdminDb } from '@/lib/firebaseAdmin';
import type { MarketplaceTemplate } from '@/lib/marketplace.types';

export const runtime = 'nodejs';

const PLATFORM_FEE_RATE = 0.15;

function getBearerToken(req: NextRequest): string | null {
  const h = req.headers.get('authorization');
  return h?.startsWith('Bearer ') ? h.slice(7) : null;
}

export async function POST(req: NextRequest) {
  try {
    // ── 1. Auth ─────────────────────────────────────────────────────────────
    const token = getBearerToken(req);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();

    let uid: string;
    try {
      const decoded = await adminAuth.verifyIdToken(token);
      uid = decoded.uid;
    } catch {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    // ── 2. Input validation ──────────────────────────────────────────────────
    const body = await req.json();
    const { templateId } = body as { templateId?: string };

    if (!templateId || typeof templateId !== 'string' || templateId.trim() === '') {
      return NextResponse.json({ error: 'templateId is required' }, { status: 400 });
    }

    // ── 3. Prepare document refs (outside transaction — refs are cheap) ──────
    const templateRef = adminDb.collection('marketplace_templates').doc(templateId);
    const userRef = adminDb.collection('users').doc(uid);

    // ── 4. runTransaction() — fully atomic ───────────────────────────────────
    let orderId: string;

    try {
      orderId = await adminDb.runTransaction(async (tx) => {
        // a. Load template
        const templateSnap = await tx.get(templateRef);
        if (!templateSnap.exists) {
          throw Object.assign(new Error('Template not found'), { statusCode: 404 });
        }
        const template = templateSnap.data() as MarketplaceTemplate;

        // b. Validate template state
        if (template.status !== 'approved') {
          throw Object.assign(
            new Error('Template is not available for purchase'),
            { statusCode: 403 }
          );
        }

        // c. Seller cannot buy own template
        if (template.sellerId === uid) {
          throw Object.assign(
            new Error('You cannot buy your own template'),
            { statusCode: 403 }
          );
        }

        // d. Load buyer user
        const userSnap = await tx.get(userRef);
        if (!userSnap.exists) {
          throw Object.assign(new Error('User not found'), { statusCode: 404 });
        }
        const userData = userSnap.data() as { credits?: number };
        const currentCredits = userData.credits ?? 0;

        // e. Check existing ownership (query inside transaction)
        const ownershipSnap = await adminDb
          .collection('template_ownerships')
          .where('userId', '==', uid)
          .where('templateId', '==', templateId)
          .limit(1)
          .get();

        if (!ownershipSnap.empty) {
          throw Object.assign(
            new Error('You already own this template'),
            { statusCode: 409 }
          );
        }

        // f. Check credits — inside transaction so no TOCTOU race
        const priceCredits = template.priceCredits;
        if (currentCredits < priceCredits) {
          throw Object.assign(
            new Error(
              `Không đủ credits. Cần ${priceCredits}, hiện có ${currentCredits}.`
            ),
            { statusCode: 402 }
          );
        }

        // g. Calculate fees
        const platformFeeCredits = Math.ceil(priceCredits * PLATFORM_FEE_RATE);
        const sellerEarningCredits = priceCredits - platformFeeCredits;

        // h. Prepare new document refs
        const newOrderRef = adminDb.collection('marketplace_orders').doc();
        const newOwnershipRef = adminDb.collection('template_ownerships').doc();
        const newCreditTxRef = adminDb.collection('credit_transactions').doc();
        const newEarningRef = adminDb.collection('seller_earning_transactions').doc();
        const sellerRef = adminDb.collection('seller_profiles').doc(template.sellerId);

        // i. Deduct credits from buyer (atomic — inside transaction read)
        tx.update(userRef, {
          credits: FieldValue.increment(-priceCredits),
          updatedAt: FieldValue.serverTimestamp(),
        });

        // j. Create order
        tx.set(newOrderRef, {
          id: newOrderRef.id,
          buyerId: uid,
          sellerId: template.sellerId,
          templateId,
          templateName: template.name,
          templateSlug: template.slug,
          priceCredits,
          platformFeeCredits,
          sellerEarningCredits,
          status: 'completed',
          createdAt: FieldValue.serverTimestamp(),
          completedAt: FieldValue.serverTimestamp(),
        });

        // k. Create ownership record
        tx.set(newOwnershipRef, {
          id: newOwnershipRef.id,
          userId: uid,
          templateId,
          templateName: template.name,
          orderId: newOrderRef.id,
          priceCredits,
          createdAt: FieldValue.serverTimestamp(),
        });

        // l. Credit transaction log (buyer spend)
        tx.set(newCreditTxRef, {
          id: newCreditTxRef.id,
          userId: uid,
          type: 'spend',
          amount: -priceCredits,
          reason: `Mua template: ${template.name}`,
          relatedOrderId: newOrderRef.id,
          createdAt: FieldValue.serverTimestamp(),
        });

        // m. Seller earning transaction
        tx.set(newEarningRef, {
          id: newEarningRef.id,
          sellerId: template.sellerId,
          orderId: newOrderRef.id,
          templateId,
          templateName: template.name,
          creditsAmount: sellerEarningCredits,
          status: 'pending',
          createdAt: FieldValue.serverTimestamp(),
        });

        // n. Update seller profile totals
        tx.update(sellerRef, {
          totalSalesCount: FieldValue.increment(1),
          totalEarningsCredits: FieldValue.increment(sellerEarningCredits),
          pendingEarningsCredits: FieldValue.increment(sellerEarningCredits),
          updatedAt: FieldValue.serverTimestamp(),
        });

        // o. Increment template sales count
        tx.update(templateRef, {
          totalSalesCount: FieldValue.increment(1),
          updatedAt: FieldValue.serverTimestamp(),
        });

        return newOrderRef.id;
      });
    } catch (txErr) {
      const err = txErr as Error & { statusCode?: number };
      const status = err.statusCode ?? 500;
      const message = status < 500 ? err.message : 'Internal server error';
      console.error('[marketplace/purchase] tx error:', err.message);
      return NextResponse.json({ error: message }, { status });
    }

    return NextResponse.json({
      success: true,
      orderId,
      message: 'Mua template thành công!',
    });
  } catch (err) {
    console.error('[marketplace/purchase] outer error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
