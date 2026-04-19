/**
 * POST /api/marketplace/purchase
 * Server-side purchase flow:
 * 1. Verify auth
 * 2. Validate template (approved, not own)
 * 3. Check credits & ownership
 * 4. Deduct credits (buyer) + set earning (seller) + create order + ownership
 */
import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminAuth, getAdminDb } from '@/lib/firebaseAdmin';
import type { MarketplaceTemplate } from '@/lib/marketplace.types';

export const runtime = 'nodejs';

const PLATFORM_FEE_RATE = 0.15;

function getBearerToken(req: NextRequest) {
  const h = req.headers.get('authorization');
  return h?.startsWith('Bearer ') ? h.slice(7) : null;
}

export async function POST(req: NextRequest) {
  try {
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
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await req.json();
    const { templateId } = body as { templateId?: string };

    if (!templateId) {
      return NextResponse.json({ error: 'templateId is required' }, { status: 400 });
    }

    // Load template
    const templateRef = adminDb.collection('marketplace_templates').doc(templateId);
    const templateSnap = await templateRef.get();
    if (!templateSnap.exists) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }
    const template = templateSnap.data() as MarketplaceTemplate;

    if (template.status !== 'approved') {
      return NextResponse.json({ error: 'Template is not available for purchase' }, { status: 403 });
    }

    if (template.sellerId === uid) {
      return NextResponse.json({ error: 'You cannot buy your own template' }, { status: 403 });
    }

    // Check existing ownership
    const ownershipQuery = await adminDb
      .collection('template_ownerships')
      .where('userId', '==', uid)
      .where('templateId', '==', templateId)
      .limit(1)
      .get();

    if (!ownershipQuery.empty) {
      return NextResponse.json({ error: 'You already own this template' }, { status: 409 });
    }

    // Load buyer's credits
    const userRef = adminDb.collection('users').doc(uid);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const userData = userSnap.data() as { credits?: number; displayName?: string };
    const currentCredits = userData.credits ?? 0;

    if (currentCredits < template.priceCredits) {
      return NextResponse.json(
        { error: `Bạn cần ${template.priceCredits} credits. Hiện có: ${currentCredits} credits.` },
        { status: 402 }
      );
    }

    // Calculate fees
    const priceCredits = template.priceCredits;
    const platformFeeCredits = Math.ceil(priceCredits * PLATFORM_FEE_RATE);
    const sellerEarningCredits = priceCredits - platformFeeCredits;

    // Atomic batch write
    const batch = adminDb.batch();

    // 1. Deduct credits from buyer
    batch.update(userRef, {
      credits: FieldValue.increment(-priceCredits),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // 2. Create order
    const orderRef = adminDb.collection('marketplace_orders').doc();
    batch.set(orderRef, {
      id: orderRef.id,
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

    // 3. Create ownership record
    const ownershipRef = adminDb.collection('template_ownerships').doc();
    batch.set(ownershipRef, {
      id: ownershipRef.id,
      userId: uid,
      templateId,
      orderId: orderRef.id,
      priceCredits,
      createdAt: FieldValue.serverTimestamp(),
    });

    // 4. Create credit transaction (buyer spend)
    const creditTxRef = adminDb.collection('credit_transactions').doc();
    batch.set(creditTxRef, {
      id: creditTxRef.id,
      userId: uid,
      type: 'spend',
      amount: -priceCredits,
      reason: `Mua template: ${template.name}`,
      relatedOrderId: orderRef.id,
      createdAt: FieldValue.serverTimestamp(),
    });

    // 5. Create seller earning transaction
    const earningRef = adminDb.collection('seller_earning_transactions').doc();
    batch.set(earningRef, {
      id: earningRef.id,
      sellerId: template.sellerId,
      orderId: orderRef.id,
      templateId,
      templateName: template.name,
      creditsAmount: sellerEarningCredits,
      status: 'pending',
      createdAt: FieldValue.serverTimestamp(),
    });

    // 6. Update seller profile totals
    const sellerRef = adminDb.collection('seller_profiles').doc(template.sellerId);
    batch.update(sellerRef, {
      totalSalesCount: FieldValue.increment(1),
      totalEarningsCredits: FieldValue.increment(sellerEarningCredits),
      pendingEarningsCredits: FieldValue.increment(sellerEarningCredits),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // 7. Increment template sales count
    batch.update(templateRef, {
      totalSalesCount: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    });

    await batch.commit();

    return NextResponse.json({
      success: true,
      orderId: orderRef.id,
      message: 'Mua template thành công!',
    });
  } catch (err) {
    console.error('[marketplace/purchase] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
