'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Star, Shield, Zap, TrendingUp, ChevronLeft,
  ChevronRight, Heart, User, Tag, Clock,
} from 'lucide-react';
import PurchaseButton from '@/components/marketplace/PurchaseButton';
import {
  getMarketplaceTemplateBySlug,
  getReviewsByTemplate,
  checkOwnership,
  isFavorited,
  toggleFavorite,
} from '@/lib/marketplace.firestore';
import { useAuth } from '@/hooks/useAuth';
import type { MarketplaceTemplate, TemplateReview } from '@/lib/marketplace.types';

export default function TemplateDetailPage() {
  const params = useParams<{ slug: string }>();
  const { user, firebaseUser } = useAuth();
  const [template, setTemplate] = useState<MarketplaceTemplate | null>(null);
  const [reviews, setReviews] = useState<TemplateReview[]>([]);
  const [owned, setOwned] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
    if (!params?.slug) return;
    (async () => {
      setLoading(true);
      // Load template first — reviews query needs template.id (doc ID), NOT slug
      const tmpl = await getMarketplaceTemplateBySlug(params.slug);
      setTemplate(tmpl);

      if (tmpl) {
        // BUG-8 FIX: use tmpl.id not params.slug for reviews query
        const revs = await getReviewsByTemplate(tmpl.id);
        setReviews(revs);

        if (firebaseUser) {
          const [o, f] = await Promise.all([
            checkOwnership(firebaseUser.uid, tmpl.id),
            isFavorited(firebaseUser.uid, tmpl.id),
          ]);
          setOwned(o);
          setFavorited(f);
        }
      }
      setLoading(false);
    })();
  }, [params?.slug, firebaseUser]);

  async function handleFavToggle() {
    if (!firebaseUser || !template) return;
    setFavorited((p) => !p);
    await toggleFavorite(firebaseUser.uid, template.id);
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <div className="skeleton" style={{ width: '48px', height: '48px', borderRadius: '50%', margin: '0 auto 12px' }} />
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
        <p style={{ fontSize: '3rem' }}>😕</p>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Template không tồn tại</h1>
        <Link href="/marketplace" className="btn btn-primary">← Quay lại Marketplace</Link>
      </div>
    );
  }

  const images = template.previewImageUrls.length > 0
    ? template.previewImageUrls
    : [template.thumbnailUrl];

  const stars = Array.from({ length: 5 }, (_, i) => i + 1);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Nav */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(248,250,255,0.85)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border)', padding: '14px 0',
      }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/marketplace" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.88rem', fontWeight: 500 }}>
            <ChevronLeft size={15} /> Marketplace
          </Link>
          <span style={{ color: 'var(--text-muted)' }}>/</span>
          <span style={{ fontSize: '0.88rem', color: 'var(--text-primary)', fontWeight: 600 }}>{template.name}</span>
        </div>
      </nav>

      <div className="container" style={{ padding: '40px 24px 80px', display: 'grid', gridTemplateColumns: '1fr 360px', gap: '48px', alignItems: 'start' }}>
        {/* LEFT: Preview + Info */}
        <div>
          {/* Preview Gallery */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: '20px', overflow: 'hidden', marginBottom: '24px',
            }}
          >
            {/* Main image */}
            <div style={{ position: 'relative', aspectRatio: '3/4', background: '#f8faff' }}>
              <Image
                src={images[activeImg] || '/placeholder-template.png'}
                alt={`${template.name} preview ${activeImg + 1}`}
                fill
                style={{ objectFit: 'contain' }}
              />

              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveImg((p) => (p - 1 + images.length) % images.length)}
                    style={{
                      position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                      width: '36px', height: '36px', borderRadius: '50%',
                      background: 'rgba(255,255,255,0.9)', border: 'none',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                    }}
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={() => setActiveImg((p) => (p + 1) % images.length)}
                    style={{
                      position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                      width: '36px', height: '36px', borderRadius: '50%',
                      background: 'rgba(255,255,255,0.9)', border: 'none',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                    }}
                  >
                    <ChevronRight size={18} />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div style={{ display: 'flex', gap: '8px', padding: '12px', overflowX: 'auto' }}>
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    style={{
                      flexShrink: 0, width: '64px', height: '80px',
                      borderRadius: '8px', overflow: 'hidden', border: '2px solid',
                      borderColor: i === activeImg ? 'var(--primary)' : 'var(--border)',
                      cursor: 'pointer', padding: 0, background: 'none',
                    }}
                  >
                    <Image src={img} alt={`thumb ${i + 1}`} width={64} height={80} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Template info */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            {/* Badges */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
              <span className="badge badge-primary">{template.category}</span>
              {template.isAtsFriendly && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 12px', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: 600, background: 'rgba(16,185,129,0.1)', color: '#059669', border: '1px solid rgba(16,185,129,0.25)' }}>
                  <Shield size={12} /> ATS-friendly
                </span>
              )}
              {template.isPremiumStyle && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 12px', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: 600, background: 'linear-gradient(135deg,rgba(245,158,11,0.15),rgba(236,72,153,0.15))', color: '#d97706', border: '1px solid rgba(245,158,11,0.25)' }}>
                  <Zap size={12} /> Premium Style
                </span>
              )}
            </div>

            <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 800, marginBottom: '8px' }}>{template.name}</h1>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '20px' }}>{template.fullDescription}</p>

            {/* Stats */}
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', padding: '16px 20px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '14px', marginBottom: '20px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', gap: '2px', justifyContent: 'center', marginBottom: '4px' }}>
                  {stars.map((s) => (
                    <Star key={s} size={14} fill={s <= Math.round(template.averageRating) ? '#f59e0b' : 'none'} color={s <= Math.round(template.averageRating) ? '#f59e0b' : '#cbd5e1'} />
                  ))}
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{template.reviewCount} đánh giá</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '1.1rem' }}>{template.totalSalesCount}</p>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>lượt bán</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '1.1rem' }}>{template.layoutType === '2col' ? '2 cột' : '1 cột'}</p>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>bố cục</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '1.1rem' }}>{template.targetRole}</p>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>phù hợp</p>
              </div>
            </div>

            {/* Tags */}
            {template.tags.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <p style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  <Tag size={13} /> Tags
                </p>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {template.tags.map((tag) => (
                    <span key={tag} style={{ padding: '4px 10px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Seller info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '14px', marginBottom: '32px' }}>
              {template.sellerAvatarUrl ? (
                <Image src={template.sellerAvatarUrl} alt={template.sellerName} width={44} height={44} style={{ borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={20} color="white" />
                </div>
              )}
              <div>
                <p style={{ fontWeight: 700, fontSize: '0.92rem' }}>{template.sellerName}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Designer / Seller</p>
              </div>
            </div>

            {/* Reviews */}
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '16px' }}>Đánh giá ({reviews.length})</h2>
              {reviews.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Chưa có đánh giá nào. Mua và là người đầu tiên!</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {reviews.slice(0, 5).map((r) => (
                    <div key={r.id} style={{ padding: '16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <p style={{ fontWeight: 600, fontSize: '0.88rem' }}>{r.userName}</p>
                        <div style={{ display: 'flex', gap: '2px' }}>
                          {stars.map((s) => <Star key={s} size={11} fill={s <= r.rating ? '#f59e0b' : 'none'} color={s <= r.rating ? '#f59e0b' : '#cbd5e1'} />)}
                        </div>
                      </div>
                      <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{r.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* RIGHT: Sticky purchase panel */}
        <div style={{ position: 'sticky', top: '80px' }}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '20px', padding: '24px', boxShadow: 'var(--shadow-lg)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Giá</p>
                <p style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--primary)' }}>
                  {template.priceCredits} <span style={{ fontSize: '1rem', fontWeight: 600 }}>credits</span>
                </p>
              </div>
              <button
                onClick={handleFavToggle}
                style={{
                  width: '40px', height: '40px', borderRadius: '50%',
                  background: favorited ? 'rgba(236,72,153,0.1)' : 'var(--bg-card)',
                  border: '1.5px solid', borderColor: favorited ? '#ec4899' : 'var(--border)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Heart size={18} fill={favorited ? '#ec4899' : 'none'} color={favorited ? '#ec4899' : 'var(--text-muted)'} />
              </button>
            </div>

            <PurchaseButton
              template={template}
              isOwned={owned}
              onPurchaseSuccess={() => setOwned(true)}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
