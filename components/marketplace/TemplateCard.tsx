'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Star, ShoppingCart, Eye, Heart, Shield, TrendingUp, Zap } from 'lucide-react';
import type { MarketplaceTemplate } from '@/lib/marketplace.types';

interface TemplateCardProps {
  template: MarketplaceTemplate;
  isOwned?: boolean;
  isFavorited?: boolean;
  onFavoriteToggle?: (templateId: string) => void;
  index?: number;
}

export default function TemplateCard({
  template,
  isOwned = false,
  isFavorited = false,
  onFavoriteToggle,
  index = 0,
}: TemplateCardProps) {
  const stars = Array.from({ length: 5 }, (_, i) => i + 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-md)',
        transition: 'var(--transition)',
        display: 'flex',
        flexDirection: 'column',
      }}
      whileHover={{ y: -6, boxShadow: '0 16px 48px rgba(99,102,241,0.2)' }}
    >
      {/* Thumbnail */}
      <div style={{ position: 'relative', aspectRatio: '3/4', overflow: 'hidden', background: '#f1f5f9' }}>
        <Image
          src={template.thumbnailUrl || '/placeholder-template.png'}
          alt={template.name}
          fill
          style={{ objectFit: 'cover', transition: 'transform 0.4s ease' }}
        />

        {/* Overlay on hover */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)',
          opacity: 0,
          transition: 'opacity 0.3s',
          display: 'flex',
          alignItems: 'flex-end',
          padding: '16px',
          gap: '8px',
        }}
          className="card-overlay"
        >
          <Link
            href={`/marketplace/${template.slug}`}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '6px', padding: '8px 12px', borderRadius: '10px',
              background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
              color: 'white', fontWeight: 600, fontSize: '0.82rem',
              textDecoration: 'none', border: '1px solid rgba(255,255,255,0.25)',
            }}
          >
            <Eye size={14} /> Xem trước
          </Link>
        </div>

        {/* Badges */}
        <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {template.isAtsFriendly && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              padding: '3px 8px', borderRadius: '9999px', fontSize: '0.68rem', fontWeight: 700,
              background: 'rgba(16,185,129,0.9)', color: 'white', backdropFilter: 'blur(4px)',
            }}>
              <Shield size={9} /> ATS
            </span>
          )}
          {template.isPremiumStyle && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              padding: '3px 8px', borderRadius: '9999px', fontSize: '0.68rem', fontWeight: 700,
              background: 'linear-gradient(135deg,#f59e0b,#ec4899)', color: 'white',
            }}>
              <Zap size={9} /> Premium Style
            </span>
          )}
          {isOwned && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              padding: '3px 8px', borderRadius: '9999px', fontSize: '0.68rem', fontWeight: 700,
              background: 'rgba(99,102,241,0.9)', color: 'white', backdropFilter: 'blur(4px)',
            }}>
              ✓ Đã sở hữu
            </span>
          )}
        </div>

        {/* Favorite btn */}
        {onFavoriteToggle && (
          <button
            onClick={() => onFavoriteToggle(template.id)}
            style={{
              position: 'absolute', top: '10px', right: '10px',
              width: '32px', height: '32px', borderRadius: '50%',
              background: isFavorited ? 'rgba(236,72,153,0.9)' : 'rgba(255,255,255,0.85)',
              border: 'none', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              backdropFilter: 'blur(4px)', transition: 'all 0.2s',
            }}
          >
            <Heart size={14} fill={isFavorited ? 'white' : 'none'} color={isFavorited ? 'white' : '#94a3b8'} />
          </button>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* Name & category */}
        <div>
          <p style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>
            {template.category}
          </p>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>
            {template.name}
          </h3>
        </div>

        {/* Short desc */}
        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5, flex: 1 }}>
          {template.shortDescription}
        </p>

        {/* Rating & sales */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '1px' }}>
            {stars.map((s) => (
              <Star
                key={s}
                size={11}
                fill={s <= Math.round(template.averageRating) ? '#f59e0b' : 'none'}
                color={s <= Math.round(template.averageRating) ? '#f59e0b' : '#cbd5e1'}
              />
            ))}
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            {template.averageRating > 0 ? template.averageRating.toFixed(1) : '—'}
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>·</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
            <TrendingUp size={10} /> {template.totalSalesCount} bán
          </div>
        </div>

        {/* Seller */}
        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          bởi <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{template.sellerName}</span>
        </p>

        {/* Price & CTA */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            padding: '4px 10px', borderRadius: '9999px',
            background: 'rgba(99,102,241,0.1)', color: 'var(--primary)',
            fontSize: '0.82rem', fontWeight: 800,
          }}>
            <Zap size={11} /> {template.priceCredits} credits
          </div>

          <Link
            href={`/marketplace/${template.slug}`}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              padding: '7px 14px', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 700,
              background: isOwned ? 'rgba(16,185,129,0.12)' : 'var(--gradient-primary)',
              color: isOwned ? '#059669' : 'white',
              textDecoration: 'none', border: isOwned ? '1px solid rgba(16,185,129,0.3)' : 'none',
              boxShadow: isOwned ? 'none' : '0 4px 12px rgba(99,102,241,0.3)',
            }}
          >
            {isOwned ? '✓ Dùng ngay' : <><ShoppingCart size={12} /> Mua</>}
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
