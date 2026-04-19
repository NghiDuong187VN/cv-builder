/**
 * POST /api/cv/create-from-marketplace
 *
 * Tạo CV mới từ một marketplace template mà buyer đã sở hữu.
 * Flow:
 *  1. Verify auth token
 *  2. Verify buyer owns the marketplace template (template_ownerships collection)
 *  3. Load marketplace template metadata
 *  4. Create CV document with marketplaceTemplateId set
 *  5. Return cvId để redirect sang editor
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

export const runtime = 'nodejs';

function generateSlug(): string {
  return (
    Math.random().toString(36).substring(2, 6) +
    '-' +
    Math.random().toString(36).substring(2, 6)
  );
}

const DEFAULT_SECTIONS = [
  'personalInfo', 'summary', 'experience', 'education',
  'skills', 'projects', 'certificates', 'activities',
];

export async function POST(req: NextRequest) {
  try {
    // ── 1. Auth ──────────────────────────────────────────────────────────────
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.slice(7);

    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();

    let uid: string;
    try {
      const decoded = await adminAuth.verifyIdToken(token);
      uid = decoded.uid;
    } catch {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    // ── 2. Parse body ─────────────────────────────────────────────────────────
    const body = await req.json();
    const { marketplaceTemplateId, title } = body as {
      marketplaceTemplateId?: string;
      title?: string;
    };

    if (!marketplaceTemplateId || typeof marketplaceTemplateId !== 'string') {
      return NextResponse.json({ error: 'marketplaceTemplateId is required' }, { status: 400 });
    }
    const cvTitle = (title ?? '').trim() || 'CV mới';

    // ── 3. Load marketplace template ─────────────────────────────────────────
    const tmplSnap = await adminDb
      .collection('marketplace_templates')
      .doc(marketplaceTemplateId)
      .get();

    if (!tmplSnap.exists) {
      return NextResponse.json({ error: 'Marketplace template not found' }, { status: 404 });
    }
    const tmpl = tmplSnap.data() as {
      status: string;
      name: string;
      layoutType: string;
      sellerId: string;
    };

    if (tmpl.status !== 'approved') {
      return NextResponse.json({ error: 'Template is not available' }, { status: 403 });
    }

    // ── 4. Check ownership ────────────────────────────────────────────────────
    const ownershipQuery = await adminDb
      .collection('template_ownerships')
      .where('userId', '==', uid)
      .where('templateId', '==', marketplaceTemplateId)
      .limit(1)
      .get();

    if (ownershipQuery.empty) {
      return NextResponse.json(
        { error: 'Bạn chưa sở hữu template này. Vui lòng mua trước.' },
        { status: 403 }
      );
    }

    // ── 5. Check user CV quota ─────────────────────────────────────────────
    const userSnap = await adminDb.collection('users').doc(uid).get();
    if (!userSnap.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // ── 6. Create CV document ─────────────────────────────────────────────────
    const cvsRef = adminDb.collection('cvs');
    const newCvDoc = cvsRef.doc();
    const shareSlug = generateSlug();

    const cvData = {
      cvId: newCvDoc.id,
      uid,
      title: cvTitle,
      // For marketplace templates we store a special templateId prefix
      // The editor will detect 'marketplace-' prefix and render accordingly
      templateId: 'modern-01', // default render engine template
      marketplaceTemplateId,  // key field: links to marketplace_templates doc
      isPublic: false,
      shareSlug,
      sharing: { mode: 'public', passcode: '' },
      viewCount: 0,
      downloadCount: 0,
      language: 'vi',
      theme: {
        primaryColor: '#6366f1',
        secondaryColor: '#8b5cf6',
        font: 'Plus Jakarta Sans',
        layout: tmpl.layoutType === '2col' ? '2col' : '1col',
        showAvatar: true,
        accentStyle: 'gradient',
      },
      sections: {
        order: DEFAULT_SECTIONS,
        visibility: Object.fromEntries(DEFAULT_SECTIONS.map((s) => [s, true])),
      },
      content: {
        personalInfo: { fullName: '', jobTitle: '', email: '', phone: '', address: '' },
        summary: '',
        skills: [],
        experience: [],
        education: [],
        projects: [],
        certificates: [],
        activities: [],
        interests: [],
        languages: [],
      },
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    await newCvDoc.set(cvData);

    return NextResponse.json({
      success: true,
      cvId: newCvDoc.id,
      message: `CV "${cvTitle}" đã được tạo với template marketplace!`,
    });
  } catch (err) {
    console.error('[cv/create-from-marketplace]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
