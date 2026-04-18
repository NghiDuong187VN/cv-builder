import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { TEMPLATES } from '@/lib/firestore';
import { isPremium, hasEnoughCredits, FEATURE_COSTS } from '@/lib/billing';
import { spendCredits } from '@/lib/billingAdmin';

function generateSlug() {
  return Math.random().toString(36).substring(2, 6) + '-' + Math.random().toString(36).substring(2, 6);
}

const DEFAULT_SECTIONS = [
  'personalInfo', 'summary', 'experience', 'education', 'skills', 'projects', 'certificates', 'activities'
];
const DEFAULT_PERSONAL_INFO = { fullName: '', jobTitle: '', email: '', phone: '', address: '' };

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const token = authHeader.slice(7);
    const decodedToken = await getAdminAuth().verifyIdToken(token);
    const uid = decodedToken.uid;
    
    const body = await req.json();
    const { title, templateId, theme, language } = body;
    
    if (!title || !templateId) {
      return NextResponse.json({ error: 'Missing title or templateId' }, { status: 400 });
    }
    
    const adminDb = getAdminDb();
    const userSnap = await adminDb.collection('users').doc(uid).get();
    if (!userSnap.exists) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    
    const user = userSnap.data() as import('@/lib/types').User;
    
    // Validate Template Tier
    const template = TEMPLATES.find(t => t.templateId === templateId);
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }
    
    if (template.tier === 'premium') {
      const premiumActive = isPremium(user);
      if (!premiumActive) {
        if (!hasEnoughCredits(user, FEATURE_COSTS.createPremiumCv)) {
          return NextResponse.json({
            error: 'Not enough credits',
            message: 'Bạn cần nâng cấp Premium hoặc nạp thêm credit để sử dụng mẫu CV này.'
          }, { status: 402 });
        }
        
        // Deduct credits
        await spendCredits(uid, FEATURE_COSTS.createPremiumCv, `Quẹt ${FEATURE_COSTS.createPremiumCv} credit dùng Mẫu CV Premium: ${template.nameVi}`);
      }
    }
    
    // Create CV
    const cvsRef = adminDb.collection('cvs');
    const newCvDoc = cvsRef.doc();
    const shareSlug = generateSlug();
    
    const cvData = {
      cvId: newCvDoc.id,
      uid,
      title,
      templateId,
      isPublic: false,
      shareSlug,
      sharing: { mode: 'public', passcode: '' },
      viewCount: 0,
      downloadCount: 0,
      language: language || 'vi',
      theme,
      sections: {
        order: DEFAULT_SECTIONS,
        visibility: Object.fromEntries(DEFAULT_SECTIONS.map(s => [s, true])),
      },
      content: {
        personalInfo: DEFAULT_PERSONAL_INFO,
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
    
    return NextResponse.json({ success: true, cvId: newCvDoc.id });
  } catch (error: any) {
    console.error('Create CV error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
