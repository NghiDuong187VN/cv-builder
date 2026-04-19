/**
 * marketplace.firestore.ts
 * Client-side read functions for the Marketplace.
 * Mutating operations (purchase, submit, review) go through API routes.
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  QueryDocumentSnapshot,
  DocumentData,
  increment,
  updateDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type {
  MarketplaceTemplate,
  SellerProfile,
  TemplateOwnership,
  MarketplaceOrder,
  TemplateReview,
  MarketplaceFavorite,
  SellerEarningTransaction,
} from './marketplace.types';

function toMillis(value: unknown): number {
  if (!value) return 0;
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'object' && value) {
    const v = value as { toMillis?: () => number };
    if (typeof v.toMillis === 'function') return v.toMillis();
  }
  return 0;
}

// ─── Marketplace Templates ─────────────────────────────────────────────────────

export interface MarketplaceFilters {
  category?: string;
  role?: string;
  style?: string;
  priceMin?: number;
  priceMax?: number;
  isAtsFriendly?: boolean;
  search?: string;
  sortBy?: 'newest' | 'popular' | 'rating' | 'price_asc' | 'price_desc';
  cursor?: QueryDocumentSnapshot<DocumentData>;
  pageSize?: number;
}

export async function getApprovedTemplates(
  filters: MarketplaceFilters = {}
): Promise<{ templates: MarketplaceTemplate[]; lastDoc: QueryDocumentSnapshot<DocumentData> | null }> {
  const { category, priceMax, isAtsFriendly, sortBy = 'newest', cursor, pageSize = 20 } = filters;

  const constraints: Parameters<typeof query>[1][] = [
    where('status', '==', 'approved'),
  ];

  if (category && category !== 'all') {
    constraints.push(where('category', '==', category));
  }
  if (priceMax !== undefined) {
    constraints.push(where('priceCredits', '<=', priceMax));
  }
  if (isAtsFriendly) {
    constraints.push(where('isAtsFriendly', '==', true));
  }

  const sortField =
    sortBy === 'popular' ? 'totalSalesCount'
    : sortBy === 'rating' ? 'averageRating'
    : sortBy === 'price_asc' || sortBy === 'price_desc' ? 'priceCredits'
    : 'approvedAt';
  const sortDir = sortBy === 'price_asc' ? 'asc' : 'desc';

  constraints.push(orderBy(sortField, sortDir));
  constraints.push(limit(pageSize));

  if (cursor) {
    constraints.push(startAfter(cursor));
  }

  const q = query(collection(db, 'marketplace_templates'), ...constraints);
  const snap = await getDocs(q);

  let templates = snap.docs.map((d) => ({ ...d.data(), id: d.id } as MarketplaceTemplate));

  // Client-side text filter (Firestore full-text not natively supported)
  if (filters.search) {
    const term = filters.search.toLowerCase();
    templates = templates.filter(
      (t) =>
        t.name.toLowerCase().includes(term) ||
        t.shortDescription.toLowerCase().includes(term) ||
        t.tags.some((tag) => tag.toLowerCase().includes(term))
    );
  }

  const lastDoc = snap.docs[snap.docs.length - 1] ?? null;
  return { templates, lastDoc };
}

export async function getMarketplaceTemplateBySlug(slug: string): Promise<MarketplaceTemplate | null> {
  const q = query(
    collection(db, 'marketplace_templates'),
    where('slug', '==', slug),
    where('status', '==', 'approved'),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { ...snap.docs[0].data(), id: snap.docs[0].id } as MarketplaceTemplate;
}

export async function getMarketplaceTemplateById(id: string): Promise<MarketplaceTemplate | null> {
  const snap = await getDoc(doc(db, 'marketplace_templates', id));
  return snap.exists() ? ({ ...snap.data(), id: snap.id } as MarketplaceTemplate) : null;
}

export async function getTemplatesBySeller(sellerId: string): Promise<MarketplaceTemplate[]> {
  const q = query(
    collection(db, 'marketplace_templates'),
    where('sellerId', '==', sellerId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...d.data(), id: d.id } as MarketplaceTemplate));
}

// ─── Seller Profiles ──────────────────────────────────────────────────────────

export async function getSellerProfile(uid: string): Promise<SellerProfile | null> {
  const snap = await getDoc(doc(db, 'seller_profiles', uid));
  return snap.exists() ? (snap.data() as SellerProfile) : null;
}

export async function saveSellerProfile(uid: string, data: Partial<SellerProfile>): Promise<void> {
  await setDoc(
    doc(db, 'seller_profiles', uid),
    { ...data, uid, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

// ─── Ownership ─────────────────────────────────────────────────────────────────

export async function checkOwnership(userId: string, templateId: string): Promise<boolean> {
  const q = query(
    collection(db, 'template_ownerships'),
    where('userId', '==', userId),
    where('templateId', '==', templateId),
    limit(1)
  );
  const snap = await getDocs(q);
  return !snap.empty;
}

export async function getOwnedTemplates(userId: string): Promise<TemplateOwnership[]> {
  const q = query(
    collection(db, 'template_ownerships'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...d.data(), id: d.id } as TemplateOwnership));
}

// ─── Orders ────────────────────────────────────────────────────────────────────

export async function getOrdersByBuyer(buyerId: string): Promise<MarketplaceOrder[]> {
  const q = query(
    collection(db, 'marketplace_orders'),
    where('buyerId', '==', buyerId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...d.data(), id: d.id } as MarketplaceOrder));
}

export async function getOrdersBySeller(sellerId: string): Promise<MarketplaceOrder[]> {
  const q = query(
    collection(db, 'marketplace_orders'),
    where('sellerId', '==', sellerId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...d.data(), id: d.id } as MarketplaceOrder));
}

// ─── Reviews ──────────────────────────────────────────────────────────────────

export async function getReviewsByTemplate(templateId: string): Promise<TemplateReview[]> {
  const q = query(
    collection(db, 'template_reviews'),
    where('templateId', '==', templateId),
    orderBy('createdAt', 'desc'),
    limit(20)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...d.data(), id: d.id } as TemplateReview));
}

export async function getUserReviewForTemplate(
  userId: string,
  templateId: string
): Promise<TemplateReview | null> {
  const q = query(
    collection(db, 'template_reviews'),
    where('userId', '==', userId),
    where('templateId', '==', templateId),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { ...snap.docs[0].data(), id: snap.docs[0].id } as TemplateReview;
}

export async function submitReview(
  templateId: string,
  userId: string,
  userName: string,
  userAvatarUrl: string | undefined,
  rating: number,
  comment: string
): Promise<string> {
  const ref = doc(collection(db, 'template_reviews'));
  await setDoc(ref, {
    id: ref.id,
    templateId,
    userId,
    userName,
    userAvatarUrl: userAvatarUrl ?? '',
    rating,
    comment,
    createdAt: serverTimestamp(),
  });

  // Update rolling average on template
  const templateRef = doc(db, 'marketplace_templates', templateId);
  const tSnap = await getDoc(templateRef);
  if (tSnap.exists()) {
    const t = tSnap.data() as MarketplaceTemplate;
    const newCount = (t.reviewCount ?? 0) + 1;
    const newAvg = ((t.averageRating ?? 0) * (t.reviewCount ?? 0) + rating) / newCount;
    await updateDoc(templateRef, { reviewCount: newCount, averageRating: parseFloat(newAvg.toFixed(2)) });
  }

  return ref.id;
}

// ─── Favorites ─────────────────────────────────────────────────────────────────

export async function toggleFavorite(userId: string, templateId: string): Promise<boolean> {
  const favId = `${userId}_${templateId}`;
  const favRef = doc(db, 'favorites', favId);
  const snap = await getDoc(favRef);

  const templateRef = doc(db, 'marketplace_templates', templateId);

  if (snap.exists()) {
    await deleteDoc(favRef);
    await updateDoc(templateRef, { favoritesCount: increment(-1) });
    return false;
  } else {
    await setDoc(favRef, {
      id: favId,
      userId,
      templateId,
      createdAt: serverTimestamp(),
    });
    await updateDoc(templateRef, { favoritesCount: increment(1) });
    return true;
  }
}

export async function getFavoritesByUser(userId: string): Promise<MarketplaceFavorite[]> {
  const q = query(
    collection(db, 'favorites'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...d.data(), id: d.id } as MarketplaceFavorite));
}

export async function isFavorited(userId: string, templateId: string): Promise<boolean> {
  const snap = await getDoc(doc(db, 'favorites', `${userId}_${templateId}`));
  return snap.exists();
}

// ─── Seller Earnings ──────────────────────────────────────────────────────────

export async function getEarningsBySeller(sellerId: string): Promise<SellerEarningTransaction[]> {
  const q = query(
    collection(db, 'seller_earning_transactions'),
    where('sellerId', '==', sellerId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...d.data(), id: d.id } as SellerEarningTransaction));
}

// ─── Admin helpers (client) ───────────────────────────────────────────────────

export async function getPendingTemplates(): Promise<MarketplaceTemplate[]> {
  const q = query(
    collection(db, 'marketplace_templates'),
    where('status', '==', 'pending_review'),
    orderBy('createdAt', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...d.data(), id: d.id } as MarketplaceTemplate));
}

export { toMillis as mpToMillis };
