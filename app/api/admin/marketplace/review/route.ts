/**
 * POST /api/admin/marketplace/review
 * Admin approves or rejects a marketplace template
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

    // Admin check
    const userSnap = await adminDb.collection('users').doc(uid).get();
    if (!userSnap.exists || !userSnap.data()?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { templateId, action, rejectionReason } = body as {
      templateId?: string;
      action?: 'approve' | 'reject' | 'suspend';
      rejectionReason?: string;
    };

    if (!templateId || !action) {
      return NextResponse.json({ error: 'templateId and action are required' }, { status: 400 });
    }

    if (action === 'reject' && !rejectionReason) {
      return NextResponse.json({ error: 'rejectionReason is required when rejecting' }, { status: 400 });
    }

    const templateRef = adminDb.collection('marketplace_templates').doc(templateId);
    const templateSnap = await templateRef.get();
    if (!templateSnap.exists) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (action === 'approve') {
      updateData.status = 'approved';
      updateData.approvedAt = FieldValue.serverTimestamp();
      updateData.rejectionReason = null;
    } else if (action === 'reject') {
      updateData.status = 'rejected';
      updateData.rejectionReason = rejectionReason;
    } else if (action === 'suspend') {
      updateData.status = 'suspended';
    }

    await templateRef.update(updateData);

    return NextResponse.json({ success: true, action });
  } catch (err) {
    console.error('[admin/marketplace/review] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/marketplace/seller-review
 * Admin approves or rejects a seller application
 */
export async function PUT(req: NextRequest) {
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

    const userSnap = await adminDb.collection('users').doc(uid).get();
    if (!userSnap.exists || !userSnap.data()?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { sellerId, action, rejectionReason } = body as {
      sellerId?: string;
      action?: 'approve' | 'reject';
      rejectionReason?: string;
    };

    if (!sellerId || !action) {
      return NextResponse.json({ error: 'sellerId and action are required' }, { status: 400 });
    }

    const sellerRef = adminDb.collection('seller_profiles').doc(sellerId);
    const updateData: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };

    if (action === 'approve') {
      updateData.status = 'approved';
      updateData.approvedAt = FieldValue.serverTimestamp();
    } else {
      updateData.status = 'rejected';
      updateData.rejectionReason = rejectionReason ?? 'Không đáp ứng yêu cầu.';
    }

    await sellerRef.update(updateData);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[admin/marketplace/review PUT] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
