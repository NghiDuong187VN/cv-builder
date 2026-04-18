import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebaseAdmin';
import { isPremium, hasEnoughCredits, FEATURE_COSTS } from '@/lib/billing';
import { spendCredits } from '@/lib/billingAdmin';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const token = authHeader.slice(7);
    const decodedToken = await getAdminAuth().verifyIdToken(token);
    const uid = decodedToken.uid;
    const cvId = params.id;
    
    const adminDb = getAdminDb();
    const userSnap = await adminDb.collection('users').doc(uid).get();
    if (!userSnap.exists) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    const user = userSnap.data() as import('@/lib/types').User;
    
    const cvRef = adminDb.collection('cvs').doc(cvId);
    const cvSnap = await cvRef.get();
    if (!cvSnap.exists) return NextResponse.json({ error: 'CV not found' }, { status: 404 });
    const cvData = cvSnap.data();
    
    if (cvData?.uid !== uid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Check if they need to pay
    const premiumActive = isPremium(user);
    if (premiumActive || cvData?.watermarkRemoved) {
      return NextResponse.json({ success: true, message: 'Already premium or watermark already removed' });
    }
    
    if (!hasEnoughCredits(user, FEATURE_COSTS.exportPremiumPdf)) {
      return NextResponse.json({
        error: 'Not enough credits',
        message: 'Bạn cần nâng cấp Premium hoặc nạp thêm credit để xóa watermark.'
      }, { status: 402 });
    }
    
    // Deduct credits
    await spendCredits(uid, FEATURE_COSTS.exportPremiumPdf, `Mua lượt xóa Watermark cho CV ${cvData?.title || cvId}`);
    
    // Update CV
    await cvRef.update({
      watermarkRemoved: true,
      updatedAt: new Date(),
    });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Buy Export error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
