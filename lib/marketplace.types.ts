// ============================================================
// TypeScript Types — Marketplace Module
// ============================================================

export type MarketplaceTemplateStatus =
  | 'draft'
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'suspended';

export type MarketplaceTemplateCategory =
  | 'modern'
  | 'minimal'
  | 'professional'
  | 'creative'
  | 'tech'
  | 'student'
  | 'marketing'
  | 'sales'
  | 'executive';

export type MarketplaceTemplateStyle =
  | 'single-column'
  | 'two-column'
  | 'sidebar'
  | 'timeline'
  | 'infographic';

export type MarketplaceTemplateRole =
  | 'all'
  | 'developer'
  | 'designer'
  | 'marketing'
  | 'sales'
  | 'accountant'
  | 'student'
  | 'executive';

export type SellerProfileStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export type MarketplaceOrderStatus = 'pending' | 'completed' | 'refunded' | 'disputed';

export type SellerEarningStatus = 'pending' | 'available' | 'paid' | 'held';

// ─── Seller Profile ────────────────────────────────────────────────────────────
export interface SellerProfile {
  uid: string;
  displayName: string;
  avatarUrl?: string;
  bio: string;
  website?: string;
  portfolio?: string;
  status: SellerProfileStatus;
  rejectionReason?: string;
  totalSalesCount: number;
  totalEarningsCredits: number;
  pendingEarningsCredits: number;
  availableEarningsCredits: number;
  paidOutEarningsCredits: number;
  averageRating: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
  approvedAt?: Date | null;
}

// ─── Marketplace Template ──────────────────────────────────────────────────────
export interface MarketplaceTemplate {
  id: string;
  sellerId: string;
  sellerName: string;
  sellerAvatarUrl?: string;
  slug: string;
  name: string;
  shortDescription: string;
  fullDescription: string;
  category: MarketplaceTemplateCategory;
  style: MarketplaceTemplateStyle;
  targetRole: MarketplaceTemplateRole;
  tags: string[];
  layoutType: '1col' | '2col';
  isAtsFriendly: boolean;
  isPremiumStyle: boolean;
  priceCredits: number;
  thumbnailUrl: string;
  previewImageUrls: string[];
  templateConfigId?: string;
  status: MarketplaceTemplateStatus;
  rejectionReason?: string;
  totalSalesCount: number;
  favoritesCount: number;
  averageRating: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
  approvedAt?: Date | null;
}

// ─── Template Ownership ────────────────────────────────────────────────────────
export interface TemplateOwnership {
  id: string;
  userId: string;
  templateId: string;
  orderId: string;
  priceCredits: number;
  createdAt: Date;
}

// ─── Marketplace Order ─────────────────────────────────────────────────────────
export interface MarketplaceOrder {
  id: string;
  buyerId: string;
  sellerId: string;
  templateId: string;
  templateName: string;
  templateSlug: string;
  priceCredits: number;
  platformFeeCredits: number;
  sellerEarningCredits: number;
  status: MarketplaceOrderStatus;
  createdAt: Date;
  completedAt?: Date | null;
}

// ─── Seller Earning Transaction ─────────────────────────────────────────────────
export interface SellerEarningTransaction {
  id: string;
  sellerId: string;
  orderId: string;
  templateId: string;
  templateName: string;
  creditsAmount: number;
  status: SellerEarningStatus;
  createdAt: Date;
}

// ─── Template Review ───────────────────────────────────────────────────────────
export interface TemplateReview {
  id: string;
  templateId: string;
  userId: string;
  userName: string;
  userAvatarUrl?: string;
  rating: number; // 1–5
  comment: string;
  createdAt: Date;
}

// ─── Template Report ───────────────────────────────────────────────────────────
export interface TemplateReport {
  id: string;
  templateId: string;
  reporterId: string;
  reason: string;
  details?: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: Date;
  resolvedAt?: Date | null;
}

// ─── Favorite ─────────────────────────────────────────────────────────────────
export interface MarketplaceFavorite {
  id: string;
  userId: string;
  templateId: string;
  createdAt: Date;
}

// ─── Purchase Result ──────────────────────────────────────────────────────────
export interface PurchaseResult {
  success: boolean;
  orderId?: string;
  error?: string;
}
