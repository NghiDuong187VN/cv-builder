import { NextResponse, NextRequest } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { activatePremium, addCredits } from '@/lib/billingAdmin';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue } from 'firebase-admin/firestore';

function getBearerToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.slice(7);
}

export async function POST(req: NextRequest) {
  try {
    const token = getBearerToken(req);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    // In here getAuth doesn't verify Bearer if using session cookies, but this token is Bearer from frontend firebase.
    // Let's use verifyIdToken:
    const decodedToken = await getAuth().verifyIdToken(token).catch(() => null);
    if (!decodedToken) return NextResponse.json({ error: 'Unauthorized token' }, { status: 401 });

    const uid = decodedToken.uid;
    const body = await req.json();
    const { type, amount, planId, durationDays, credits } = body;

    if (!type || !amount) {
      return NextResponse.json({ error: 'Thiếu thông tin thanh toán' }, { status: 400 });
    }

    const adminDb = getAdminDb();
    // 1. Tạo order pending
    const orderRef = adminDb.collection('orders').doc();
    await orderRef.set({
      id: orderRef.id,
      userId: uid,
      type,
      planId: planId || null,
      amount,
      status: 'pending',
      paymentProvider: 'mock_system',
      createdAt: FieldValue.serverTimestamp(),
    });

    // 2. Giả lập thanh toán thành công ngay lập tức
    // Trong thực tế, đoạn này sẽ nằm ở webhook của cổng thanh toán
    await orderRef.update({
      status: 'paid',
      paidAt: FieldValue.serverTimestamp(),
      transactionId: `mock_${Date.now()}`
    });

    // 3. Kích hoạt quyền lợi tương ứng
    if (type === 'subscription' && durationDays) {
      await activatePremium(uid, durationDays, orderRef.id);
    } else if (type === 'credit' && credits) {
      await addCredits(uid, credits, `Nạp ${credits} credits tự động`, orderRef.id);
    }

    return NextResponse.json({ success: true, orderId: orderRef.id });

  } catch (err: any) {
    console.error('Checkout error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
