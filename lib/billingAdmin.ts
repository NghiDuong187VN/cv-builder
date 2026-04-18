import { getAdminDb } from './firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

export async function spendCredits(userId: string, amount: number, reason: string) {
  if (amount <= 0) return;

  const adminDb = getAdminDb();
  const userRef = adminDb.collection('users').doc(userId);
  
  await adminDb.runTransaction(async (transaction) => {
    const doc = await transaction.get(userRef);
    if (!doc.exists) throw new Error('User not found');
    
    const data = doc.data();
    const currentCredits = data?.credits || 0;
    
    if (currentCredits < amount) {
      throw new Error('Not enough credits');
    }
    
    transaction.update(userRef, {
      credits: FieldValue.increment(-amount),
      updatedAt: FieldValue.serverTimestamp(),
    });
    
    // Create transaction log
    const txRef = adminDb.collection('creditTransactions').doc();
    transaction.set(txRef, {
      id: txRef.id,
      userId,
      type: 'spend',
      amount: -amount,
      reason,
      createdAt: FieldValue.serverTimestamp(),
    });
  });
}

export async function addCredits(userId: string, amount: number, reason: string, relatedOrderId?: string) {
  if (amount <= 0) return;

  const adminDb = getAdminDb();
  const userRef = adminDb.collection('users').doc(userId);
  
  await adminDb.runTransaction(async (transaction) => {
    const doc = await transaction.get(userRef);
    if (!doc.exists) throw new Error('User not found');
    
    transaction.update(userRef, {
      credits: FieldValue.increment(amount),
      updatedAt: FieldValue.serverTimestamp(),
    });
    
    // Create transaction log
    const txRef = adminDb.collection('creditTransactions').doc();
    transaction.set(txRef, {
      id: txRef.id,
      userId,
      type: 'topup',
      amount,
      reason,
      relatedOrderId: relatedOrderId || null,
      createdAt: FieldValue.serverTimestamp(),
    });
  });
}

export async function activatePremium(userId: string, durationDays: number, orderId?: string) {
  const adminDb = getAdminDb();
  const userRef = adminDb.collection('users').doc(userId);
  
  await adminDb.runTransaction(async (transaction) => {
    const doc = await transaction.get(userRef);
    if (!doc.exists) throw new Error('User not found');
    
    const data = doc.data();
    let currentExpiry = data?.premiumUntil || data?.planExpiry;
    
    let newExpiryDate: Date;
    const now = new Date();
    
    if (currentExpiry) {
      const parsedExpiry = currentExpiry instanceof Date
        ? currentExpiry
        : typeof currentExpiry.toDate === 'function' ? currentExpiry.toDate() : new Date(currentExpiry as string);
        
      if (parsedExpiry > now) {
        // Extend existing premium
        parsedExpiry.setDate(parsedExpiry.getDate() + durationDays);
        newExpiryDate = parsedExpiry;
      } else {
        // Started from now
        const nd = new Date();
        nd.setDate(nd.getDate() + durationDays);
        newExpiryDate = nd;
      }
    } else {
      const nd = new Date();
      nd.setDate(nd.getDate() + durationDays);
      newExpiryDate = nd;
    }
    
    transaction.update(userRef, {
      plan: 'premium',
      premiumUntil: newExpiryDate,
      planExpiry: newExpiryDate, // Sync old field
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
}
