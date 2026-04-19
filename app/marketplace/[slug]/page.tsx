'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, Shield, Zap, ChevronLeft, ChevronRight,
  Heart, User, Tag, CheckCircle2, Lock, Info, Send,
} from 'lucide-react';
import PurchaseButton from '@/components/marketplace/PurchaseButton';
import {
  getMarketplaceTemplateBySlug,
  getReviewsByTemplate,
  checkOwnership,
  isFavorited,
  toggleFavorite,
  submitReviewViaApi,
} from '@/lib/marketplace.firestore';
import { useAuth } from '@/hooks/useAuth';
import { getIdToken } from 'firebase/auth';
import toast from 'react-hot-toast';
import type { MarketplaceTemplate, TemplateReview } from '@/lib/marketplace.types';

// ─── Star Rating Input ──────────────────────────────────────────────────────────
function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: 'flex', gap: '4px' }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(s)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}
        >
          <Star
            size={24}
            fill={(hover || value) >= s ? '#f59e0b' : 'none'}
            color={(hover || value) >= s ? '#f59e0b' : '#cbd5e1'}
            style={{ transition: 'all 0.15s' }}
          />
        </button>
      ))}
    </div>
  );
}

// ─── Review Form ───────────────────────────────────────────────────────────────
function ReviewForm({
  templateId,
  onSubmitted,
}: {
  templateId: string;
  onSubmitted: () => void;
}) {
  const { firebaseUser } = useAuth();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!firebaseUser) return;
    if (rating === 0) { toast.error('Vui lòng chọn số sao'); return; }
    if (comment.trim().length < 10) { toast.error('Nhận xét cần ít nhất 10 ký tự'); return; }

    setSubmitting(true);
    try {
      const token = await getIdToken(firebaseUser);
      const res = await submitReviewViaApi(templateId, rating, comment, token);
      if (res.success) {
        toast.success('Đánh giá của bạn đã được ghi nhận! 🎉');
        setRating(0);
        setComment('');
        onSubmitted();
      } else {
        toast.error(res.error ?? 'Không thể gửi đánh giá');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      style={{
        padding: '20px', background: 'rgba(99,102,241,0.04)',
        border: '1px solid rgba(99,102,241,0.15)', borderRadius: '14px',
        display: 'flex', flexDirection: 'column', gap: '14px',
      }}
    >
      <div>
        <p style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '10px' }}>
          ✏️ Viết đánh giá của bạn
        </p>
        <StarInput value={rating} onChange={setRating} />
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        placeholder="Chia sẻ trải nghiệm của bạn với template này..."
        className="input"
        style={{ resize: 'vertical', fontSize: '0.88rem' }}
        maxLength={1000}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{comment.length}/1000</p>
        <button
          type="submit"
          disabled={submitting || rating === 0}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '9px 18px', borderRadius: '10px', fontWeight: 700,
            fontSize: '0.85rem', border: 'none', cursor: submitting || rating === 0 ? 'not-allowed' : 'pointer',
            background: rating > 0 ? 'var(--gradient-primary)' : 'var(--border)',
            color: rating > 0 ? 'white' : 'var(--text-muted)',
            boxShadow: rating > 0 ? '0 4px 12px rgba(99,102,241,0.3)' : 'none',
          }}
        >
          <Send size={14} /> {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
        </button>
      </div>
    </motion.form>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function TemplateDetailPage() {
  const params = useParams<{ slug: string }>();
  const { user, firebaseUser, loading: authLoading } = useAuth();
  const [template, setTemplate] = useState<MarketplaceTemplate | null>(null);
  const [reviews, setReviews] = useState<TemplateReview[]>([]);
  const [owned, setOwned] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);

  const loadPage = async () => {
    if (!params?.slug) return;
    setLoading(true);
    const tmpl = await getMarketplaceTemplateBySlug(params.slug);
    setTemplate(tmpl);

    if (tmpl) {
      const revs = await getReviewsByTemplate(tmpl.id);
      setReviews(revs);

      if (firebaseUser) {
        const [o, f] = await Promise.all([
          checkOwnership(firebaseUser.uid, tmpl.id),
          isFavorited(firebaseUser.uid, tmpl.id),
        ]);
        setOwned(o);
        setFavorited(f);
        // Check if user already reviewed
        setHasReviewed(revs.some((r) => r.userId === firebaseUser.uid));
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    if (authLoading) return;
    loadPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.slug, firebaseUser, authLoading]);

  async function handleFavToggle() {
    if (!firebaseUser || !template) {
      toast.error('Đăng nhập để lưu yêu thích');
      return;
    }
    setFavorited((p) => !p);
    await toggleFavorite(firebaseUser.uid, template.id);
  }

  async function handleReviewSubmitted() {
    setReviewSubmitted(true);
    setHasReviewed(true);
    if (template) {
      const revs = await getReviewsByTemplate(template.id);
      setReviews(revs);
    }
  }

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading || authLoading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <div className="container" style={{ padding: '40px 24px', display: 'grid', gridTemplateColumns: '1fr 360px', gap: '48px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="skeleton" style={{ aspectRatio: '3/4', borderRadius: '20px' }} />
            <div className="skeleton" style={{ height: '200px', borderRadius: '16px' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="skeleton" style={{ height: '300px', borderRadius: '20px' }} />
          </div>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: '16px', background: 'var(--bg)',
      }}>
        <p style={{ fontSize: '4rem' }}>😕</p>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          Template không tồn tại
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px' }}>
          Template này không còn hoạt động hoặc slug không đúng.
        </p>
        <Link href="/marketplace" className="btn btn-primary">← Quay lại Marketplace</Link>
      </div>
    );
  }

  const images = template.previewImageUrls?.length > 0
    ? template.previewImageUrls
    : [template.thumbnailUrl];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* ── Nav ───────────────────────────────────────────────────────────── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(248,250,255,0.9)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border)', padding: '14px 0',
      }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link href="/marketplace" style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.88rem', fontWeight: 500 }}>
            <ChevronLeft size={15} /> Marketplace
          </Link>
          <span style={{ color: 'var(--text-muted)' }}>/</span>
          <span style={{ fontSize: '0.88rem', color: 'var(--text-primary)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '240px' }}>
            {template.name}
          </span>
        </div>
      </nav>

      <div className="container" style={{
        padding: '40px 24px 80px',
        display: 'grid',
        gridTemplateColumns: '1fr min(360px, 100%)',
        gap: '48px',
        alignItems: 'start',
      }}>
        {/* ── LEFT ────────────────────────────────────────────────────────── */}
        <div>
          {/* Gallery */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '20px', overflow: 'hidden', marginBottom: '28px' }}
          >
            <div style={{ position: 'relative', aspectRatio: '3/4', background: 'linear-gradient(135deg, #f8faff, #f1f5f9)' }}>
              <Image
                src={images[activeImg] || '/placeholder-cv.png'}
                alt={`${template.name} preview ${activeImg + 1}`}
                fill
                style={{ objectFit: 'contain' }}
                sizes="(max-width: 768px) 100vw, 600px"
              />

              {/* Owned badge overlay */}
              {owned && (
                <div style={{
                  position: 'absolute', top: '14px', left: '14px',
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '6px 12px', borderRadius: '9999px',
                  background: 'rgba(5,150,105,0.92)', backdropFilter: 'blur(8px)',
                  color: 'white', fontSize: '0.78rem', fontWeight: 700,
                }}>
                  <CheckCircle2 size={13} /> Đã sở hữu
                </div>
              )}

              {/* Image nav */}
              {images.length > 1 && (
                <>
                  <button onClick={() => setActiveImg((p) => (p - 1 + images.length) % images.length)}
                    style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.92)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.12)', backdropFilter: 'blur(4px)' }}>
                    <ChevronLeft size={18} />
                  </button>
                  <button onClick={() => setActiveImg((p) => (p + 1) % images.length)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.92)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.12)', backdropFilter: 'blur(4px)' }}>
                    <ChevronRight size={18} />
                  </button>
                  <div style={{ position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '6px' }}>
                    {images.map((_, i) => (
                      <button key={i} onClick={() => setActiveImg(i)}
                        style={{ width: i === activeImg ? '20px' : '8px', height: '8px', borderRadius: '9999px', background: i === activeImg ? 'var(--primary)' : 'rgba(255,255,255,0.6)', border: 'none', cursor: 'pointer', padding: 0, transition: 'all 0.2s' }}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Thumbnail strip */}
            {images.length > 1 && (
              <div style={{ display: 'flex', gap: '8px', padding: '12px 16px', overflowX: 'auto', scrollbarWidth: 'none' }}>
                {images.map((img, i) => (
                  <button key={i} onClick={() => setActiveImg(i)}
                    style={{ flexShrink: 0, width: '60px', height: '76px', borderRadius: '8px', overflow: 'hidden', border: '2.5px solid', borderColor: i === activeImg ? 'var(--primary)' : 'transparent', cursor: 'pointer', padding: 0, background: 'none', boxShadow: i === activeImg ? '0 0 0 2px rgba(99,102,241,0.2)' : 'none', transition: 'all 0.2s' }}>
                    <Image src={img} alt={`preview ${i + 1}`} width={60} height={76} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* ── Info ──────────────────────────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
            {/* Badges */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
              <span style={{ padding: '4px 10px', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 700, background: 'rgba(99,102,241,0.1)', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {template.category}
              </span>
              {template.isAtsFriendly && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 700, background: 'rgba(16,185,129,0.1)', color: '#059669', border: '1px solid rgba(16,185,129,0.2)' }}>
                  <Shield size={11} /> ATS-friendly
                </span>
              )}
              {template.isPremiumStyle && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 700, background: 'linear-gradient(135deg,rgba(245,158,11,0.15),rgba(236,72,153,0.15))', color: '#d97706', border: '1px solid rgba(245,158,11,0.2)' }}>
                  <Zap size={11} /> Premium Style
                </span>
              )}
              <span style={{ padding: '4px 10px', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 600, background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                {template.layoutType === '2col' ? '2 cột' : '1 cột'}
              </span>
            </div>

            <h1 style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 800, marginBottom: '10px', lineHeight: 1.2 }}>
              {template.name}
            </h1>

            {/* Stats bar */}
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', padding: '14px 18px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ display: 'flex', gap: '1px' }}>
                  {[1,2,3,4,5].map((s) => (
                    <Star key={s} size={13} fill={s <= Math.round(template.averageRating) ? '#f59e0b' : 'none'} color={s <= Math.round(template.averageRating) ? '#f59e0b' : '#cbd5e1'} />
                  ))}
                </div>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {template.averageRating > 0 ? template.averageRating.toFixed(1) : '—'}
                </span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  ({template.reviewCount} đánh giá)
                </span>
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                <strong style={{ color: 'var(--text-primary)' }}>{template.totalSalesCount}</strong> lượt bán
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                Vị trí: <strong style={{ color: 'var(--text-primary)' }}>{template.targetRole === 'all' ? 'Đa ngành' : template.targetRole}</strong>
              </div>
            </div>

            {/* Description */}
            <div style={{ marginBottom: '24px' }}>
              {template.fullDescription.split('\n\n').map((para, i) => (
                <p key={i} style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '0.92rem', marginBottom: i < template.fullDescription.split('\n\n').length - 1 ? '14px' : 0 }}>
                  {para}
                </p>
              ))}
            </div>

            {/* Tags */}
            {template.tags.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <p style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                  <Tag size={12} /> Tags
                </p>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {template.tags.map((tag) => (
                    <span key={tag} style={{ padding: '4px 10px', borderRadius: '9999px', fontSize: '0.74rem', fontWeight: 600, background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Seller info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '14px', marginBottom: '28px' }}>
              {template.sellerAvatarUrl ? (
                <Image src={template.sellerAvatarUrl} alt={template.sellerName} width={44} height={44} style={{ borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
              ) : (
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <User size={20} color="white" />
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 700, fontSize: '0.92rem', marginBottom: '2px' }}>{template.sellerName}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Designer · Seller được xác minh ✓</p>
              </div>
            </div>

            {/* ── Reviews section ───────────────────────────────────────── */}
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '16px' }}>
                Đánh giá ({reviews.length})
              </h2>

              {/* Review form — chỉ hiện cho buyer đã sở hữu, chưa review */}
              {owned && !hasReviewed && !reviewSubmitted && (
                <div style={{ marginBottom: '20px' }}>
                  <ReviewForm templateId={template.id} onSubmitted={handleReviewSubmitted} />
                </div>
              )}
              {owned && hasReviewed && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '12px', marginBottom: '20px', fontSize: '0.82rem', color: '#059669', fontWeight: 600 }}>
                  <CheckCircle2 size={15} /> Bạn đã đánh giá template này
                </div>
              )}
              {!firebaseUser && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '12px', marginBottom: '20px', fontSize: '0.82rem', color: 'var(--primary)' }}>
                  <Lock size={13} />
                  <span>
                    <Link href="/auth" style={{ fontWeight: 700, color: 'var(--primary)' }}>Đăng nhập</Link> và mua template để viết đánh giá.
                  </span>
                </div>
              )}
              {firebaseUser && !owned && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: 'rgba(100,116,139,0.06)', border: '1px solid var(--border)', borderRadius: '12px', marginBottom: '20px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  <Info size={13} /> Mua template để có thể viết đánh giá.
                </div>
              )}

              {/* Reviews list */}
              {reviews.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 24px', background: 'var(--bg-card)', border: '1px dashed var(--border)', borderRadius: '14px', color: 'var(--text-muted)' }}>
                  <Star size={32} color="#cbd5e1" style={{ margin: '0 auto 12px' }} />
                  <p style={{ fontWeight: 600, marginBottom: '4px' }}>Chưa có đánh giá nào</p>
                  <p style={{ fontSize: '0.82rem' }}>Hãy là người đầu tiên sau khi mua!</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <AnimatePresence>
                    {reviews.slice(0, 8).map((r, i) => (
                      <motion.div
                        key={r.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        style={{ padding: '16px 18px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                          {r.userAvatarUrl ? (
                            <Image src={r.userAvatarUrl} alt={r.userName} width={32} height={32} style={{ borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                          ) : (
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <User size={15} color="white" />
                            </div>
                          )}
                          <div>
                            <p style={{ fontWeight: 700, fontSize: '0.85rem' }}>{r.userName}</p>
                            <div style={{ display: 'flex', gap: '2px', marginTop: '2px' }}>
                              {[1,2,3,4,5].map((s) => <Star key={s} size={11} fill={s <= r.rating ? '#f59e0b' : 'none'} color={s <= r.rating ? '#f59e0b' : '#cbd5e1'} />)}
                            </div>
                          </div>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{r.comment}</p>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* ── RIGHT: Sticky purchase panel ──────────────────────────────── */}
        <div style={{ position: 'sticky', top: '72px' }}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.12 }}
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '20px', padding: '24px', boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column', gap: '0' }}
          >
            {/* Price & Fav */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Giá</p>
                <p style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--primary)', lineHeight: 1 }}>
                  {template.priceCredits}
                  <span style={{ fontSize: '1rem', fontWeight: 600, marginLeft: '4px', color: 'var(--text-secondary)' }}>credits</span>
                </p>
              </div>
              <button
                onClick={handleFavToggle}
                style={{
                  width: '44px', height: '44px', borderRadius: '50%',
                  background: favorited ? 'rgba(236,72,153,0.1)' : 'var(--bg)',
                  border: '1.5px solid', borderColor: favorited ? '#ec4899' : 'var(--border)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s',
                }}
              >
                <Heart size={18} fill={favorited ? '#ec4899' : 'none'} color={favorited ? '#ec4899' : 'var(--text-muted)'} />
              </button>
            </div>

            {/* Purchase CTA */}
            <PurchaseButton
              template={template}
              isOwned={owned}
              onPurchaseSuccess={() => setOwned(true)}
            />

            {/* Policy box */}
            <div style={{
              marginTop: '16px', padding: '12px 14px', borderRadius: '10px',
              background: 'rgba(100,116,139,0.05)', border: '1px solid var(--border)',
            }}>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                📋 <strong>Chính sách mua:</strong> Bạn mua quyền sử dụng template này vĩnh viễn trong CVFlow.
                Không bao gồm source code. Không được resale hay phân phối lại.
              </p>
            </div>

            {/* Feature list */}
            <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                '✅ Sử dụng không giới hạn lần',
                '✅ Chỉnh sửa trong CVFlow editor',
                '✅ Export PDF chất lượng cao',
                template.isAtsFriendly ? '✅ ATS-friendly' : '📄 Phong cách sáng tạo',
              ].map((item) => (
                <p key={item} style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{item}</p>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
