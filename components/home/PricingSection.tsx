'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Check, Zap, Crown, Rocket, ArrowRight, Sparkles } from 'lucide-react';

type PlanTier = 'free' | 'premium' | 'pro';

interface Feature {
  text: string;
  highlight?: boolean;
}

interface Plan {
  id: PlanTier;
  name: string;
  nameEn: string;
  price: string;
  period: string;
  badge?: string;
  icon: typeof Zap;
  gradient: string;
  forWho: string;
  features: Feature[];
  cta: string;
  popular?: boolean;
  ctaBg: string;
  href: string;
}

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Miễn Phí',
    nameEn: 'Free Forever',
    price: '0đ',
    period: 'mãi mãi',
    icon: Zap,
    gradient: 'linear-gradient(135deg, #06b6d4, #6366f1)',
    forWho: 'Người mới tạo CV lần đầu, sinh viên cần CV cơ bản nhanh.',
    features: [
      { text: 'Tạo và lưu tối đa 3 CV' },
      { text: '8 mẫu CV cơ bản, đẹp, dễ dùng' },
      { text: 'Xuất PDF chất lượng tốt' },
      { text: 'Chia sẻ link CV công khai' },
      { text: 'Hồ sơ cá nhân đơn giản' },
      { text: 'Hỗ trợ song ngữ Việt / Anh' },
    ],
    cta: 'Bắt đầu miễn phí',
    ctaBg: 'linear-gradient(135deg, #06b6d4, #6366f1)',
    href: '/auth',
  },
  {
    id: 'premium',
    name: 'Premium',
    nameEn: 'Ứng tuyển hiệu quả hơn',
    price: '79.000đ',
    period: '/tháng',
    badge: '⭐ Phổ Biến Nhất',
    icon: Crown,
    gradient: 'linear-gradient(135deg, #f59e0b, #ec4899, #8b5cf6)',
    forWho: 'Người muốn CV chuyên nghiệp hơn, ứng tuyển nghiêm túc nhiều vị trí.',
    features: [
      { text: 'Tạo không giới hạn CV cho nhiều vị trí', highlight: true },
      { text: 'Toàn bộ 50+ mẫu CV cao cấp theo ngành', highlight: true },
      { text: 'PDF sạch, chất lượng cao, không watermark', highlight: true },
      { text: 'AI viết lại nội dung CV thuyết phục hơn', highlight: true },
      { text: 'Chấm điểm CV & gợi ý cải thiện' },
      { text: 'ATS Optimizer – tăng cơ hội vua vòng lọc tự động' },
      { text: 'Tùy chỉnh layout, font, màu sắc sâu hơn' },
      { text: 'Analytics: biết ai đang xem CV của bạn' },
      { text: 'Hồ sơ online đẹp hơn + slogan cá nhân' },
      { text: 'Ưu tiên hỗ trợ 24/7' },
    ],
    cta: 'Nâng cấp Premium',
    popular: true,
    ctaBg: 'linear-gradient(135deg, #f59e0b, #ec4899, #8b5cf6)',
    href: '/auth',
  },
  {
    id: 'pro',
    name: 'Pro',
    nameEn: 'Hồ sơ cá nhân toàn diện',
    price: '149.000đ',
    period: '/tháng',
    icon: Rocket,
    gradient: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
    forWho: 'Freelancer, người đi làm, ứng tuyển thường xuyên hoặc cần portfolio.',
    features: [
      { text: 'Toàn bộ tính năng Premium', highlight: true },
      { text: 'AI tạo cover letter theo từng vị trí', highlight: true },
      { text: 'Trang portfolio cá nhân cao cấp (tenban.cvflow.vn)', highlight: true },
      { text: 'CV song ngữ tự động (Việt ↔ Anh)' },
      { text: 'Báo cáo analytics chi tiết & xuất data' },
      { text: 'So sánh hiệu quả nhiều CV cùng lúc' },
      { text: 'Tư vấn CV 1:1 với chuyên gia (1 buổi/tháng)' },
      { text: 'Thư viện 100+ mẫu nội dung theo ngành' },
    ],
    cta: 'Dùng thử Pro',
    ctaBg: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
    href: '/auth',
  },
];

function PlanCard({ plan, index }: { plan: Plan; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.12, duration: 0.5 }}
      style={{
        position: 'relative',
        background: plan.popular
          ? 'linear-gradient(var(--bg-card), var(--bg-card)) padding-box, linear-gradient(135deg, #f59e0b, #ec4899, #8b5cf6) border-box'
          : 'var(--bg-card)',
        border: plan.popular ? '2px solid transparent' : '1px solid var(--border)',
        borderRadius: '24px',
        padding: '32px',
        backdropFilter: 'blur(12px)',
        boxShadow: plan.popular ? 'var(--shadow-xl), 0 0 60px rgba(245,158,11,0.15)' : 'var(--shadow-md)',
        transform: plan.popular ? 'scale(1.03)' : 'scale(1)',
        display: 'flex',
        flexDirection: 'column',
      } as React.CSSProperties}
    >
      {/* Popular badge */}
      {plan.badge && (
        <div style={{
          position: 'absolute', top: '-16px', left: '50%',
          transform: 'translateX(-50%)',
          padding: '5px 20px',
          background: 'linear-gradient(135deg, #f59e0b, #ec4899)',
          borderRadius: '9999px', color: 'white',
          fontSize: '0.75rem', fontWeight: 800, whiteSpace: 'nowrap',
          boxShadow: '0 4px 16px rgba(245,158,11,0.4)',
        }}>
          {plan.badge}
        </div>
      )}

      {/* Icon + Name */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{
          width: '52px', height: '52px', borderRadius: '14px',
          background: plan.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '16px', boxShadow: '0 6px 20px rgba(99,102,241,0.3)',
        }}>
          <plan.icon size={24} color="white" />
        </div>
        <h3 style={{ fontWeight: 800, fontSize: '1.4rem', marginBottom: '4px' }}>{plan.name}</h3>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '12px' }}>{plan.nameEn}</p>
        <div style={{ padding: '8px 12px', borderRadius: '10px', background: 'rgba(99,102,241,0.06)', border: '1px solid var(--border)' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            <strong style={{ color: 'var(--text-primary)' }}>Phù hợp:</strong> {plan.forWho}
          </p>
        </div>
      </div>

      {/* Price */}
      <div style={{ marginBottom: '24px' }}>
        <span style={{ fontWeight: 900, fontSize: '2.4rem', color: 'var(--text-primary)', lineHeight: 1 }}>{plan.price}</span>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginLeft: '4px' }}>{plan.period}</span>
        {plan.id !== 'free' && (
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Thanh toán hàng tháng · Hủy bất cứ lúc nào
          </p>
        )}
      </div>

      {/* Features */}
      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px', flex: 1 }}>
        {plan.features.map(f => (
          <li key={f.text} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <div style={{
              width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0, marginTop: '1px',
              background: f.highlight ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Check size={12} color={f.highlight ? '#d97706' : '#10b981'} strokeWidth={3} />
            </div>
            <span style={{
              fontSize: '0.88rem',
              color: f.highlight ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: f.highlight ? 600 : 400,
              lineHeight: 1.5,
            }}>
              {f.highlight && <Sparkles size={11} style={{ marginRight: '4px', color: '#f59e0b', display: 'inline', verticalAlign: 'middle' }} />}
              {f.text}
            </span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <Link
        href={plan.href}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          padding: '14px', borderRadius: '14px', color: 'white',
          fontWeight: 700, fontSize: '0.95rem', textDecoration: 'none',
          background: plan.ctaBg,
          boxShadow: plan.popular
            ? '0 8px 28px rgba(245,158,11,0.45)'
            : '0 4px 16px rgba(99,102,241,0.25)',
          transition: 'all 0.25s ease',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
          (e.currentTarget as HTMLElement).style.boxShadow = plan.popular
            ? '0 14px 36px rgba(245,158,11,0.55)'
            : '0 8px 24px rgba(99,102,241,0.35)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
          (e.currentTarget as HTMLElement).style.boxShadow = plan.popular
            ? '0 8px 28px rgba(245,158,11,0.45)'
            : '0 4px 16px rgba(99,102,241,0.25)';
        }}
      >
        {plan.cta} <ArrowRight size={16} />
      </Link>
    </motion.div>
  );
}

export default function PricingSection() {
  return (
    <section className="section" id="pricing" style={{ background: 'rgba(99,102,241,0.02)' }}>
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ textAlign: 'center', marginBottom: '60px' }}
        >
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '6px 16px', borderRadius: '9999px',
            background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)',
            marginBottom: '16px',
          }}>
            <Crown size={14} color="#f59e0b" />
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#d97706' }}>Bảng giá đơn giản, minh bạch</span>
          </div>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800, marginBottom: '16px' }}>
            Bắt đầu miễn phí.
            <br />
            <span className="gradient-text">Nâng cấp khi bạn sẵn sàng.</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '520px', margin: '0 auto', fontSize: '1rem', lineHeight: 1.7 }}>
            Free đã đủ tốt để tạo CV đẹp. Premium và Pro giúp bạn{' '}
            <strong style={{ color: 'var(--text-primary)' }}>ứng tuyển hiệu quả hơn</strong> và{' '}
            <strong style={{ color: 'var(--text-primary)' }}>nổi bật hơn trước nhà tuyển dụng</strong>.
          </p>
        </motion.div>

        {/* 3 plan cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px',
          maxWidth: '980px',
          margin: '0 auto 80px',
          alignItems: 'stretch',
        }}>
          {plans.map((plan, i) => (
            <PlanCard key={plan.id} plan={plan} index={i} />
          ))}
        </div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          style={{ textAlign: 'center' }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '24px' }}>
            {[
              { icon: '🔒', text: 'Thanh toán an toàn' },
              { icon: '↩️', text: 'Hoàn tiền trong 7 ngày' },
              { icon: '🚫', text: 'Hủy bất cứ lúc nào' },
              { icon: '💬', text: 'Hỗ trợ qua Zalo & Email' },
            ].map(b => (
              <div key={b.text} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.1rem' }}>{b.icon}</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{b.text}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
