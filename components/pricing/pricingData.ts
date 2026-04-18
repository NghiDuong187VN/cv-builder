import { CREDIT_USAGE_TABLE } from '@/lib/billing';

export type ComparisonRow = {
  label: string;
  free: string | boolean;
  credits: string | boolean;
  premium: string | boolean;
};

export const HERO_SUMMARY_CARDS = [
  { title: 'Free', subtitle: 'Bắt đầu miễn phí', tone: 'free' as const },
  { title: 'Credits', subtitle: 'Trả theo nhu cầu', tone: 'credits' as const },
  { title: 'Premium', subtitle: 'Tối ưu toàn diện', tone: 'premium' as const },
];

export const PREMIUM_FEATURE_HIGHLIGHTS = [
  'CV không giới hạn',
  'Toàn bộ template Premium',
  'PDF không watermark',
  'AI Summary & AI Rewrite',
  'ATS Review theo JD',
  'Cover Letter cá nhân hóa',
];

export const CREDIT_EXPLAINERS = [
  {
    title: 'Credits dùng để làm gì?',
    body: 'Dùng cho từng tác vụ trả phí như AI Rewrite, ATS Review, Cover Letter hoặc xuất CV Premium.',
  },
  {
    title: 'Ai nên mua Credits?',
    body: 'Phù hợp khi bạn chỉ cần 1–2 CV hoặc dùng vài tính năng trả phí theo từng đợt.',
  },
  {
    title: 'Khi nào nên mua Premium?',
    body: 'Nếu đang ứng tuyển liên tục và cần dùng AI nhiều, Premium sẽ tiết kiệm hơn rõ rệt.',
  },
];

export const COMPARISON_ROWS: ComparisonRow[] = [
  { label: 'Số lượng CV', free: 'Tối đa 3 CV', credits: 'Không giới hạn', premium: 'Không giới hạn' },
  { label: 'Template Premium', free: false, credits: '1 credit/lần', premium: true },
  { label: 'PDF không watermark', free: false, credits: '1 credit/lần', premium: true },
  { label: 'AI Summary', free: '3 lần/ngày', credits: '2 credits/lần', premium: true },
  { label: 'AI Rewrite', free: false, credits: '2 credits/lần', premium: true },
  { label: 'ATS Review', free: false, credits: '5 credits/lần', premium: true },
  { label: 'Cover Letter', free: false, credits: '5 credits/lần', premium: true },
  { label: 'Public Profile nâng cao', free: false, credits: false, premium: true },
  { label: 'Application Tracker', free: false, credits: false, premium: true },
  {
    label: 'Phù hợp với ai',
    free: 'Người mới bắt đầu',
    credits: 'Người dùng theo nhu cầu',
    premium: 'Người ứng tuyển nhiều vị trí',
  },
];

export const PLAN_ADVICE_CARDS = [
  {
    title: 'Free',
    description: 'Dành cho người mới bắt đầu.',
    caption: 'Tạo CV cơ bản, làm quen nền tảng và bắt đầu ứng tuyển ngay.',
  },
  {
    title: 'Credits',
    description: 'Dành cho người cần 1–2 CV hoặc vài tính năng trả phí.',
    caption: 'Nạp theo nhu cầu, dùng bao nhiêu trả bấy nhiêu.',
  },
  {
    title: 'Premium',
    description: 'Dành cho người đang ứng tuyển nhiều vị trí.',
    caption: 'Mở khóa AI toàn diện để tối ưu CV nhanh và đồng bộ.',
  },
];

export const AI_BEFORE_AFTER_SAMPLE = {
  before:
    'Bán hàng part-time, tư vấn khách hàng về sản phẩm và hỗ trợ tại quầy.',
  after:
    'Tư vấn và hỗ trợ khách hàng lựa chọn sản phẩm phù hợp nhu cầu, góp phần tăng tỷ lệ hài lòng tại cửa hàng; chủ động xử lý phản hồi và phối hợp đội nhóm để cải thiện trải nghiệm mua sắm.',
  highlights: ['Bổ sung kết quả cụ thể', 'Dùng ngôn ngữ chuyên nghiệp hơn', 'Nhấn mạnh tác động và kỹ năng phù hợp tuyển dụng'],
};

export const PRICING_FAQS = [
  {
    q: 'Free có đủ để bắt đầu không?',
    a: 'Có. Free phù hợp để tạo CV cơ bản và bắt đầu ứng tuyển ngay. Khi cần AI nâng cao hoặc template Premium, bạn có thể nâng cấp bất kỳ lúc nào.',
  },
  {
    q: 'Premium khác gì so với Credits?',
    a: 'Premium là gói theo thời gian, dùng toàn diện các tính năng trong gói. Credits là hình thức trả theo lượt, phù hợp khi chỉ cần dùng một vài tính năng trả phí.',
  },
  {
    q: 'Credits có hết hạn không?',
    a: 'Hiện tại credits không hết hạn. Bạn có thể nạp khi cần và dùng dần theo nhu cầu.',
  },
  {
    q: 'Khi đã có Premium thì có bị trừ credits không?',
    a: 'Không. Nếu tính năng nằm trong Premium còn hạn, hệ thống không trừ credits.',
  },
  {
    q: 'Thanh toán hiện hoạt động thế nào?',
    a: 'CVFlow hỗ trợ chuyển khoản thủ công. Sau khi thanh toán, bạn gửi xác nhận qua email hỗ trợ để được kích hoạt nhanh.',
  },
];

export const CREDIT_USAGE_ITEMS = CREDIT_USAGE_TABLE;
