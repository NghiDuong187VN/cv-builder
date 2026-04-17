const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || 'duongquangnghi187@gmail.com';
const supportPhone = process.env.NEXT_PUBLIC_SUPPORT_PHONE?.trim() || '0971959473 (Zalo)';
const liveChatProvider = process.env.NEXT_PUBLIC_LIVE_CHAT_PROVIDER?.trim().toLowerCase() || '';
const crispWebsiteId = process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID?.trim() || '';
const tawkSrc = process.env.NEXT_PUBLIC_TAWK_SRC?.trim() || '';

export const SUPPORT_INFO = {
  teamName: process.env.NEXT_PUBLIC_SUPPORT_TEAM_NAME?.trim() || 'NghiDuongQuang',
  role: process.env.NEXT_PUBLIC_SUPPORT_ROLE?.trim() || 'Admin / Người sáng lập',
  email: supportEmail,
  phone: supportPhone,
  supportHours:
    process.env.NEXT_PUBLIC_SUPPORT_HOURS?.trim() || 'Thứ 2 - Thứ 7, 08:00 - 22:00',
  message:
    'Nếu bạn gặp lỗi khi tạo CV, xuất PDF hoặc thanh toán, hãy liên hệ đội ngũ hỗ trợ để được phản hồi nhanh nhất.',
} as const;

export const LIVE_CHAT_CONFIG = {
  provider: liveChatProvider,
  crispWebsiteId,
  tawkSrc,
  enabled:
    (liveChatProvider === 'crisp' && Boolean(crispWebsiteId)) ||
    (liveChatProvider === 'tawk' && Boolean(tawkSrc)),
} as const;
