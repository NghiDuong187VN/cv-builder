/**
 * POST /api/seller/templates
 * Seller submits a new marketplace template for admin review
 */
import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminAuth, getAdminDb } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';

function getBearerToken(req: NextRequest) {
  const h = req.headers.get('authorization');
  return h?.startsWith('Bearer ') ? h.slice(7) : null;
}

function generateSlug(name: string, uid: string): string {
  const base = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base}-${suffix}`;
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

    // Verify seller is approved
    const sellerSnap = await adminDb.collection('seller_profiles').doc(uid).get();
    if (!sellerSnap.exists) {
      return NextResponse.json({ error: 'You are not a registered seller' }, { status: 403 });
    }
    const sellerData = sellerSnap.data() as { status?: string; displayName?: string; avatarUrl?: string };
    if (sellerData.status !== 'approved') {
      return NextResponse.json({ error: 'Your seller account is not yet approved' }, { status: 403 });
    }

    const body = await req.json();
    const {
      name, shortDescription, fullDescription, category, style, targetRole,
      tags, layoutType, isAtsFriendly, isPremiumStyle, priceCredits,
      thumbnailUrl, previewImageUrls, templateConfigId,
    } = body as {
      name?: string;
      shortDescription?: string;
      fullDescription?: string;
      category?: string;
      style?: string;
      targetRole?: string;
      tags?: string[];
      layoutType?: string;
      isAtsFriendly?: boolean;
      isPremiumStyle?: boolean;
      priceCredits?: number;
      thumbnailUrl?: string;
      previewImageUrls?: string[];
      templateConfigId?: string;
    };

    // Validation
    if (!name || !shortDescription || !fullDescription || !category || !style || !targetRole) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (!priceCredits || priceCredits < 1) {
      return NextResponse.json({ error: 'priceCredits must be >= 1' }, { status: 400 });
    }
    if (!thumbnailUrl) {
      return NextResponse.json({ error: 'thumbnailUrl is required' }, { status: 400 });
    }

    const slug = generateSlug(name, uid);
    const templateRef = adminDb.collection('marketplace_templates').doc();

    await templateRef.set({
      id: templateRef.id,
      sellerId: uid,
      sellerName: sellerData.displayName ?? '',
      sellerAvatarUrl: sellerData.avatarUrl ?? '',
      slug,
      name,
      shortDescription,
      fullDescription,
      category,
      style,
      targetRole,
      tags: tags ?? [],
      layoutType: layoutType ?? '1col',
      isAtsFriendly: isAtsFriendly ?? false,
      isPremiumStyle: isPremiumStyle ?? false,
      priceCredits,
      thumbnailUrl,
      previewImageUrls: previewImageUrls ?? [],
      templateConfigId: templateConfigId ?? '',
      status: 'pending_review',
      rejectionReason: null,
      totalSalesCount: 0,
      favoritesCount: 0,
      averageRating: 0,
      reviewCount: 0,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      approvedAt: null,
    });

    return NextResponse.json({ success: true, templateId: templateRef.id, slug });
  } catch (err) {
    console.error('[seller/templates] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
