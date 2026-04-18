import type { User } from './types';

export interface PremiumPlanConfig {
  id: string;
  name: string;
  duration: string;
  durationDays: number;
  months: number;
  price: number;
  avgPerMonth: number;
  badge?: string;
  description: string;
  ctaLabel: string;
}

export interface TopUpPackageConfig {
  id: string;
  amount: number;
  credits: number;
  label: string;
  description: string;
  ctaLabel: string;
}

export interface PlanGuideOption {
  id: string;
  situation: string;
  recommendation: string;
  description: string;
}

/* ─── Single source of truth for key pricing values ─── */
export const BASE_MONTHLY_PRICE = 49000;
export const CREDIT_RATE_VND = 1000;
export const MIN_CUSTOM_TOPUP = 10000;

export const PREMIUM_PLANS: PremiumPlanConfig[] = [
  {
    id: 'premium_monthly',
    name: '1 tháng',
    duration: '1 tháng',
    durationDays: 30,
    months: 1,
    price: 49000,
    avgPerMonth: 49000,
    description: 'Phù hợp khi bạn đang ứng tuyển gấp hoặc cần tối ưu hồ sơ trong thời gian ngắn.',
    ctaLabel: 'Chọn gói 1 tháng',
  },
  {
    id: 'premium_quarterly',
    name: '3 tháng',
    duration: '3 tháng',
    durationDays: 90,
    months: 3,
    price: 99000,
    avgPerMonth: 33000,
    badge: 'Phổ biến nhất',
    description: 'Lựa chọn cân bằng nhất cho giai đoạn nộp CV liên tục và cần tối ưu nhiều phiên bản.',
    ctaLabel: 'Chọn gói 3 tháng',
  },
  {
    id: 'premium_biannual',
    name: '6 tháng',
    duration: '6 tháng',
    durationDays: 180,
    months: 6,
    price: 169000,
    avgPerMonth: 28167,
    description: 'Phù hợp với sinh viên chuẩn bị thực tập, tốt nghiệp hoặc người đang chuyển ngành.',
    ctaLabel: 'Chọn gói 6 tháng',
  },
  {
    id: 'premium_yearly',
    name: '1 năm',
    duration: '1 năm',
    durationDays: 365,
    months: 12,
    price: 299000,
    avgPerMonth: 24917,
    badge: 'Tiết kiệm nhất',
    description: 'Dành cho người muốn duy trì hồ sơ chuyên nghiệp lâu dài và tối ưu liên tục cho nhiều cơ hội.',
    ctaLabel: 'Chọn gói 1 năm',
  },
];

export const TOP_UP_PACKAGES: TopUpPackageConfig[] = [
  {
    id: 'topup_10',
    amount: 10000,
    credits: 10,
    label: '10 credits',
    description: 'Phù hợp khi bạn chỉ cần dùng thử một vài tính năng trả phí.',
    ctaLabel: 'Nạp ngay',
  },
  {
    id: 'topup_20',
    amount: 20000,
    credits: 22,
    label: '22 credits',
    description: 'Tặng thêm 2 credits so với quy đổi thường.',
    ctaLabel: 'Nạp ngay',
  },
  {
    id: 'topup_30',
    amount: 30000,
    credits: 35,
    label: '35 credits',
    description: 'Tặng thêm 5 credits, dễ dùng cho nhiều tính năng AI.',
    ctaLabel: 'Nạp ngay',
  },
  {
    id: 'topup_50',
    amount: 50000,
    credits: 60,
    label: '60 credits',
    description: 'Tặng thêm 10 credits, thích hợp dùng trong ngắn hạn.',
    ctaLabel: 'Nạp ngay',
  },
  {
    id: 'topup_100',
    amount: 100000,
    credits: 130,
    label: '130 credits',
    description: 'Tặng thêm 30 credits, tiết kiệm nhất khi nạp nhiều.',
    ctaLabel: 'Nạp ngay',
  },
];

export const FEATURE_COSTS = {
  createPremiumCv: 1,
  exportPremiumPdf: 1,
  aiSummary: 2,
  aiRewrite: 2,
  atsReview: 5,
  coverLetter: 5,
};

export interface CreditUsageRule {
  label: string;
  credits: number;
}

export const CREDIT_USAGE_TABLE: CreditUsageRule[] = [
  { label: 'Tạo 1 CV Premium', credits: FEATURE_COSTS.createPremiumCv },
  { label: 'Xuất PDF Premium', credits: FEATURE_COSTS.exportPremiumPdf },
  { label: 'AI Summary', credits: FEATURE_COSTS.aiSummary },
  { label: 'AI Rewrite Experience', credits: FEATURE_COSTS.aiRewrite },
  { label: 'ATS Review', credits: FEATURE_COSTS.atsReview },
  { label: 'Cover Letter', credits: FEATURE_COSTS.coverLetter },
];

/** @deprecated Use TOP_UP_PACKAGES directly */
export const CREDIT_RATES = TOP_UP_PACKAGES;

/** Formatted starting price string for display, e.g. "49.000đ" */
export function getStartingPriceLabel(): string {
  return `${BASE_MONTHLY_PRICE.toLocaleString('vi-VN')}đ`;
}

export const FREE_PLAN_FEATURES = [
  'Free Forever',
  '0đ mãi mãi',
  'Tạo và lưu tối đa 3 CV',
  'Mẫu CV cơ bản',
  'Xuất PDF cơ bản',
  'Chia sẻ link CV',
  'AI tạo phần tóm tắt cơ bản: 3 lượt/ngày',
];

export const PREMIUM_PLAN_FEATURES = [
  'Không giới hạn số CV',
  'Mở khóa toàn bộ mẫu CV cao cấp',
  'AI viết lại kinh nghiệm theo vị trí ứng tuyển',
  'ATS Review theo JD',
  'AI tạo cover letter theo target job/company/JD',
  'Lưu cover letter vào tài khoản',
  'Tối ưu CV cho nhiều vị trí khác nhau',
];

export const PLAN_GUIDE_OPTIONS: PlanGuideOption[] = [
  {
    id: 'guide_free',
    situation: 'Chỉ tạo CV cơ bản',
    recommendation: 'Free',
    description: 'Đủ để bắt đầu, lưu tối đa 3 CV và dùng các mẫu cơ bản.',
  },
  {
    id: 'guide_credits',
    situation: 'Cần tạo 1-2 CV Premium',
    recommendation: 'Mua lượt',
    description: 'Trả đúng theo nhu cầu, không cần đăng ký gói tháng.',
  },
  {
    id: 'guide_monthly',
    situation: 'Đang ứng tuyển nhiều vị trí',
    recommendation: 'Premium 1 tháng',
    description: 'Tập trung tối ưu nhanh CV, ATS review và cover letter trong giai đoạn nộp hồ sơ.',
  },
  {
    id: 'guide_quarterly',
    situation: 'Muốn dùng tiết kiệm hơn',
    recommendation: 'Premium 3 tháng',
    description: 'Chi phí theo tháng tốt nhất cho phần lớn người dùng đang tìm việc.',
  },
  {
    id: 'guide_biannual',
    situation: 'Sinh viên chuẩn bị thực tập hoặc tốt nghiệp',
    recommendation: 'Premium 6 tháng',
    description: 'Đủ dài để chuẩn bị CV, cover letter và tối ưu nhiều đợt ứng tuyển.',
  },
  {
    id: 'guide_yearly',
    situation: 'Muốn dùng lâu dài',
    recommendation: 'Premium 1 năm',
    description: 'Tiết kiệm nhất nếu bạn muốn duy trì hồ sơ chuyên nghiệp lâu dài.',
  },
];


export function isPremium(user: Partial<User> | null): boolean {
  if (!user) return false;

  const legacyUser = user as Partial<User> & { premiumUntil?: unknown; planExpiry?: unknown };
  const expiry = legacyUser.premiumUntil || legacyUser.planExpiry;
  if (expiry) {
    const expiryDate =
      expiry instanceof Date
        ? expiry
        : typeof (expiry as { toDate?: () => Date }).toDate === 'function'
          ? (expiry as { toDate: () => Date }).toDate()
          : new Date(expiry as string);

    if (expiryDate.getTime() > Date.now()) return true;
  }

  return user.plan === 'premium';
}

export function hasEnoughCredits(user: Partial<User> | null, requiredCredits: number): boolean {
  if (!user) return false;
  const legacyUser = user as Partial<User> & { credits?: number };
  return (legacyUser.credits || 0) >= requiredCredits;
}

export function canUsePremiumTemplate(user: Partial<User> | null): boolean {
  return isPremium(user) || hasEnoughCredits(user, FEATURE_COSTS.createPremiumCv);
}

export function canUseAiSummary(user: Partial<User> | null): boolean {
  return isPremium(user) || hasEnoughCredits(user, FEATURE_COSTS.aiSummary);
}

export function canUseAiRewrite(user: Partial<User> | null): boolean {
  return isPremium(user) || hasEnoughCredits(user, FEATURE_COSTS.aiRewrite);
}

export function canUseAtsReview(user: Partial<User> | null): boolean {
  return isPremium(user) || hasEnoughCredits(user, FEATURE_COSTS.atsReview);
}

export function canUseCoverLetter(user: Partial<User> | null): boolean {
  return isPremium(user) || hasEnoughCredits(user, FEATURE_COSTS.coverLetter);
}
