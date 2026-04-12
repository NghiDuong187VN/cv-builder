'use client';

import { motion } from 'framer-motion';
import { Check, X, Minus, Crown, Zap, Rocket } from 'lucide-react';
import Link from 'next/link';

type CellValue = boolean | string | 'limited';

interface CompareRow {
  label: string;
  free: CellValue;
  premium: CellValue;
  pro: CellValue;
  highlight?: boolean;
}

interface CompareGroup {
  title: string;
  icon: string;
  rows: CompareRow[];
}

const COMPARE_GROUPS: CompareGroup[] = [
  {
    title: 'Tạo & Lưu CV',
    icon: '📄',
    rows: [
      { label: 'Số CV có thể tạo', free: 'Tối đa 3', premium: 'Không giới hạn', pro: 'Không giới hạn' },
      { label: 'Tạo CV từ template', free: true, premium: true, pro: true },
      { label: 'Lưu tự động', free: true, premium: true, pro: true },
      { label: 'CV theo nhiều vị trí ứng tuyển', free: false, premium: true, pro: true, highlight: true },
      { label: 'CV song ngữ (Việt / Anh)', free: false, premium: true, pro: true },
      { label: 'Kéo thả sắp xếp section', free: false, premium: true, pro: true },
    ],
  },
  {
    title: 'Mẫu CV & Thiết kế',
    icon: '🎨',
    rows: [
      { label: 'Mẫu CV miễn phí', free: '8 mẫu cơ bản', premium: 'Toàn bộ 50+ mẫu', pro: 'Toàn bộ 50+ mẫu' },
      { label: 'Mẫu CV cao cấp theo ngành', free: false, premium: true, pro: true, highlight: true },
      { label: 'Tùy chỉnh màu sắc', free: 'limited', premium: true, pro: true },
      { label: 'Tùy chỉnh font chữ', free: 'limited', premium: true, pro: true },
      { label: 'Tùy chỉnh layout sâu (cột, spacing)', free: false, premium: true, pro: true },
      { label: 'Ảnh đại diện chuyên nghiệp', free: true, premium: true, pro: true },
    ],
  },
  {
    title: 'Xuất bản & Chia sẻ',
    icon: '🚀',
    rows: [
      { label: 'Xuất PDF', free: 'limited', premium: true, pro: true },
      { label: 'PDF chất lượng cao, không watermark', free: false, premium: true, pro: true, highlight: true },
      { label: 'Link chia sẻ CV công khai', free: true, premium: true, pro: true },
      { label: 'Chia sẻ có mật khẩu bảo vệ', free: true, premium: true, pro: true },
      { label: 'Tên miền cá nhân (tenban.cvflow.vn)', free: false, premium: false, pro: true },
      { label: 'Preview đẹp khi chia sẻ Facebook/Zalo', free: false, premium: true, pro: true },
    ],
  },
  {
    title: 'AI & Tối ưu ứng tuyển',
    icon: '🤖',
    rows: [
      { label: 'AI viết lại nội dung CV', free: false, premium: true, pro: true, highlight: true },
      { label: 'AI tạo cover letter', free: false, premium: false, pro: true, highlight: true },
      { label: 'Chấm điểm CV (CV Score)', free: false, premium: true, pro: true },
      { label: 'ATS Optimizer – vượt vòng lọc tự động', free: false, premium: true, pro: true, highlight: true },
      { label: 'Gợi ý từ khóa theo vị trí ứng tuyển', free: false, premium: true, pro: true },
      { label: 'Thư viện mẫu nội dung (100+ mẫu câu)', free: false, premium: true, pro: true },
    ],
  },
  {
    title: 'Portfolio & Profile',
    icon: '🌐',
    rows: [
      { label: 'Trang profile cá nhân công khai', free: 'Cơ bản', premium: 'Nâng cao', pro: 'Cao cấp + custom' },
      { label: 'Giao diện portfolio đẹp hơn', free: false, premium: true, pro: true },
      { label: 'Hiển thị dự án & kỹ năng nổi bật', free: 'limited', premium: true, pro: true },
      { label: 'Trang landing page cá nhân', free: false, premium: false, pro: true, highlight: true },
    ],
  },
  {
    title: 'Analytics & Theo dõi',
    icon: '📊',
    rows: [
      { label: 'Lượt xem CV', free: 'Cơ bản', premium: 'Chi tiết', pro: 'Chi tiết + xuất báo cáo' },
      { label: 'Biết ai đang xem CV của bạn', free: false, premium: true, pro: true, highlight: true },
      { label: 'So sánh hiệu quả nhiều CV', free: false, premium: false, pro: true },
      { label: 'Thống kê lượt tải', free: true, premium: true, pro: true },
    ],
  },
  {
    title: 'Hỗ trợ',
    icon: '💬',
    rows: [
      { label: 'Hỗ trợ cơ bản', free: true, premium: true, pro: true },
      { label: 'Ưu tiên hỗ trợ 24/7', free: false, premium: true, pro: true },
      { label: 'Tư vấn CV 1:1 với chuyên gia', free: false, premium: false, pro: true },
    ],
  },
];

function CellIcon({ value }: { value: CellValue }) {
  if (value === true) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Check size={13} color="#10b981" strokeWidth={3} />
        </div>
      </div>
    );
  }
  if (value === false) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <Minus size={16} color="var(--text-muted)" />
      </div>
    );
  }
  if (value === 'limited') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '2px 8px', borderRadius: '9999px', border: '1px solid rgba(245,158,11,0.2)' }}>Giới hạn</span>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center' }}>{value}</span>
    </div>
  );
}

const PLANS = [
  {
    name: 'Free',
    gradient: 'linear-gradient(135deg, #06b6d4, #6366f1)',
    icon: Zap,
    price: '0đ',
    period: 'mãi mãi',
    cta: 'Bắt đầu',
    href: '/auth',
    ctaBg: 'linear-gradient(135deg, #06b6d4, #6366f1)',
  },
  {
    name: 'Premium',
    gradient: 'linear-gradient(135deg, #f59e0b, #ec4899)',
    icon: Crown,
    price: '79.000đ',
    period: '/tháng',
    cta: 'Nâng cấp',
    href: '/pricing',
    ctaBg: 'linear-gradient(135deg, #f59e0b, #ec4899)',
    popular: true,
  },
  {
    name: 'Pro',
    gradient: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
    icon: Rocket,
    price: '149.000đ',
    period: '/tháng',
    cta: 'Dùng thử Pro',
    href: '/pricing',
    ctaBg: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
  },
];

export default function FeatureComparison() {
  return (
    <section className="section" style={{ background: 'rgba(99,102,241,0.02)' }}>
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ textAlign: 'center', marginBottom: '48px' }}
        >
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '6px 16px', borderRadius: '9999px',
            background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
            marginBottom: '16px',
          }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--primary)' }}>
              📊 So sánh chi tiết
            </span>
          </div>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 800, marginBottom: '12px' }}>
            Tìm gói phù hợp với{' '}
            <span className="gradient-text">nhu cầu của bạn</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '520px', margin: '0 auto', fontSize: '1rem' }}>
            So sánh đầy đủ tính năng giữa các gói để chọn đúng gói phù hợp với mục tiêu nghề nghiệp của bạn.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '24px',
            overflow: 'hidden',
            backdropFilter: 'blur(12px)',
            boxShadow: 'var(--shadow-xl)',
          }}
        >
          {/* Header row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr repeat(3, 160px)',
            background: 'rgba(99,102,241,0.04)',
            borderBottom: '1px solid var(--border)',
          }}>
            <div style={{ padding: '24px 28px' }}>
              <p style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-muted)' }}>Tính năng</p>
            </div>
            {PLANS.map(p => (
              <div key={p.name} style={{
                padding: '20px 16px',
                textAlign: 'center',
                borderLeft: '1px solid var(--border)',
                background: p.popular ? 'rgba(245,158,11,0.05)' : 'transparent',
                position: 'relative',
              }}>
                {p.popular && (
                  <div style={{
                    position: 'absolute', top: 0, left: '50%', transform: 'translate(-50%, -50%)',
                    padding: '2px 14px', background: 'linear-gradient(135deg, #f59e0b, #ec4899)',
                    borderRadius: '9999px', fontSize: '0.65rem', fontWeight: 700, color: 'white', whiteSpace: 'nowrap',
                  }}>
                    ⭐ Phổ biến
                  </div>
                )}
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: p.gradient, margin: '0 auto 8px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <p.icon size={18} color="white" />
                </div>
                <p style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '4px' }}>{p.name}</p>
                <p style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>
                  {p.price}
                  <span style={{ fontSize: '0.72rem', fontWeight: 500, color: 'var(--text-muted)' }}>{p.period}</span>
                </p>
              </div>
            ))}
          </div>

          {/* Feature groups */}
          {COMPARE_GROUPS.map((group, gi) => (
            <div key={group.title}>
              {/* Group header */}
              <div style={{
                padding: '14px 28px',
                background: 'rgba(99,102,241,0.04)',
                borderTop: gi > 0 ? '1px solid var(--border)' : 'none',
                borderBottom: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                <span style={{ fontSize: '1rem' }}>{group.icon}</span>
                <p style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>{group.title}</p>
              </div>

              {/* Rows */}
              {group.rows.map((row, ri) => (
                <div
                  key={row.label}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr repeat(3, 160px)',
                    borderBottom: ri < group.rows.length - 1 ? '1px solid var(--border)' : 'none',
                    background: row.highlight ? 'rgba(245,158,11,0.03)' : 'transparent',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.04)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = row.highlight ? 'rgba(245,158,11,0.03)' : 'transparent'; }}
                >
                  <div style={{ padding: '13px 28px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {row.highlight && (
                      <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '1px 7px', borderRadius: '9999px', background: 'rgba(245,158,11,0.12)', color: '#d97706', border: '1px solid rgba(245,158,11,0.2)' }}>HOT</span>
                    )}
                    <span style={{ fontSize: '0.87rem', color: 'var(--text-secondary)' }}>{row.label}</span>
                  </div>
                  <div style={{ padding: '13px 16px', borderLeft: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CellIcon value={row.free} />
                  </div>
                  <div style={{ padding: '13px 16px', borderLeft: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(245,158,11,0.03)' }}>
                    <CellIcon value={row.premium} />
                  </div>
                  <div style={{ padding: '13px 16px', borderLeft: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CellIcon value={row.pro} />
                  </div>
                </div>
              ))}
            </div>
          ))}

          {/* CTA row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr repeat(3, 160px)',
            borderTop: '1px solid var(--border)',
            background: 'rgba(99,102,241,0.04)',
          }}>
            <div style={{ padding: '20px 28px' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Bắt đầu ngay hôm nay.</p>
            </div>
            {PLANS.map(p => (
              <div key={p.name} style={{ padding: '16px 12px', borderLeft: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Link
                  href={p.href}
                  style={{
                    display: 'block', width: '100%', padding: '9px 0',
                    background: p.ctaBg, color: 'white',
                    borderRadius: '10px', fontWeight: 700, fontSize: '0.82rem',
                    textDecoration: 'none', textAlign: 'center',
                    boxShadow: p.popular ? '0 4px 16px rgba(245,158,11,0.35)' : 'none',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
                >
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
