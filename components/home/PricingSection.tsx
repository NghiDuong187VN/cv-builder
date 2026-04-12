'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Check, Zap, Crown, ArrowRight } from 'lucide-react';

const plans = [
  {
    name: 'Miễn Phí',
    nameEn: 'Free Forever',
    price: '0đ',
    period: 'mãi mãi',
    icon: Zap,
    gradient: 'linear-gradient(135deg, #06b6d4, #6366f1)',
    features: [
      'Tạo tối đa 3 CV',
      '20+ mẫu CV miễn phí',
      'Tải PDF cơ bản',
      'Chia sẻ link CV',
      'Profile cá nhân công khai',
      'Hỗ trợ song ngữ Việt / Anh',
    ],
    cta: 'Bắt đầu miễn phí',
    popular: false,
    ctaStyle: { background: 'linear-gradient(135deg, #06b6d4, #6366f1)' },
  },
  {
    name: 'Premium',
    nameEn: 'Unlock Everything',
    price: '79.000đ',
    period: '/tháng',
    icon: Crown,
    gradient: 'linear-gradient(135deg, #f59e0b, #ec4899, #8b5cf6)',
    features: [
      'Tạo không giới hạn CV',
      '50+ mẫu CV (bao gồm premium)',
      'Tải PDF chất lượng cao',
      'Tùy chỉnh theme sâu hơn',
      'Job-based CV riêng biệt',
      'Analytics: xem lượt views',
      'Profile đẹp hơn + slogan',
      'Ưu tiên hỗ trợ 24/7',
    ],
    cta: 'Nâng cấp ngay',
    popular: true,
    ctaStyle: { background: 'linear-gradient(135deg, #f59e0b, #ec4899, #8b5cf6)' },
  },
];

export default function PricingSection() {
  return (
    <section className="section" id="pricing" style={{ background: 'rgba(99,102,241,0.03)' }}>
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ textAlign: 'center', marginBottom: '56px' }}
        >
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '6px 16px', borderRadius: '9999px',
            background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)',
            marginBottom: '16px',
          }}>
            <Crown size={14} color="#f59e0b" />
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#d97706' }}>Bảng giá đơn giản</span>
          </div>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800, marginBottom: '16px' }}>
            Chọn gói phù hợp
            <br />
            <span className="gradient-text">với bạn</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto' }}>
            Bắt đầu hoàn toàn miễn phí. Nâng cấp khi bạn cần thêm.
          </p>
        </motion.div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px',
          maxWidth: '760px',
          margin: '0 auto',
        }}>
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              style={{
                position: 'relative',
                background: plan.popular
                  ? 'linear-gradient(var(--bg-card), var(--bg-card)) padding-box, linear-gradient(135deg, #f59e0b, #ec4899, #8b5cf6) border-box'
                  : 'var(--bg-card)',
                border: plan.popular ? '2px solid transparent' : '1px solid var(--border)',
                borderRadius: '24px',
                padding: '32px',
                backdropFilter: 'blur(12px)',
                boxShadow: plan.popular ? 'var(--shadow-xl)' : 'var(--shadow-md)',
                transform: plan.popular ? 'scale(1.03)' : 'scale(1)',
              } as React.CSSProperties}
            >
              {plan.popular && (
                <div style={{
                  position: 'absolute',
                  top: '-14px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  padding: '4px 20px',
                  background: 'linear-gradient(135deg, #f59e0b, #ec4899)',
                  borderRadius: '9999px',
                  color: 'white',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                }}>
                  ⭐ Phổ Biến Nhất
                </div>
              )}

              {/* Icon */}
              <div style={{
                width: '52px', height: '52px', borderRadius: '14px',
                background: plan.gradient,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '20px',
                boxShadow: '0 4px 16px rgba(99,102,241,0.3)',
              }}>
                <plan.icon size={24} color="white" />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontWeight: 800, fontSize: '1.3rem', marginBottom: '4px' }}>{plan.name}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{plan.nameEn}</p>
              </div>

              <div style={{ marginBottom: '28px' }}>
                <span style={{ fontWeight: 800, fontSize: '2.2rem', color: 'var(--text-primary)' }}>{plan.price}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginLeft: '4px' }}>{plan.period}</span>
              </div>

              {/* Features */}
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
                {plan.features.map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <div style={{
                      width: '20px', height: '20px', borderRadius: '50%',
                      flexShrink: 0,
                      background: 'rgba(16,185,129,0.12)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Check size={12} color="#10b981" strokeWidth={3} />
                    </div>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/auth"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '14px',
                  borderRadius: '14px',
                  color: 'white',
                  fontWeight: 700,
                  textDecoration: 'none',
                  transition: 'all 0.25s ease',
                  ...plan.ctaStyle,
                  boxShadow: plan.popular ? '0 8px 24px rgba(245,158,11,0.4)' : '0 4px 16px rgba(99,102,241,0.3)',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                  (e.currentTarget as HTMLElement).style.boxShadow = plan.popular
                    ? '0 12px 32px rgba(245,158,11,0.5)'
                    : '0 8px 24px rgba(99,102,241,0.4)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLElement).style.boxShadow = plan.popular
                    ? '0 8px 24px rgba(245,158,11,0.4)'
                    : '0 4px 16px rgba(99,102,241,0.3)';
                }}
              >
                {plan.cta} <ArrowRight size={16} />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
