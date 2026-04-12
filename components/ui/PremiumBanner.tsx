'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Crown, ArrowRight, Sparkles, X } from 'lucide-react';
import { useState } from 'react';

interface PremiumBannerProps {
  variant?: 'inline' | 'compact' | 'floating';
  context?: 'templates' | 'dashboard' | 'cv-limit' | 'analytics' | 'ai';
  onDismiss?: () => void;
  className?: string;
}

const CONTEXT_CONTENT: Record<string, { title: string; desc: string; cta: string }> = {
  templates: {
    title: 'Mở khóa toàn bộ thư viện mẫu CV cao cấp',
    desc: 'Hơn 50 mẫu chuyên nghiệp theo ngành giúp hồ sơ nổi bật ngay từ cái nhìn đầu tiên.',
    cta: 'Xem gói Premium',
  },
  dashboard: {
    title: 'CV của bạn đang được nhiều người xem',
    desc: 'Nâng cấp Premium để xem chi tiết ai đang xem, từ đâu và CV nào hiệu quả nhất.',
    cta: 'Xem Analytics',
  },
  'cv-limit': {
    title: 'Bạn đã đạt giới hạn 3 CV miễn phí',
    desc: 'Nâng cấp Premium để tạo không giới hạn CV, phù hợp ứng tuyển nhiều vị trí cùng lúc.',
    cta: 'Nâng cấp ngay',
  },
  analytics: {
    title: 'Theo dõi hiệu quả CV của bạn',
    desc: 'Xem lượt xem, clicks, nguồn truy cập và so sánh hiệu quả giữa các CV khác nhau.',
    cta: 'Mở khóa Analytics',
  },
  ai: {
    title: 'AI nâng cấp nội dung CV của bạn',
    desc: 'Biến mô tả kinh nghiệm ngắn, nhạt thành câu văn thuyết phục đúng ngôn ngữ tuyển dụng.',
    cta: 'Dùng thử AI',
  },
};

export default function PremiumBanner({
  variant = 'inline',
  context = 'dashboard',
  onDismiss,
}: PremiumBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const content = CONTEXT_CONTENT[context] ?? CONTEXT_CONTENT.dashboard;

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  if (variant === 'compact') {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 16px',
          background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(236,72,153,0.08))',
          border: '1px solid rgba(245,158,11,0.25)',
          borderRadius: '12px',
          position: 'relative',
        }}
      >
        <div style={{
          width: '32px', height: '32px', borderRadius: '9px', flexShrink: 0,
          background: 'linear-gradient(135deg, #f59e0b, #ec4899)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Crown size={16} color="white" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '2px' }}>
            {content.title}
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {content.desc}
          </p>
        </div>
        <Link
          href="/pricing"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            padding: '6px 14px', borderRadius: '8px', whiteSpace: 'nowrap',
            background: 'linear-gradient(135deg, #f59e0b, #ec4899)',
            color: 'white', fontSize: '0.8rem', fontWeight: 700,
            textDecoration: 'none', flexShrink: 0,
          }}
        >
          {content.cta} <ArrowRight size={12} />
        </Link>
        {onDismiss && (
          <button
            onClick={handleDismiss}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--text-muted)', flexShrink: 0 }}
          >
            <X size={14} />
          </button>
        )}
      </motion.div>
    );
  }

  // inline (default) – full width card
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #1a0533 0%, #0f172a 50%, #1a0c0c 100%)',
        borderRadius: '20px',
        padding: '28px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '24px',
        flexWrap: 'wrap',
        border: '1px solid rgba(245,158,11,0.2)',
      }}
    >
      {/* Decorative blobs */}
      <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '160px', height: '160px', borderRadius: '50%', background: 'rgba(245,158,11,0.15)', filter: 'blur(40px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-40px', left: '40%', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(236,72,153,0.15)', filter: 'blur(30px)', pointerEvents: 'none' }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative' }}>
        <div style={{
          width: '52px', height: '52px', borderRadius: '14px', flexShrink: 0,
          background: 'linear-gradient(135deg, #f59e0b, #ec4899)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(245,158,11,0.4)',
        }}>
          <Crown size={24} color="white" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{
              padding: '2px 10px', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 700,
              background: 'linear-gradient(135deg, #f59e0b, #ec4899)', color: 'white',
            }}>PREMIUM</span>
            <Sparkles size={14} color="#f59e0b" />
          </div>
          <p style={{ fontWeight: 800, fontSize: '1.05rem', color: 'white', marginBottom: '4px' }}>
            {content.title}
          </p>
          <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.5, maxWidth: '480px' }}>
            {content.desc}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', position: 'relative', flexShrink: 0 }}>
        <Link
          href="/pricing"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '12px 24px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #f59e0b, #ec4899)',
            color: 'white', fontWeight: 700, fontSize: '0.92rem',
            textDecoration: 'none',
            boxShadow: '0 8px 24px rgba(245,158,11,0.4)',
            transition: 'all 0.25s ease',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
            (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 32px rgba(245,158,11,0.5)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
            (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(245,158,11,0.4)';
          }}
        >
          <Crown size={16} /> {content.cta}
        </Link>
        {onDismiss && (
          <button
            onClick={handleDismiss}
            style={{
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '8px', padding: '8px', cursor: 'pointer', color: 'rgba(255,255,255,0.6)',
              transition: 'all 0.2s',
            }}
          >
            <X size={16} />
          </button>
        )}
      </div>
    </motion.div>
  );
}
