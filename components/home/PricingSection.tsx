'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Check, Crown, Sparkles, Zap } from 'lucide-react';

type PlanTier = 'free' | 'premium';

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
    name: 'Mien Phi',
    nameEn: 'Free Forever',
    price: '0d',
    period: 'mai mai',
    icon: Zap,
    gradient: 'linear-gradient(135deg, #06b6d4, #6366f1)',
    forWho: 'Nguoi can tao CV dep, dung nhanh va chua can toi uu sau cho tung vi tri.',
    features: [
      { text: 'Tao va luu toi da 3 CV' },
      { text: 'Thu vien template co ban' },
      { text: 'Xuat PDF va chia se link CV' },
      { text: 'Ho tro song ngu Viet / Anh' },
      { text: 'Gemini tao summary co ban: 3 luot moi ngay', highlight: true },
    ],
    cta: 'Bat dau mien phi',
    ctaBg: 'linear-gradient(135deg, #06b6d4, #6366f1)',
    href: '/auth',
  },
  {
    id: 'premium',
    name: 'Premium',
    nameEn: 'Ban CV de ung tuyen nghiem tuc',
    price: '79.000d',
    period: '/thang',
    badge: 'Pho bien nhat',
    icon: Crown,
    gradient: 'linear-gradient(135deg, #f59e0b, #ec4899, #8b5cf6)',
    forWho: 'Nguoi dang ung tuyen nhieu vi tri va muon AI giup chinh noi dung de tang ti le qua vong.',
    features: [
      { text: 'Khong gioi han so CV va mo khoa toan bo template cao cap', highlight: true },
      { text: 'Gemini rewrite tung muc kinh nghiem de manh hon', highlight: true },
      { text: 'ATS Optimizer: diem so, gap, keyword missing, recommendations', highlight: true },
      { text: 'AI tao cover letter theo target job va JD', highlight: true },
      { text: 'Nhap target job, target company va job description ngay trong editor' },
      { text: 'PDF sach, CV dep hon, toi uu cho ung tuyen nghiem tuc' },
    ],
    cta: 'Nang cap Premium',
    popular: true,
    ctaBg: 'linear-gradient(135deg, #f59e0b, #ec4899, #8b5cf6)',
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
        transform: plan.popular ? 'scale(1.02)' : 'scale(1)',
        display: 'flex',
        flexDirection: 'column',
      } as React.CSSProperties}
    >
      {plan.badge && (
        <div
          style={{
            position: 'absolute',
            top: '-16px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '5px 20px',
            background: 'linear-gradient(135deg, #f59e0b, #ec4899)',
            borderRadius: '9999px',
            color: 'white',
            fontSize: '0.75rem',
            fontWeight: 800,
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 16px rgba(245,158,11,0.4)',
          }}
        >
          {plan.badge}
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <div
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '14px',
            background: plan.gradient,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
            boxShadow: '0 6px 20px rgba(99,102,241,0.3)',
          }}
        >
          <plan.icon size={24} color="white" />
        </div>
        <h3 style={{ fontWeight: 800, fontSize: '1.4rem', marginBottom: '4px' }}>{plan.name}</h3>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '12px' }}>{plan.nameEn}</p>
        <div style={{ padding: '8px 12px', borderRadius: '10px', background: 'rgba(99,102,241,0.06)', border: '1px solid var(--border)' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            <strong style={{ color: 'var(--text-primary)' }}>Phu hop:</strong> {plan.forWho}
          </p>
        </div>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <span style={{ fontWeight: 900, fontSize: '2.4rem', color: 'var(--text-primary)', lineHeight: 1 }}>{plan.price}</span>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginLeft: '4px' }}>{plan.period}</span>
        {plan.id !== 'free' && (
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Thanh toan hang thang, huy bat cu luc nao
          </p>
        )}
      </div>

      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px', flex: 1 }}>
        {plan.features.map((feature) => (
          <li key={feature.text} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <div
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                flexShrink: 0,
                marginTop: '1px',
                background: feature.highlight ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Check size={12} color={feature.highlight ? '#d97706' : '#10b981'} strokeWidth={3} />
            </div>
            <span
              style={{
                fontSize: '0.88rem',
                color: feature.highlight ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: feature.highlight ? 600 : 400,
                lineHeight: 1.5,
              }}
            >
              {feature.highlight && (
                <Sparkles size={11} style={{ marginRight: '4px', color: '#f59e0b', display: 'inline', verticalAlign: 'middle' }} />
              )}
              {feature.text}
            </span>
          </li>
        ))}
      </ul>

      <Link
        href={plan.href}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          padding: '14px',
          borderRadius: '14px',
          color: 'white',
          fontWeight: 700,
          fontSize: '0.95rem',
          textDecoration: 'none',
          background: plan.ctaBg,
          boxShadow: plan.popular ? '0 8px 28px rgba(245,158,11,0.45)' : '0 4px 16px rgba(99,102,241,0.25)',
          transition: 'all 0.25s ease',
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
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: '9999px',
              background: 'rgba(245,158,11,0.1)',
              border: '1px solid rgba(245,158,11,0.25)',
              marginBottom: '16px',
            }}
          >
            <Crown size={14} color="#f59e0b" />
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#d97706' }}>Bang gia don gian, ban duoc ngay</span>
          </div>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800, marginBottom: '16px' }}>
            Free de vao nhanh.
            <br />
            <span className="gradient-text">Premium de ung tuyen nghiem tuc.</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '620px', margin: '0 auto', fontSize: '1rem', lineHeight: 1.7 }}>
            Goi mien phi cho nguoi moi bat dau. Goi Premium mo khoa toan bo khung AI gia tri nhat:
            rewrite kinh nghiem, ATS review va cover letter theo tung job.
          </p>
        </motion.div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px',
            maxWidth: '860px',
            margin: '0 auto 80px',
            alignItems: 'stretch',
          }}
        >
          {plans.map((plan, index) => (
            <PlanCard key={plan.id} plan={plan} index={index} />
          ))}
        </div>

        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '24px' }}>
            {[
              { icon: 'Gemini', text: 'AI server-side, khong lo API key' },
              { icon: 'ATS', text: 'Phan tich theo target job va JD' },
              { icon: 'PDF', text: 'Editor va xuat CV da san sang cho user that' },
              { icon: 'Save', text: 'Cover letter luu thang vao tai khoan' },
            ].map((item) => (
              <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>{item.icon}</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{item.text}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
