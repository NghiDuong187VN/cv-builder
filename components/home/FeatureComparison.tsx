'use client';

import { motion } from 'framer-motion';
import { Check, Crown, Minus, Zap } from 'lucide-react';
import Link from 'next/link';

type CellValue = boolean | string | 'limited';

interface CompareRow {
  label: string;
  free: CellValue;
  premium: CellValue;
  highlight?: boolean;
}

interface CompareGroup {
  title: string;
  icon: string;
  rows: CompareRow[];
}

const COMPARE_GROUPS: CompareGroup[] = [
  {
    title: 'Tạo và lưu CV',
    icon: 'CV',
    rows: [
      { label: 'Số CV có thể tạo', free: 'Tối đa 3', premium: 'Không giới hạn' },
      { label: 'Mẫu CV cơ bản', free: true, premium: true },
      { label: 'Mẫu cao cấp theo ngành', free: false, premium: true, highlight: true },
      { label: 'Lưu tự động', free: true, premium: true },
      { label: 'Tùy chỉnh sâu hơn cho nhiều vị trí', free: false, premium: true },
    ],
  },
  {
    title: 'AI và tối ưu ứng tuyển',
    icon: 'AI',
    rows: [
      { label: 'Gemini tạo phần tóm tắt cơ bản', free: '3 lượt/ngày', premium: true, highlight: true },
      { label: 'AI viết lại từng mục kinh nghiệm', free: false, premium: true, highlight: true },
      { label: 'ATS review: điểm số, thiếu sót và từ khóa', free: false, premium: true, highlight: true },
      { label: 'AI tạo cover letter theo JD', free: false, premium: true, highlight: true },
      { label: 'Nhập target job, company, job description trong editor', free: true, premium: true },
    ],
  },
  {
    title: 'Xuất bản và chia sẻ',
    icon: 'PDF',
    rows: [
      { label: 'Xuất PDF', free: true, premium: true },
      { label: 'Link chia sẻ CV công khai', free: true, premium: true },
      { label: 'Bản CV sạch hơn để ứng tuyển nghiêm túc', free: 'Cơ bản', premium: true },
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
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: '9999px',
              background: 'rgba(99,102,241,0.1)',
              border: '1px solid rgba(99,102,241,0.2)',
              marginBottom: '16px',
            }}
          >
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--primary)' }}>So sánh thực tế</span>
          </div>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 800, marginBottom: '12px' }}>
            Gói nào <span className="gradient-text">bán được</span> nhất?
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '620px', margin: '0 auto', fontSize: '1rem' }}>
            Bảng này chỉ giữ những gì đang có thật trong sản phẩm để người dùng thấy rõ giá trị nâng cấp.
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
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr repeat(2, 180px)',
              background: 'rgba(99,102,241,0.04)',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <div style={{ padding: '24px 28px' }}>
              <p style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-muted)' }}>Tính năng</p>
            </div>
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                style={{
                  padding: '20px 16px',
                  textAlign: 'center',
                  borderLeft: '1px solid var(--border)',
                  background: plan.popular ? 'rgba(245,158,11,0.05)' : 'transparent',
                  position: 'relative',
                }}
              >
                {plan.popular && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      padding: '2px 14px',
                      background: 'linear-gradient(135deg, #f59e0b, #ec4899)',
                      borderRadius: '9999px',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      color: 'white',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Bán chạy nhất
                  </div>
                )}
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: plan.gradient, margin: '0 auto 8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <plan.icon size={18} color="white" />
                </div>
                <p style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '4px' }}>{plan.name}</p>
                <p style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>
                  {plan.price}
                  <span style={{ fontSize: '0.72rem', fontWeight: 500, color: 'var(--text-muted)' }}> {plan.period}</span>
                </p>
              </div>
            ))}
          </div>

          {COMPARE_GROUPS.map((group, groupIndex) => (
            <div key={group.title}>
              <div
                style={{
                  padding: '14px 28px',
                  background: 'rgba(99,102,241,0.04)',
                  borderTop: groupIndex > 0 ? '1px solid var(--border)' : 'none',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary)' }}>{group.icon}</span>
                <p style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>{group.title}</p>
              </div>

              {group.rows.map((row, rowIndex) => (
                <div
                  key={row.label}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr repeat(2, 180px)',
                    borderBottom: rowIndex < group.rows.length - 1 ? '1px solid var(--border)' : 'none',
                    background: row.highlight ? 'rgba(245,158,11,0.03)' : 'transparent',
                  }}
                >
                  <div style={{ padding: '13px 28px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {row.highlight && (
                      <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '1px 7px', borderRadius: '9999px', background: 'rgba(245,158,11,0.12)', color: '#d97706', border: '1px solid rgba(245,158,11,0.2)' }}>
                        HOT
                      </span>
                    )}
                    <span style={{ fontSize: '0.87rem', color: 'var(--text-secondary)' }}>{row.label}</span>
                  </div>
                  <div style={{ padding: '13px 16px', borderLeft: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CellIcon value={row.free} />
                  </div>
                  <div style={{ padding: '13px 16px', borderLeft: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(245,158,11,0.03)' }}>
                    <CellIcon value={row.premium} />
                  </div>
                </div>
              ))}
            </div>
          ))}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr repeat(2, 180px)',
              borderTop: '1px solid var(--border)',
              background: 'rgba(99,102,241,0.04)',
            }}
          >
            <div style={{ padding: '20px 28px' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Bắt đầu ngay hôm nay.</p>
            </div>
            {PLANS.map((plan) => (
              <div key={plan.name} style={{ padding: '16px 12px', borderLeft: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Link
                  href={plan.href}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '9px 0',
                    background: plan.ctaBg,
                    color: 'white',
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    textDecoration: 'none',
                    textAlign: 'center',
                  }}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
